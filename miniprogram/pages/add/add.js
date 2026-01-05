const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')

Page({
  data: {
    // 种类选项
    typeOptions: ['沙糖桔', '贡柑', '茶油', '蜜桔', '其他'],
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
      let errorMsg = '保存失败'
      if (err.errMsg) {
        if (err.errMsg.includes('permission')) {
          errorMsg = '保存失败：权限不足，请检查数据库权限设置'
        } else if (err.errMsg.includes('collection')) {
          errorMsg = '保存失败：数据库集合不存在，请先创建 records 集合'
        } else if (err.errMsg.includes('env')) {
          errorMsg = '保存失败：云开发环境未配置，请检查 config.js'
        } else {
          errorMsg = `保存失败：${err.errMsg}`
        }
      }
      wx.showModal({
        title: '错误',
        content: errorMsg + '\n\n请查看控制台获取详细信息',
        showCancel: false
      })
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

  /**
   * 检查配置
   */
  async checkConfig() {
    wx.showLoading({
      title: '检查中...'
    })
    
    const config = require('../../config')
    const checks = []
    
    // 检查1: 云开发环境ID
    if (!config.envId || config.envId === 'release-b86096') {
      checks.push('❌ 云开发环境ID未配置或使用默认值，请在 config.js 中配置正确的 envId')
    } else {
      checks.push(`✅ 云开发环境ID: ${config.envId}`)
    }
    
    // 检查2: 云开发是否初始化
    if (!wx.cloud) {
      checks.push('❌ 云开发未初始化，请确保基础库版本 >= 2.2.3')
    } else {
      checks.push('✅ 云开发已初始化')
    }
    
    // 检查3: 数据库连接测试
    try {
      const db = wx.cloud.database()
      await db.collection('records').limit(1).get()
      checks.push('✅ 数据库连接成功，records 集合存在')
    } catch (err) {
      if (err.errMsg.includes('permission')) {
        checks.push('❌ 数据库权限不足，请在云开发控制台设置 records 集合权限')
      } else if (err.errMsg.includes('collection')) {
        checks.push('❌ records 集合不存在，请在云开发控制台创建该集合')
      } else if (err.errMsg.includes('env')) {
        checks.push('❌ 云开发环境ID错误，请检查 config.js 中的 envId')
      } else {
        checks.push(`❌ 数据库连接失败: ${err.errMsg}`)
      }
    }
    
    wx.hideLoading()
    
    wx.showModal({
      title: '配置检查结果',
      content: checks.join('\n\n'),
      showCancel: false,
      confirmText: '知道了'
    })
  }
})

