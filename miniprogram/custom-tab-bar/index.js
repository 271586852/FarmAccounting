Component({
  data: {
    selected: 1, // 默认选中"添加"页面（索引1）
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
      // 确保路径格式一致：去掉开头的斜杠，添加开头的斜杠
      const currentPath = url.startsWith('/') ? url : `/${url}`
      const index = this.data.list.findIndex(item => {
        const itemPath = item.pagePath.startsWith('/') ? item.pagePath : `/${item.pagePath}`
        return itemPath === currentPath
      })
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
      
      // 先更新选中状态，确保UI立即响应
      this.setData({
        selected: index
      })
      
      // 然后切换页面，页面切换后会通过 pageLifetimes.show 再次确认状态
      wx.switchTab({
        url: url,
        success: () => {
          // 切换成功后再次确认选中状态
          this.updateSelected()
        },
        fail: () => {
          // 如果切换失败，恢复之前的状态
          this.updateSelected()
        }
      })
    }
  }
})

