const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')
const expressParser = require('../../util/expressParser')

// 收件人并入地址，兼容旧数据
const mergeRecipientIntoAddress = (address, recipient) => {
  const addr = (address || '').trim()
  const rec = (recipient || '').trim()
  if (!rec) return addr
  if (!addr) return rec
  if (addr.includes(rec)) return addr
  return `${addr}，${rec}`
}

Page({
  data: {
    currentDate: dateUtil.getToday(),
    dateDisplay: '',
    records: [],
    showCalendar: false,
    showAddModal: false,
    showEditModal: false,
    showExportModal: false,
    pasteContent: '',
    editRecord: {},
    exportText: '',
    statistics: {
      totalJu: 0,
      totalGong: 0,
      totalMixed: 0,
      totalCount: 0,
      totalAll: 0
    }
  },

  onLoad() {
    this.setData({
      dateDisplay: dateUtil.formatDateDisplay(this.data.currentDate)
    })
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
    // 确保自定义 tab 高亮正确
    const tab = this.getTabBar && this.getTabBar()
    if (tab && typeof tab.updateSelected === 'function') {
      tab.updateSelected()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRecords().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 显示日历
   */
  showCalendar() {
    this.setData({
      showCalendar: true
    })
  },

  /**
   * 隐藏日历
   */
  hideCalendar() {
    this.setData({
      showCalendar: false
    })
  },

  /**
   * 日期选择
   */
  onDateSelect(e) {
    const selectedDate = e.detail.date
    this.setData({
      currentDate: selectedDate,
      dateDisplay: dateUtil.formatDateDisplay(selectedDate),
      showCalendar: false
    })
    this.loadRecords()
  },

  /**
   * 加载记录
   */
  loadRecords() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    return dbUtil.getExpressRecordsByDate(this.data.currentDate)
      .then(res => {
        const records = res.data.map(record => {
          const mergedAddress = mergeRecipientIntoAddress(record.address, record.recipient)
          return {
            ...record,
            address: mergedAddress,
            recipient: '',
            createTimeDisplay: dateUtil.formatCreateTime(record.createTime)
          }
        })
        
        // 计算统计信息
        const statistics = expressParser.calculateStatistics(records)
        
        this.setData({
          records: records,
          statistics: statistics
        })
      })
      .catch(err => {
        console.error('加载记录失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  /**
   * 显示添加弹窗
   */
  showAddModal() {
    this.setData({
      showAddModal: true,
      pasteContent: ''
    })
  },

  /**
   * 隐藏添加弹窗
   */
  hideAddModal() {
    this.setData({
      showAddModal: false,
      pasteContent: ''
    })
  },

  /**
   * 隐藏编辑弹窗
   */
  hideEditModal() {
    this.setData({
      showEditModal: false,
      editRecord: {}
    })
  },

  /**
   * 关闭导出弹窗
   */
  hideExportModal() {
    this.setData({
      showExportModal: false,
      exportText: ''
    })
  },

  /**
   * 粘贴内容输入
   */
  onPasteInput(e) {
    this.setData({
      pasteContent: e.detail.value
    })
  },

  /**
   * 解析并保存
   */
  parseAndSave() {
    const content = this.data.pasteContent.trim()
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    // 解析内容
    const parsedRecords = expressParser.parseExpressContent(content)
    
    if (parsedRecords.length === 0) {
      wx.showToast({
        title: '未能解析出有效记录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    // 基于时间戳生成追加顺序，保证新解析的记录排在旧记录之后
    const baseOrder = Date.now()

    // 为每条记录添加日期
    const recordsToSave = parsedRecords.map(record => ({
      ...record,
      date: this.data.currentDate,
      order: baseOrder + record.order
    }))

    // 批量保存
    const savePromises = recordsToSave.map(record => 
      dbUtil.addExpressRecord(record)
    )

    Promise.all(savePromises)
      .then(() => {
        wx.showToast({
          title: `成功添加${parsedRecords.length}条记录`,
          icon: 'success'
        })
        this.hideAddModal()
        this.loadRecords()
      })
      .catch(err => {
        console.error('保存失败:', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  /**
   * 导出为接龙样式并展示
   */
  exportJielong() {
    const { records, dateDisplay, statistics } = this.data

    if (!records || records.length === 0) {
      wx.showToast({
        title: '暂无记录可导出',
        icon: 'none'
      })
      return
    }

    const headerLines = [
      `# ${dateDisplay} 接龙`,
      `汇总：${statistics.totalJu}桔 ${statistics.totalGong}贡 ${statistics.totalMixed}混 / ${statistics.totalCount}单`
    ]
    const listText = expressParser.formatRecordsToJielong(records)
    const exportText = [...headerLines, listText].filter(text => !!text).join('\n')

    this.setData({
      exportText,
      showExportModal: true
    })
  },

  /**
   * 删除记录
   */
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          })

          dbUtil.deleteExpressRecord(id)
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadRecords()
            })
            .catch(err => {
              console.error('删除失败:', err)
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            })
            .finally(() => {
              wx.hideLoading()
            })
        }
      }
    })
  },

  /**
   * 清除当日全部记录
   */
  clearAll() {
    if (!this.data.records || this.data.records.length === 0) {
      wx.showToast({
        title: '暂无可清除记录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认清除',
      content: `确定清除 ${this.data.dateDisplay} 的全部快递记录吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...',
            mask: true
          })

          dbUtil.deleteExpressRecordsByDate(this.data.currentDate)
            .then(() => {
              wx.showToast({
                title: '已清除',
                icon: 'success'
              })
              this.loadRecords()
            })
            .catch(err => {
              console.error('清除失败:', err)
              wx.showToast({
                title: '清除失败',
                icon: 'none'
              })
            })
            .finally(() => {
              wx.hideLoading()
            })
        }
      }
    })
  },

  /**
   * 点击记录，打开编辑弹窗
   */
  onRecordTap(e) {
    const id = e.currentTarget.dataset.id
    const target = this.data.records.find(r => r._id === id)
    if (!target) return
    this.setData({
      showEditModal: true,
      editRecord: { 
        ...target,
        address: mergeRecipientIntoAddress(target.address, target.recipient),
        recipient: ''
      }
    })
  },

  /**
   * 编辑输入
   */
  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    const value = e.detail.value
    this.setData({
      editRecord: {
        ...this.data.editRecord,
        [field]: value
      }
    })
  },

  /**
   * 保存编辑
   */
  saveEdit() {
    const record = this.data.editRecord
    if (!record || !record._id) {
      this.hideEditModal()
      return
    }

    const payload = {
      recorder: (record.recorder || '').trim(),
      phone: (record.phone || '').trim(),
      address: mergeRecipientIntoAddress(record.address, record.recipient).trim(),
      remark: (record.remark || '').trim(),
      quantityJu: parseInt(record.quantityJu || 0, 10) || 0,
      quantityGong: parseInt(record.quantityGong || 0, 10) || 0,
      quantityMixed: parseInt(record.quantityMixed || 0, 10) || 0
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    dbUtil.updateExpressRecord(record._id, payload)
      .then(() => {
        wx.showToast({
          title: '已更新',
          icon: 'success'
        })
        this.hideEditModal()
        this.loadRecords()
      })
      .catch(err => {
        console.error('更新失败:', err)
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  /**
   * 阻止事件冒泡（用于弹窗内容区域）
   */
  stopPropagation() {}
})

