/**
 * 数据库工具类
 */

const db = wx.cloud.database()

/**
 * 添加账单记录
 */
function addRecord(data) {
  return db.collection('records').add({
    data: {
      ...data,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
}

/**
 * 根据日期查询记录
 */
function getRecordsByDate(date) {
  return db.collection('records')
    .where({
      date: date
    })
    .get()
    .then(res => {
      // 手动排序，按创建时间倒序排列（从顶部开始，最新的在上，最早的在下）
      res.data.sort((a, b) => {
        if (a.createTime && b.createTime) {
          return new Date(b.createTime) - new Date(a.createTime)
        }
        return 0
      })
      return res
    })
}

/**
 * 删除记录
 */
function deleteRecord(id) {
  return db.collection('records').doc(id).remove()
}

/**
 * 根据ID获取记录
 */
function getRecordById(id) {
  return db.collection('records').doc(id).get()
}

/**
 * 更新记录
 */
function updateRecord(id, data) {
  return db.collection('records').doc(id).update({
    data: {
      ...data,
      updateTime: db.serverDate()
    }
  })
}

/**
 * 获取所有记录（用于统计）
 */
function getAllRecords() {
  return db.collection('records')
    .orderBy('date', 'desc')
    .orderBy('createTime', 'desc')
    .get()
}

/**
 * 根据日期范围查询记录
 */
function getRecordsByDateRange(startDate, endDate) {
  return db.collection('records')
    .where({
      date: db.command.gte(startDate).and(db.command.lte(endDate))
    })
    .orderBy('date', 'desc')
    .orderBy('createTime', 'desc')
    .get()
}

/**
 * 添加快递记录
 */
function addExpressRecord(data) {
  return db.collection('express').add({
    data: {
      ...data,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
}

/**
 * 批量添加快递记录（循环调用单个添加）
 */
function addExpressRecords(records) {
  const promises = records.map(record => addExpressRecord(record))
  return Promise.all(promises)
}

/**
 * 根据日期查询快递记录
 */
function getExpressRecordsByDate(date) {
  // 小程序端单次 get 最大 20 条，需分页拉全量
  const PAGE_SIZE = 20

  return db.collection('express')
    .where({ date })
    .count()
    .then(({ total }) => {
      const batchTimes = Math.ceil(total / PAGE_SIZE) || 1
      const tasks = []

      for (let i = 0; i < batchTimes; i++) {
        tasks.push(
          db.collection('express')
            .where({ date })
            .skip(i * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .get()
        )
      }

      return Promise.all(tasks)
    })
    .then(results => {
      const merged = results.reduce((acc, cur) => acc.concat(cur.data || []), [])

      // 规范化排序键：
      // 1) 优先使用数字 order（新增解析时写入，为递增时间戳）
      // 2) 其次使用 createTime 时间戳
      // 3) 最后使用原始索引，避免排序失败
      const normalized = merged.map((item, idx) => {
        const hasOrder = typeof item.order === 'number' && !Number.isNaN(item.order)
        const order = hasOrder
          ? item.order
          : (item.createTime ? new Date(item.createTime).getTime() : idx)
        return { ...item, order }
      })

      normalized.sort((a, b) => a.order - b.order)
      return { data: normalized }
    })
}

/**
 * 删除快递记录
 */
function deleteExpressRecord(id) {
  return db.collection('express').doc(id).remove()
}

/**
 * 更新快递记录
 */
function updateExpressRecord(id, data) {
  return db.collection('express').doc(id).update({
    data: {
      ...data,
      updateTime: db.serverDate()
    }
  })
}

/**
 * 按日期批量删除快递记录
 */
function deleteExpressRecordsByDate(date) {
  if (!date) return Promise.resolve()
  return db.collection('express')
    .where({ date })
    .remove()
}

module.exports = {
  addRecord,
  getRecordsByDate,
  deleteRecord,
  getRecordById,
  updateRecord,
  getAllRecords,
  getRecordsByDateRange,
  addExpressRecord,
  addExpressRecords,
  getExpressRecordsByDate,
  deleteExpressRecord,
  updateExpressRecord,
  deleteExpressRecordsByDate
}

