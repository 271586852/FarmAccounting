const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')

Page({
  data: {
    currentDate: dateUtil.getToday(),
    dateDisplay: '',
    records: [],
    showCalendar: false,

    // 编辑弹窗
    showEditModal: false,
    editId: '',
    typeOptions: ['沙糖桔', '贡柑', '茶油', '其他'],
    unitOptions: ['箱', '筐', '袋'],
    saleTypeOptions: ['批发', '业务', '零售'],
    gradeOptions: ['特大', '中大', '中果', '中小', '小果', '次果', '珍珠果', '榨汁果'],
    editForm: {
      type: '',
      customType: '',
      quantity: 0,
      unit: '箱',
      weight: '',
      postage: '',
      customer: '',
      saleType: '',
      grade: '',
      unitPrice: '',
      freight: '',
      handlingFee: '',
      agencyFee: '',
      outBasket: '',
      returnBasket: '',
      deliverer: '',
      receivedAmount: '',
      payee: '',
      paymentMethod: '',
      remark: ''
    }
  },

  onLoad() {
    this.setData({
      dateDisplay: dateUtil.formatDateDisplay(this.data.currentDate)
    })
    this.loadRecords()
  },

  onShow() {
    // 每次显示页面时刷新数据
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
   * 选择日期
   */
  onDateSelect(e) {
    const date = e.detail.date
    this.setData({
      currentDate: date,
      dateDisplay: dateUtil.formatDateDisplay(date),
      showCalendar: false
    })
    this.loadRecords()
  },

  /**
   * 加载记录
   */
  async loadRecords() {
    wx.showLoading({
      title: '加载中...'
    })
    try {
      const res = await dbUtil.getRecordsByDate(this.data.currentDate)
      // 格式化创建时间（数据已经在db.js中按时间倒序排列）
      const records = res.data.map(item => {
        return {
          ...item,
          createTimeDisplay: dateUtil.formatCreateTime(item.createTime)
        }
      })
      this.setData({
        records: records
      })
    } catch (err) {
      console.error('加载记录失败', err)
      let errorMsg = '加载失败'
      if (err.errMsg) {
        if (err.errMsg.includes('permission')) {
          errorMsg = '加载失败：权限不足，请检查数据库权限设置'
        } else if (err.errMsg.includes('collection')) {
          errorMsg = '加载失败：数据库集合不存在，请先创建 records 集合'
        } else if (err.errMsg.includes('env')) {
          errorMsg = '加载失败：云开发环境未配置，请检查 config.js'
        }
      }
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 删除记录
   */
  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          })
          try {
            await dbUtil.deleteRecord(id)
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 从列表中移除
            const records = this.data.records
            records.splice(index, 1)
            this.setData({
              records: records
            })
          } catch (err) {
            console.error('删除失败', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  /**
   * 编辑记录
   */
  onEditRecord(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const record = this.data.records.find(r => r._id === id)
    if (!record) return
    const inOptions = this.data.typeOptions.includes(record.type)
    const type = inOptions ? record.type : '其他'
    const customType = inOptions ? '' : (record.type || '')
    this.setData({
      showEditModal: true,
      editId: id,
      editForm: {
        type,
        customType,
        quantity: record.quantity || 0,
        unit: record.unit || '箱',
        weight: record.weight === 0 || record.weight ? record.weight : '',
        postage: record.postage === 0 || record.postage ? record.postage : '',
        customer: record.customer || '',
        saleType: record.saleType || '',
        grade: record.grade || '',
        unitPrice: record.unitPrice === 0 || record.unitPrice ? record.unitPrice : '',
        freight: record.freight === 0 || record.freight ? record.freight : '',
        handlingFee: record.handlingFee === 0 || record.handlingFee ? record.handlingFee : '',
        agencyFee: record.agencyFee === 0 || record.agencyFee ? record.agencyFee : '',
        outBasket: record.outBasket === 0 || record.outBasket ? record.outBasket : '',
        returnBasket: record.returnBasket === 0 || record.returnBasket ? record.returnBasket : '',
        deliverer: record.deliverer || '',
        receivedAmount: record.receivedAmount === 0 || record.receivedAmount ? record.receivedAmount : '',
        payee: record.payee || '',
        paymentMethod: record.paymentMethod || '',
        remark: record.remark || ''
      }
    })
  },

  closeEditModal() {
    this.setData({
      showEditModal: false,
      editId: '',
      editForm: {
        type: '',
        customType: '',
        quantity: 0,
        unit: '箱',
        weight: '',
        postage: '',
        customer: '',
        saleType: '',
        grade: '',
        unitPrice: '',
        freight: '',
        handlingFee: '',
        agencyFee: '',
        outBasket: '',
        returnBasket: '',
        deliverer: '',
        receivedAmount: '',
        payee: '',
        paymentMethod: '',
        remark: ''
      }
    })
  },

  onEditFieldInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      editForm: {
        ...this.data.editForm,
        [field]: e.detail.value
      }
    })
  },

  onEditOptionSelect(e) {
    const { field, value } = e.currentTarget.dataset
    const isSame = this.data.editForm[field] === value
    const next = isSame ? '' : value
    this.setData({
      editForm: {
        ...this.data.editForm,
        [field]: next,
        ...(field === 'type' ? { customType: next === '其他' ? this.data.editForm.customType : '' } : {})
      }
    })
  },

  async submitEdit() {
    if (!this.data.editId) return
    const f = this.data.editForm
    const finalType = f.type === '其他' ? f.customType : f.type
    if (!finalType || !finalType.trim()) {
      wx.showToast({ title: '请选择/填写种类', icon: 'none' })
      return
    }
    if (!f.quantity || f.quantity <= 0) {
      wx.showToast({ title: '请输入数量', icon: 'none' })
      return
    }
    const parseNum = (v) => {
      if (v === '' || v === null || v === undefined) return null
      const n = parseFloat(v)
      return isNaN(n) ? null : n
    }
    const data = {
      type: finalType.trim(),
      quantity: parseNum(f.quantity) || 0,
      unit: f.unit || '箱',
      weight: parseNum(f.weight),
      postage: parseNum(f.postage),
      customer: f.customer.trim(),
      saleType: f.saleType,
      grade: f.grade,
      unitPrice: parseNum(f.unitPrice),
      freight: parseNum(f.freight),
      handlingFee: parseNum(f.handlingFee),
      agencyFee: parseNum(f.agencyFee),
      outBasket: parseNum(f.outBasket),
      returnBasket: parseNum(f.returnBasket),
      deliverer: f.deliverer.trim(),
      receivedAmount: parseNum(f.receivedAmount),
      payee: f.payee.trim(),
      paymentMethod: f.paymentMethod.trim(),
      remark: f.remark.trim()
    }
    wx.showLoading({ title: '更新中...' })
    try {
      await dbUtil.updateRecord(this.data.editId, data)
      wx.showToast({ title: '更新成功', icon: 'success' })
      this.closeEditModal()
      this.loadRecords()
    } catch (err) {
      console.error('更新失败', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})

