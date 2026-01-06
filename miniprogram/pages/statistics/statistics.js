const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')

// 管理员账号密码（实际项目中应该存储在云数据库中）
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

Page({
  data: {
    isLoggedIn: false,
    username: '',
    password: '',
    currentDate: dateUtil.getToday(),
    dateDisplay: '',
    records: [],
    statistics: {
      totalQuantity: 0,
      totalWeight: 0,
      totalPostage: 0,
      typeStats: {}
    },
    typeStatsList: [],
    showCalendar: false
  },

  onLoad() {
    // 暂时取消登录认证，直接加载统计数据
    this.setData({
      isLoggedIn: true,
      dateDisplay: dateUtil.formatDateDisplay(this.data.currentDate)
    })
    this.loadStatistics()
  },

  onShow() {
    // 确保自定义 tab 高亮正确
    const tab = this.getTabBar && this.getTabBar()
    if (tab && typeof tab.updateSelected === 'function') {
      tab.updateSelected()
    }
  },

  /**
   * 用户名输入
   */
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  /**
   * 登录
   */
  login() {
    if (!this.data.username || !this.data.password) {
      wx.showToast({
        title: '请输入账号密码',
        icon: 'none'
      })
      return
    }

    if (this.data.username === ADMIN_USERNAME && this.data.password === ADMIN_PASSWORD) {
      wx.setStorageSync('adminLoggedIn', true)
      this.setData({
        isLoggedIn: true,
        dateDisplay: dateUtil.formatDateDisplay(this.data.currentDate)
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      this.loadStatistics()
    } else {
      wx.showToast({
        title: '账号或密码错误',
        icon: 'none'
      })
    }
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('adminLoggedIn')
          this.setData({
            isLoggedIn: false,
            username: '',
            password: '',
            records: [],
            statistics: {
              totalQuantity: 0,
              totalWeight: 0,
              totalPostage: 0,
              typeStats: {}
            }
          })
        }
      }
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
    this.loadStatistics()
  },

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    wx.showLoading({
      title: '加载中...'
    })
    try {
      const res = await dbUtil.getRecordsByDate(this.data.currentDate)
      const records = res.data
      
      // 计算统计信息
      const statistics = {
        totalQuantity: 0,
        totalWeight: 0,
        totalPostage: 0,
        typeStats: {}
      }

      records.forEach(record => {
        // 总数量
        if (record.quantity) {
          statistics.totalQuantity += record.quantity
        }
        
        // 总重量
        if (record.weight) {
          statistics.totalWeight += record.weight
        }
        
        // 总邮费
        if (record.postage) {
          statistics.totalPostage += record.postage
        }
        
        // 按种类统计
        if (!statistics.typeStats[record.type]) {
          statistics.typeStats[record.type] = {
            quantity: 0,
            weight: 0,
            count: 0
          }
        }
        statistics.typeStats[record.type].count++
        if (record.quantity) {
          statistics.typeStats[record.type].quantity += record.quantity
        }
        if (record.weight) {
          statistics.typeStats[record.type].weight += record.weight
        }
      })

      // 将 typeStats 转换为数组格式
      const typeStatsList = Object.keys(statistics.typeStats).map(type => ({
        type: type,
        ...statistics.typeStats[type]
      }))

      this.setData({
        records: records,
        statistics: statistics,
        typeStatsList: typeStatsList
      })
    } catch (err) {
      console.error('加载统计失败', err)
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
  }
})

