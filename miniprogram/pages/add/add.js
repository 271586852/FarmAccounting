const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')
const expressParser = require('../../util/expressParser')

Page({
  data: {
    // 记账类型：normal（普通）或 express（快递）
    billType: 'normal',
    
    // 普通类记账
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
    postage: '',

    // 快递类记账
    expressInputText: '',  // 快速输入文本
    expressRecorder: '',   // 登记人
    expressRecipient: '',  // 收件人
    expressPhone: '',      // 电话
    expressAddress: '',    // 地址
    expressQuantityJu: 0, // 桔数
    expressQuantityGong: 0 // 贡数
  },

  onLoad() {
    // 设置默认日期为今天
    this.setData({
      currentDate: dateUtil.getToday()
    })
  },

  onShow() {
    // 确保自定义 tab 高亮正确
    const tab = this.getTabBar && this.getTabBar()
    if (tab && typeof tab.updateSelected === 'function') {
      tab.updateSelected()
    }
  },

  /**
   * 选择记账类型（普通/快递）
   */
  onBillTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      billType: type
    })
    // 切换类型时重置表单
    this.resetForm()
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
   * 快递类输入文本
   */
  onExpressInput(e) {
    this.setData({
      expressInputText: e.detail.value
    })
  },

  /**
   * 解析快递文本
   */
  parseExpressText() {
    const text = this.data.expressInputText.trim()
    if (!text) {
      wx.showToast({
        title: '请输入要解析的内容',
        icon: 'none'
      })
      return
    }

    // 使用 expressParser 解析单行内容
    const parsed = expressParser.parseLine(text)
    
    if (parsed) {
      this.setData({
        expressRecorder: parsed.recorder || '',
        expressRecipient: parsed.recipient || '',
        expressPhone: parsed.phone || '',
        expressAddress: parsed.address || '',
        expressQuantityJu: parsed.quantityJu || 0,
        expressQuantityGong: parsed.quantityGong || 0
      })
      
      wx.showToast({
        title: '解析成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '解析失败，请检查格式',
        icon: 'none'
      })
    }
  },

  /**
   * 登记人输入
   */
  onExpressRecorderInput(e) {
    this.setData({
      expressRecorder: e.detail.value
    })
  },

  /**
   * 收件人输入
   */
  onExpressRecipientInput(e) {
    this.setData({
      expressRecipient: e.detail.value
    })
  },

  /**
   * 电话输入
   */
  onExpressPhoneInput(e) {
    this.setData({
      expressPhone: e.detail.value
    })
  },

  /**
   * 地址输入
   */
  onExpressAddressInput(e) {
    this.setData({
      expressAddress: e.detail.value
    })
  },

  /**
   * 桔数输入
   */
  onExpressJuInput(e) {
    let value = parseInt(e.detail.value) || 0
    if (value < 0) value = 0
    this.setData({
      expressQuantityJu: value
    })
  },

  /**
   * 贡数输入
   */
  onExpressGongInput(e) {
    let value = parseInt(e.detail.value) || 0
    if (value < 0) value = 0
    this.setData({
      expressQuantityGong: value
    })
  },

  /**
   * 桔数减
   */
  decreaseExpressJu() {
    if (this.data.expressQuantityJu > 0) {
      this.setData({
        expressQuantityJu: this.data.expressQuantityJu - 1
      })
    }
  },

  /**
   * 桔数加
   */
  increaseExpressJu() {
    this.setData({
      expressQuantityJu: this.data.expressQuantityJu + 1
    })
  },

  /**
   * 贡数减
   */
  decreaseExpressGong() {
    if (this.data.expressQuantityGong > 0) {
      this.setData({
        expressQuantityGong: this.data.expressQuantityGong - 1
      })
    }
  },

  /**
   * 贡数加
   */
  increaseExpressGong() {
    this.setData({
      expressQuantityGong: this.data.expressQuantityGong + 1
    })
  },

  /**
   * 提交表单
   */
  async submitForm() {
    if (this.data.billType === 'normal') {
      // 普通类记账
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
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      } finally {
        wx.hideLoading()
      }
    } else {
      // 快递类记账
      if (!this.data.expressRecorder || this.data.expressRecorder.trim() === '') {
        wx.showToast({
          title: '请输入登记人',
          icon: 'none'
        })
        return
      }

      if (this.data.expressQuantityJu <= 0 && this.data.expressQuantityGong <= 0) {
        wx.showToast({
          title: '请输入数量（桔或贡）',
          icon: 'none'
        })
        return
      }

      // 准备数据
      const expressData = {
        date: this.data.currentDate,
        recorder: this.data.expressRecorder.trim(),
        recipient: this.data.expressRecipient.trim() || '',
        phone: this.data.expressPhone.trim() || '',
        address: this.data.expressAddress.trim() || '',
        quantityJu: this.data.expressQuantityJu || 0,
        quantityGong: this.data.expressQuantityGong || 0
      }

      wx.showLoading({
        title: '保存中...'
      })

      try {
        await dbUtil.addExpressRecord(expressData)
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 重置表单
        this.resetForm()
        
        // 延迟跳转到快递页面
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/express/express'
          })
        }, 1500)
      } catch (err) {
        console.error('保存失败', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      } finally {
        wx.hideLoading()
      }
    }
  },

  /**
   * 重置表单
   */
  resetForm() {
    if (this.data.billType === 'normal') {
      // 重置普通类表单
      this.setData({
        selectedType: '',
        customType: '',
        showCustomInput: false,
        quantity: 0,
        unit: '箱',
        weight: '',
        postage: ''
      })
    } else {
      // 重置快递类表单
      this.setData({
        expressInputText: '',
        expressRecorder: '',
        expressRecipient: '',
        expressPhone: '',
        expressAddress: '',
        expressQuantityJu: 0,
        expressQuantityGong: 0
      })
    }
  },

})

