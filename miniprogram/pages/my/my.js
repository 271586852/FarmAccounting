const config = require('../../config')

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    version: config.version || ''
  },

  onLoad() {
    // 读取本地已授权信息
    this.loadUserProfile()
  },

  onShow() {
    // 确保自定义 tab 高亮正确
    const tab = this.getTabBar && this.getTabBar()
    if (tab && typeof tab.updateSelected === 'function') {
      tab.updateSelected()
    }
  },

  loadUserProfile() {
    const cached = wx.getStorageSync('userProfile')
    if (cached && cached.nickName) {
      this.setData({
        userInfo: cached,
        hasUserInfo: true
      })
      return
    }

    // 兼容旧授权：如果已授权 scope.userInfo 则直接获取
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (resUser) => {
              wx.setStorageSync('userProfile', resUser.userInfo)
              this.setData({
                userInfo: resUser.userInfo,
                hasUserInfo: true
              })
            }
          })
        }
      }
    })
  },

  requestProfile() {
    wx.getUserProfile({
      desc: '用于显示头像和昵称',
      success: (res) => {
        wx.setStorageSync('userProfile', res.userInfo)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      },
      fail: () => {
        wx.showToast({
          title: '未授权头像昵称',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 关于
   */
  onAbout() {
    const versionText = this.data.version || config.version || ''
    wx.showModal({
      title: '关于',
      content: `农场记账小程序\n\n版本：${versionText}\n\n用于记录农场产品的销售和快递信息。`,
      showCancel: false
    })
  },

  /**
   * 清除缓存
   */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})

