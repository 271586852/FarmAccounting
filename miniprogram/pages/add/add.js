const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')

Page({
  data: {
    // 种类选项
    typeOptions: ['沙糖桔', '贡柑', '茶油', '其他'],
    selectedType: '',
    selectedTypeIndex: -1,
    customType: '',
    showCustomInput: false,
    
    // 数量
    quantity: 0,
    unit: '箱',
    unitOptions: ['箱', '筐', '袋'],
    unitIndex: 0,
    
    // 重量
    weight: '',
    
    // 邮费
    postage: ''
  },

  onLoad() {
    // 设置默认日期为今天
    this.setData({
      currentDate: dateUtil.getToday()
    })
  },

  /**
   * 选择种类（直接点击）
   */
  onTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: type,
      selectedTypeIndex: this.data.typeOptions.indexOf(type),
      showCustomInput: type === '其他',
      customType: type === '其他' ? this.data.customType : ''
    })
  },

  /**
   * 自定义种类输入
   */
  onCustomTypeInput(e) {
    this.setData({
      customType: e.detail.value
    })
  },

  /**
   * 选择单位（直接点击）
   */
  onUnitSelect(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({
      unit: unit,
      unitIndex: this.data.unitOptions.indexOf(unit)
    })
  },

  /**
   * 数量减
   */
  decreaseQuantity() {
    if (this.data.quantity > 0) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  /**
   * 数量加
   */
  increaseQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  /**
   * 数量输入
   */
  onQuantityInput(e) {
    let value = parseInt(e.detail.value) || 0
    if (value < 0) value = 0
    this.setData({
      quantity: value
    })
  },

  /**
   * 重量减
   */
  decreaseWeight() {
    let weight = parseFloat(this.data.weight) || 0
    if (weight > 0) {
      weight = Math.max(0, weight - 0.5)
      this.setData({
        weight: weight > 0 ? weight.toString() : ''
      })
    }
  },

  /**
   * 重量加
   */
  increaseWeight() {
    let weight = parseFloat(this.data.weight) || 0
    weight += 0.5
    this.setData({
      weight: weight.toString()
    })
  },

  /**
   * 重量输入
   */
  onWeightInput(e) {
    let value = parseFloat(e.detail.value) || ''
    if (value < 0) value = ''
    this.setData({
      weight: value === '' ? '' : value.toString()
    })
  },

  /**
   * 邮费输入
   */
  onPostageInput(e) {
    let value = parseFloat(e.detail.value) || ''
    if (value < 0) value = ''
    this.setData({
      postage: value === '' ? '' : value.toString()
    })
  },

  /**
   * 提交表单
   */
  async submitForm() {
    // 验证必填项
    const type = this.data.showCustomInput ? this.data.customType : this.data.selectedType
    if (!type || type.trim() === '') {
      wx.showToast({
        title: '请选择种类',
        icon: 'none'
      })
      return
    }

    if (this.data.quantity <= 0) {
      wx.showToast({
        title: '请输入数量',
        icon: 'none'
      })
      return
    }

    // 准备数据
    const recordData = {
      date: this.data.currentDate,
      type: type.trim(),
      quantity: this.data.quantity,
      unit: this.data.unit,
      weight: this.data.weight ? parseFloat(this.data.weight) : null,
      postage: this.data.postage ? parseFloat(this.data.postage) : null
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      await dbUtil.addRecord(recordData)
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 重置表单
      this.resetForm()
      
      // 延迟跳转到记账页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/record/record'
        })
      }, 1500)
    } catch (err) {
      console.error('保存失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 重置表单
   */
  resetForm() {
    this.setData({
      selectedType: '',
      customType: '',
      showCustomInput: false,
      quantity: 0,
      unit: '箱',
      weight: '',
      postage: ''
    })
  },

})

