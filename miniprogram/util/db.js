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
  return db.collection('express')
    .where({
      date: date
    })
    .get()
    .then(res => {
      // 手动排序，按创建时间倒序排列
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
 * 删除快递记录
 */
function deleteExpressRecord(id) {
  return db.collection('express').doc(id).remove()
}

module.exports = {
  addRecord,
  getRecordsByDate,
  deleteRecord,
  getAllRecords,
  getRecordsByDateRange,
  addExpressRecord,
  addExpressRecords,
  getExpressRecordsByDate,
  deleteExpressRecord
}

