/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取今天的日期字符串
 */
function getToday() {
  return formatDate(new Date())
}

/**
 * 解析日期字符串为 Date 对象
 */
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 格式化日期显示（中文）
 */
function formatDateDisplay(dateStr) {
  const date = parseDate(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 星期${weekday}`
}

/**
 * 格式化时间显示（HH:mm）
 */
function formatTime(date) {
  if (!date) return ''
  
  let dateObj
  if (typeof date === 'string') {
    // 如果是字符串，尝试解析
    if (date.includes('T')) {
      dateObj = new Date(date)
    } else {
      // 可能是时间戳
      dateObj = new Date(parseInt(date))
    }
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return ''
  }
  
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化创建时间显示
 */
function formatCreateTime(createTime) {
  if (!createTime) return ''
  
  let dateObj
  if (typeof createTime === 'string') {
    if (createTime.includes('T')) {
      dateObj = new Date(createTime)
    } else {
      dateObj = new Date(parseInt(createTime))
    }
  } else if (createTime instanceof Date) {
    dateObj = createTime
  } else {
    return ''
  }
  
  const today = new Date()
  const todayStr = formatDate(today)
  const createDateStr = formatDate(dateObj)
  
  if (createDateStr === todayStr) {
    // 今天：显示时间
    return `今天 ${formatTime(dateObj)}`
  } else {
    // 其他日期：显示日期和时间
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    return `${month}月${day}日 ${formatTime(dateObj)}`
  }
}

module.exports = {
  formatDate,
  getToday,
  parseDate,
  formatDateDisplay,
  formatTime,
  formatCreateTime
}

