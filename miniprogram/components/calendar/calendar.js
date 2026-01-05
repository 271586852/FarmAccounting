const dateUtil = require('../../util/date')

Component({
  properties: {
    // 当前选中的日期
    selectedDate: {
      type: String,
      value: ''
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentYear: 0,
    currentMonth: 0,
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六']
  },

  observers: {
    'selectedDate, show': function(selectedDate, show) {
      if (show) {
        if (selectedDate) {
          const date = dateUtil.parseDate(selectedDate)
          this.setData({
            currentYear: date.getFullYear(),
            currentMonth: date.getMonth() + 1
          })
        }
        this.generateCalendar()
      }
    }
  },

  attached() {
    const today = new Date()
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1
    })
    this.generateCalendar()
  },

  methods: {
    /**
     * 生成日历数据
     */
    generateCalendar() {
      const { currentYear, currentMonth } = this.data
      const firstDay = new Date(currentYear, currentMonth - 1, 1)
      const lastDay = new Date(currentYear, currentMonth, 0)
      const firstDayWeek = firstDay.getDay()
      const daysInMonth = lastDay.getDate()
      
      const days = []
      
      // 上个月的日期
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
      const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()
      
      for (let i = firstDayWeek - 1; i >= 0; i--) {
        days.push({
          date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`,
          day: prevMonthLastDay - i,
          isCurrentMonth: false,
          isToday: false
        })
      }
      
      // 当前月的日期
      const today = dateUtil.getToday()
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        days.push({
          date: dateStr,
          day: i,
          isCurrentMonth: true,
          isToday: dateStr === today
        })
      }
      
      // 下个月的日期（补齐到6行）
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      const remainingDays = 42 - days.length
      
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          day: i,
          isCurrentMonth: false,
          isToday: false
        })
      }
      
      this.setData({
        calendarDays: days
      })
    },

    /**
     * 选择日期
     */
    onDateSelect(e) {
      const date = e.currentTarget.dataset.date
      if (date) {
        this.triggerEvent('select', { date })
        this.triggerEvent('close')
      }
    },

    /**
     * 上一个月
     */
    prevMonth() {
      let { currentYear, currentMonth } = this.data
      if (currentMonth === 1) {
        currentMonth = 12
        currentYear--
      } else {
        currentMonth--
      }
      this.setData({
        currentYear,
        currentMonth
      })
      this.generateCalendar()
    },

    /**
     * 下一个月
     */
    nextMonth() {
      let { currentYear, currentMonth } = this.data
      if (currentMonth === 12) {
        currentMonth = 1
        currentYear++
      } else {
        currentMonth++
      }
      this.setData({
        currentYear,
        currentMonth
      })
      this.generateCalendar()
    },

    /**
     * 关闭日历
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 阻止冒泡
     */
    stopPropagation() {}
  }
})

