const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')
const expressParser = require('../../util/expressParser')

Page({
  data: {
    // 记账类型：normal（普通）或 express（快递）
    billType: 'normal',
    editId: '',
    
    // 普通类记账
    // 种类选项
    typeOptions: ['沙糖桔', '贡柑', '茶油', '其他'],
    selectedType: '',
    selectedTypeIndex: -1,
    customType: '',
    showCustomInput: false,
    recorderName: '',
    
    // 数量（可选）
    quantity: '',
    unit: '箱',
    unitOptions: ['箱', '筐', '袋'],
    unitIndex: 0,
    
    // 重量
    weight: '',
    
    // 邮费
    postage: '',

    // 客户及附加信息（非必填）
    customer: '',
    saleTypeOptions: ['批发', '业务', '零售'],
    saleType: '',
    saleTypeIndex: -1,
    gradeOptions: ['特大', '中大', '中果', '中小', '小果', '次果', '珍珠果', '榨汁果'],
    grade: '',
    gradeIndex: -1,
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
    remark: '',

    // 快递类记账
    expressInputText: '',  // 快速输入文本
    expressRecorder: '',   // 登记人
    expressRecipient: '',  // 收件人
    expressPhone: '',      // 电话
    expressAddress: '',    // 地址
    expressQuantityJu: 0, // 桔数
    expressQuantityGong: 0, // 贡数
    expressRemark: ''      // 备注
  },

  onLoad(options = {}) {
    // 设置默认日期为今天
    const userProfile = wx.getStorageSync('userProfile')
    const recorderName = userProfile && userProfile.nickName ? userProfile.nickName : ''
    const editId = options.id || ''
    this.setData({
      currentDate: dateUtil.getToday(),
      recorderName,
      editId
    })
    if (editId) {
      this.loadRecordForEdit(editId)
    }
  },

  onShow() {
    // 确保自定义 tab 高亮正确
    const tab = this.getTabBar && this.getTabBar()
    if (tab && typeof tab.updateSelected === 'function') {
      tab.updateSelected()
    }
    const userProfile = wx.getStorageSync('userProfile')
    if (userProfile && userProfile.nickName && userProfile.nickName !== this.data.recorderName) {
      this.setData({
        recorderName: userProfile.nickName
      })
    }
  },

  /**
   * 加载待编辑记录
   */
  async loadRecordForEdit(id) {
    wx.showLoading({
      title: '加载中...'
    })
    try {
      const res = await dbUtil.getRecordById(id)
      const data = res.data || {}
      // 类型处理：若不在预设，使用“其他”并填充自定义
      const inOptions = this.data.typeOptions.includes(data.type)
      const selectedType = inOptions ? data.type : '其他'
      const showCustomInput = !inOptions
      const customType = !inOptions ? (data.type || '') : ''

      this.setData({
        billType: 'normal',
        currentDate: data.date || dateUtil.getToday(),
        selectedType,
        selectedTypeIndex: inOptions ? this.data.typeOptions.indexOf(data.type) : this.data.typeOptions.indexOf('其他'),
        showCustomInput,
        customType,
        quantity: data.quantity === 0 || data.quantity ? data.quantity : '',
        unit: data.unit || '箱',
        unitIndex: this.data.unitOptions.indexOf(data.unit || '箱'),
        weight: data.weight || '',
        postage: data.postage || '',
        recorderName: data.recorder || this.data.recorderName,
        customer: data.customer || '',
        saleType: data.saleType || '',
        saleTypeIndex: data.saleType ? this.data.saleTypeOptions.indexOf(data.saleType) : -1,
        grade: data.grade || '',
        gradeIndex: data.grade ? this.data.gradeOptions.indexOf(data.grade) : -1,
        unitPrice: data.unitPrice === 0 || data.unitPrice ? data.unitPrice : '',
        freight: data.freight === 0 || data.freight ? data.freight : '',
        handlingFee: data.handlingFee === 0 || data.handlingFee ? data.handlingFee : '',
        agencyFee: data.agencyFee === 0 || data.agencyFee ? data.agencyFee : '',
        outBasket: data.outBasket === 0 || data.outBasket ? data.outBasket : '',
        returnBasket: data.returnBasket === 0 || data.returnBasket ? data.returnBasket : '',
        deliverer: data.deliverer || '',
        receivedAmount: data.receivedAmount === 0 || data.receivedAmount ? data.receivedAmount : '',
        payee: data.payee || '',
        paymentMethod: data.paymentMethod || '',
        remark: data.remark || ''
      })
    } catch (err) {
      console.error('加载记录失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
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
    const isSame = this.data.selectedType === type
    const newType = isSame ? '' : type
    this.setData({
      selectedType: newType,
      selectedTypeIndex: isSame ? -1 : this.data.typeOptions.indexOf(type),
      showCustomInput: newType === '其他',
      customType: newType === '其他' ? this.data.customType : ''
    })
  },

  /**
   * 选择销售类型
   */
  onSaleTypeSelect(e) {
    const saleType = e.currentTarget.dataset.type
    const isSame = this.data.saleType === saleType
    this.setData({
      saleType: isSame ? '' : saleType,
      saleTypeIndex: isSame ? -1 : this.data.saleTypeOptions.indexOf(saleType)
    })
  },

  /**
   * 选择果级
   */
  onGradeSelect(e) {
    const grade = e.currentTarget.dataset.type
    const isSame = this.data.grade === grade
    this.setData({
      grade: isSame ? '' : grade,
      gradeIndex: isSame ? -1 : this.data.gradeOptions.indexOf(grade)
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
   * 通用输入（文本/数字，非必填）
   */
  onFieldInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  },

  /**
   * 选择单位（直接点击）
   */
  onUnitSelect(e) {
    const unit = e.currentTarget.dataset.unit
    const isSame = this.data.unit === unit
    this.setData({
      unit: isSame ? '' : unit,
      unitIndex: isSame ? -1 : this.data.unitOptions.indexOf(unit)
    })
  },

  /**
   * 数量减
   */
  decreaseQuantity() {
    const current = parseInt(this.data.quantity) || 0
    if (current > 0) {
      this.setData({
        quantity: current - 1
      })
    }
  },

  /**
   * 数量加
   */
  increaseQuantity() {
    const current = parseInt(this.data.quantity) || 0
    this.setData({
      quantity: current + 1
    })
  },

  /**
   * 数量输入
   */
  onQuantityInput(e) {
    const raw = e.detail.value
    if (raw === '') {
      this.setData({
        quantity: ''
      })
      return
    }

    let value = parseInt(raw)
    if (isNaN(value) || value < 0) {
      value = ''
    }
    this.setData({
      quantity: value === '' ? '' : value
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
        expressQuantityGong: parsed.quantityGong || 0,
        expressRemark: parsed.remark || ''
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
   * 快递备注输入
   */
  onExpressRemarkInput(e) {
    this.setData({
      expressRemark: e.detail.value
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

      // 准备数据
      const parseOptionalNumber = (value) => {
        if (value === '' || value === null || value === undefined) return null
        const num = parseFloat(value)
        return isNaN(num) ? null : num
      }

      const recordData = {
        date: this.data.currentDate,
        type: type.trim(),
        quantity: parseOptionalNumber(this.data.quantity),
        unit: this.data.unit,
        recorder: this.data.recorderName || '',
        weight: this.data.weight ? parseFloat(this.data.weight) : null,
        postage: this.data.postage ? parseFloat(this.data.postage) : null,
        customer: this.data.customer.trim(),
        saleType: this.data.saleType,
        grade: this.data.grade,
        unitPrice: parseOptionalNumber(this.data.unitPrice),
        freight: parseOptionalNumber(this.data.freight),
        handlingFee: parseOptionalNumber(this.data.handlingFee),
        agencyFee: parseOptionalNumber(this.data.agencyFee),
        outBasket: parseOptionalNumber(this.data.outBasket),
        returnBasket: parseOptionalNumber(this.data.returnBasket),
        deliverer: this.data.deliverer.trim(),
        receivedAmount: parseOptionalNumber(this.data.receivedAmount),
        payee: this.data.payee.trim(),
        paymentMethod: this.data.paymentMethod.trim(),
        remark: this.data.remark.trim()
      }

      wx.showLoading({
        title: this.data.editId ? '更新中...' : '保存中...'
      })

      try {
        if (this.data.editId) {
          await dbUtil.updateRecord(this.data.editId, recordData)
        } else {
          await dbUtil.addRecord(recordData)
        }
        wx.showToast({
          title: this.data.editId ? '更新成功' : '保存成功',
          icon: 'success'
        })
        
        // 重置表单
        this.resetForm()
        
        // 返回记录列表
        setTimeout(() => {
          if (this.data.editId) {
            wx.navigateBack()
          } else {
            wx.switchTab({
              url: '/pages/record/record'
            })
          }
        }, 800)
      } catch (err) {
        console.error('保存失败', err)
        wx.showToast({
          title: this.data.editId ? '更新失败' : '保存失败',
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
        quantityGong: this.data.expressQuantityGong || 0,
        remark: this.data.expressRemark.trim() || ''
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
        editId: '',
        selectedType: '',
        customType: '',
        showCustomInput: false,
        quantity: '',
        unit: '箱',
        weight: '',
        postage: '',
        recorderName: this.data.recorderName,
        customer: '',
        saleType: '',
        saleTypeIndex: -1,
        grade: '',
        gradeIndex: -1,
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
        expressQuantityGong: 0,
        expressRemark: ''
      })
    }
  },

})

