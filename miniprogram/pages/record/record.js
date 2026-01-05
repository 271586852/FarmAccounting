const dbUtil = require('../../util/db')
const dateUtil = require('../../util/date')

Page({
  data: {
    currentDate: dateUtil.getToday(),
    dateDisplay: '',
    records: [],
    showCalendar: false
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
  }
})

