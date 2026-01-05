Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#1aad19",
    list: [
      {
        pagePath: "/pages/record/record",
        text: "记账"
      },
      {
        pagePath: "/pages/add/add",
        text: "添加",
        isSpecial: true
      },
      {
        pagePath: "/pages/statistics/statistics",
        text: "统计"
      }
    ]
  },
  attached() {
    // 设置当前选中的tab
    this.updateSelected()
  },
  pageLifetimes: {
    show() {
      this.updateSelected()
    }
  },
  methods: {
    updateSelected() {
      const pages = getCurrentPages()
      if (pages.length === 0) return
      const currentPage = pages[pages.length - 1]
      const url = currentPage.route
      const index = this.data.list.findIndex(item => item.pagePath === `/${url}`)
      if (index !== -1) {
        this.setData({
          selected: index
        })
      }
    },
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      const index = data.index
      
      wx.switchTab({
        url: url
      })
      
      this.setData({
        selected: index
      })
    }
  }
})

