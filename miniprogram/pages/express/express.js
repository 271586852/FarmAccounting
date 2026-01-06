const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')
const expressParser = require('../../util/expressParser')

Page({
  data: {
    currentDate: dateUtil.getToday(),
    dateDisplay: '',
    records: [],
    showCalendar: false,
    showAddModal: false,
    pasteContent: '',
    statistics: {
      totalJu: 0,
      totalGong: 0,
      totalCount: 0
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
          return {
            ...record,
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

    // 为每条记录添加日期
    const recordsToSave = parsedRecords.map(record => ({
      ...record,
      date: this.data.currentDate
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
  }
})

