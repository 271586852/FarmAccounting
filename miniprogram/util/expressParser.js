/**
 * 快递接龙内容解析工具
 */

/**
 * 解析接龙内容
 * @param {string} content - 接龙内容
 * @returns {Array} 解析后的快递记录数组
 */
function parseExpressContent(content) {
  if (!content || typeof content !== 'string') {
    return []
  }

  const lines = content.split('\n').map(line => line.trim()).filter(line => line)
  const records = []
  let currentRecordLines = []
  let recordNumber = 0

  lines.forEach((line, index) => {
    // 跳过标题行（如 "#接龙"、"1.6"）
    if (line.startsWith('#') || /^\d+\.?\d*$/.test(line)) {
      return
    }

    // 检查是否是新的记录开始（以数字开头，如 "1. "、"2. "）
    const recordStartMatch = line.match(/^(\d+)\.\s*(.+)/)
    if (recordStartMatch) {
      // 如果有之前的记录，先解析它
      if (currentRecordLines.length > 0) {
        const record = parseMultiLineRecord(currentRecordLines.join('\n'))
        if (record) {
          records.push(record)
        }
      }
      // 开始新记录
      recordNumber = parseInt(recordStartMatch[1])
      currentRecordLines = [recordStartMatch[2]]
    } else {
      // 继续当前记录
      currentRecordLines.push(line)
    }
  })

  // 处理最后一条记录
  if (currentRecordLines.length > 0) {
    const record = parseMultiLineRecord(currentRecordLines.join('\n'))
    if (record) {
      records.push(record)
    }
  }

  return records
}

/**
 * 解析多行记录
 * @param {string} content - 多行内容
 * @returns {Object|null} 解析后的记录对象
 */
function parseMultiLineRecord(content) {
  if (!content || typeof content !== 'string') {
    return null
  }

  // 提取记录人名称（第一行的第一个词）
  const lines = content.split('\n').map(line => line.trim()).filter(line => line)
  let recorder = ''
  let mainContent = content

  if (lines.length > 0) {
    const firstLine = lines[0]
    const firstSpaceIndex = firstLine.indexOf(' ')
    if (firstSpaceIndex > 0) {
      const potentialRecorder = firstLine.substring(0, firstSpaceIndex).trim()
      if (!/^\d+$/.test(potentialRecorder)) {
        recorder = potentialRecorder
        mainContent = lines.join('\n')
      }
    }
  }

  // 提取括号内的数量和产品信息
  const bracketMatch = mainContent.match(/[（(]([^）)]+)[）)]/)
  let quantityInfo = ''
  if (bracketMatch) {
    quantityInfo = bracketMatch[1]
    mainContent = mainContent.replace(/[（(][^）)]+[）)]/, '').trim()
  }

  // 解析数量和产品
  const { quantityJu, quantityGong } = parseQuantity(quantityInfo)

  // 提取收件人、地址、手机号
  let address = ''
  let recipient = ''
  let phone = ''

  // 提取手机号
  const phoneMatch = mainContent.match(/(1[3-9]\d{9})/)
  if (phoneMatch) {
    phone = phoneMatch[1]
  }

  // 提取收件人（"收件人："格式）
  const recipientMatch = mainContent.match(/收件人[：:]\s*([^\n]+)/)
  if (recipientMatch) {
    recipient = recipientMatch[1].trim()
  }

  // 提取地址（"收件地址："或"地址："格式）
  const addressMatch = mainContent.match(/(?:收件)?地址[：:]\s*([^\n]+)/)
  if (addressMatch) {
    address = addressMatch[1].trim()
  } else {
    // 如果没有明确的地址标识，尝试从内容中提取
    // 移除已知信息后，剩余部分作为地址
    let cleanContent = mainContent
      .replace(/收件人[：:]\s*[^\n]+/, '')
      .replace(/联系电话[：:]\s*[^\n]+/, '')
      .replace(/请选择[^\n]+/, '')
      .replace(phone, '')
      .replace(/\d+[、.]/, '')
      .trim()
    
    // 如果还有内容，且包含地址关键词，作为地址
    if (cleanContent && /[省市区县街道路号]/g.test(cleanContent)) {
      address = cleanContent
    }
  }

  // 如果地址为空，尝试从整个内容中提取（排除已知信息）
  if (!address) {
    let potentialAddress = mainContent
      .replace(/收件人[：:]\s*[^\n]+/, '')
      .replace(/联系电话[：:]\s*[^\n]+/, '')
      .replace(/请选择[^\n]+/, '')
      .replace(phone, '')
      .replace(recorder, '')
      .replace(/\d+[、.]/, '')
      .replace(/\n/g, ' ')
      .trim()
    
    if (potentialAddress && potentialAddress.length > 5) {
      address = potentialAddress
    }
  }

  // 如果收件人为空，尝试从内容中提取（在手机号附近）
  if (!recipient && phone) {
    const phoneIndex = mainContent.indexOf(phone)
    const beforePhone = mainContent.substring(0, phoneIndex).trim()
    // 尝试提取手机号前的2-4个中文字符作为姓名
    const nameMatch = beforePhone.match(/([^，,：:\n\s]{2,4})[，,：:\s]*$/)
    if (nameMatch) {
      recipient = nameMatch[1]
    }
  }

  // 清理
  recipient = recipient.replace(/^(女士|先生|小姐|老师|老板)/, '').trim()
  address = address.replace(/请选择.+快递/, '').trim()

  // 从地址中移除记录人名称和其他多余的人名，放到备注中
  let remark = ''
  let cleanAddress = address

  // 移除记录人名称（如果出现在地址中）
  if (recorder && cleanAddress.includes(recorder)) {
    cleanAddress = cleanAddress.replace(new RegExp(recorder, 'g'), '').trim()
    if (remark) {
      remark += '、' + recorder
    } else {
      remark = recorder
    }
  }

  // 移除地址开头的人名（如 "Sunny 1、"、"恒昌    "等）
  // 匹配模式：人名 + 数字 + 顿号/空格，或单独的人名 + 空格
  const namePatterns = [
    /^([^\d省市区县街道路号]{2,6})\s*\d+[、.]\s*/,  // 如 "Sunny 1、"、"恒昌 1、"
    /^([^\d省市区县街道路号]{2,6})\s+/,              // 如 "Sunny "、"恒昌    "
    /^([^\d省市区县街道路号]{2,6})[，,]\s*/          // 如 "Sunny，"
  ]

  for (const pattern of namePatterns) {
    const match = cleanAddress.match(pattern)
    if (match) {
      const name = match[1].trim()
      // 确保不是地址的一部分（不包含地址关键词）
      if (!/[省市区县街道路号]/g.test(name) && name.length <= 6) {
        cleanAddress = cleanAddress.replace(pattern, '').trim()
        if (name !== recorder) {  // 避免重复添加
          if (remark) {
            remark += '、' + name
          } else {
            remark = name
          }
        }
        break
      }
    }
  }

  // 清理地址中的多余空格和标点
  cleanAddress = cleanAddress
    .replace(/^[，,、]\s*/, '')  // 移除开头的逗号、顿号
    .replace(/\s+/g, ' ')        // 多个空格合并为一个
    .trim()

  return {
    recorder: recorder || '未知',
    address: cleanAddress || '',
    recipient: recipient || '',
    phone: phone || '',
    quantityJu: quantityJu || 0,
    quantityGong: quantityGong || 0,
    remark: remark || '',
    originalText: content
  }
}

/**
 * 解析单行内容
 * @param {string} line - 单行内容
 * @returns {Object|null} 解析后的记录对象
 */
function parseLine(line) {
  // 移除行首的序号（如 "1. "、"2. "）
  let content = line.replace(/^\d+\.\s*/, '').trim()

  // 提取记录人名称（第一个空格前的部分，但排除数字开头的）
  let recorder = ''
  const firstSpaceIndex = content.indexOf(' ')
  if (firstSpaceIndex > 0) {
    const potentialRecorder = content.substring(0, firstSpaceIndex).trim()
    // 如果第一个词不是纯数字，则作为记录人
    if (!/^\d+$/.test(potentialRecorder)) {
      recorder = potentialRecorder
      content = content.substring(firstSpaceIndex + 1).trim()
    }
  }

  // 提取括号内的数量和产品信息（如 "（2桔）"、"（1贡1桔）"）
  const bracketMatch = content.match(/[（(]([^）)]+)[）)]/)
  let quantityInfo = ''
  if (bracketMatch) {
    quantityInfo = bracketMatch[1]
    content = content.replace(/[（(][^）)]+[）)]/, '').trim()
  }

  // 解析数量和产品
  const { quantityJu, quantityGong } = parseQuantity(quantityInfo)

  // 提取地址、收件人、手机号
  let address = ''
  let recipient = ''
  let phone = ''

  // 先尝试提取手机号（11位数字）
  const phoneMatch = content.match(/(1[3-9]\d{9})/)
  if (phoneMatch) {
    phone = phoneMatch[1]
    const phoneIndex = content.indexOf(phone)
    const beforePhone = content.substring(0, phoneIndex).trim()
    let afterPhone = content.substring(phoneIndex + 11).trim()

    // 处理手机号后面的内容：可能是登记人（1-3个中文字符）
    // 移除括号内容（数量信息）后再检查
    afterPhone = afterPhone.replace(/[（(][^）)]+[）)]/, '').trim()
    if (afterPhone && /^[\u4e00-\u9fa5]{1,3}$/.test(afterPhone)) {
      // 如果手机号后面是1-3个中文字符，且不是地址关键词，作为登记人
      if (!/[省市区县街道路号]/g.test(afterPhone)) {
        // 如果 recorder 为空，或者 recorder 与 afterPhone 不同，则使用 afterPhone 作为 recorder
        if (!recorder || recorder !== afterPhone) {
          // 如果 recorder 已存在且不同，保留 recorder，将 afterPhone 作为备注
          // 如果 recorder 为空，则使用 afterPhone 作为 recorder
          if (!recorder) {
            recorder = afterPhone
          }
        }
      }
    }

    // 移除开头的序号（如 "1、"、"2、"）
    let cleanBeforePhone = beforePhone.replace(/^\d+[、.]/, '').trim()

    // 尝试提取收件人
    // 格式1: "收件人：姓名"
    const recipientMatch1 = cleanBeforePhone.match(/收件人[：:]\s*([^，,：:\n]+)/)
    if (recipientMatch1) {
      recipient = recipientMatch1[1].trim()
      address = cleanBeforePhone.replace(/收件人[：:]\s*[^，,：:\n]+/, '').trim()
    } else {
      // 格式2: "地址，姓名：" 或 "地址，姓名"
      const commaMatch = cleanBeforePhone.match(/^(.+?)[，,]\s*([^：:]+?)(?:[：:]|$)/)
      if (commaMatch) {
        const part1 = commaMatch[1].trim()
        const part2 = commaMatch[2].trim()
        // 判断哪个是地址，哪个是姓名（地址通常更长，且包含"省"、"市"、"区"等）
        if (part1.length > part2.length || /[省市区县街道路号]/g.test(part1)) {
          address = part1
          recipient = part2
        } else {
          address = part2
          recipient = part1
        }
      } else {
        // 格式3: "姓名地址" 或 "地址姓名"（姓名通常在最后，且较短）
        // 尝试从末尾提取姓名（2-4个中文字符）
        const nameMatch = cleanBeforePhone.match(/([^省市区县街道路号]{2,4})$/g)
        if (nameMatch && cleanBeforePhone.length > 10) {
          // 如果内容较长，可能是"地址+姓名"格式
          const potentialName = cleanBeforePhone.slice(-6) // 取最后6个字符
          if (potentialName.length <= 4 && !/[省市区县街道路号]/g.test(potentialName)) {
            recipient = potentialName
            address = cleanBeforePhone.slice(0, -potentialName.length).trim()
          } else {
            address = cleanBeforePhone
          }
        } else {
          address = cleanBeforePhone
        }
      }
    }

    // 如果地址中包含"收件地址："，提取地址部分
    if (address.includes('收件地址')) {
      const addressMatch = address.match(/收件地址[：:]\s*(.+)/)
      if (addressMatch) {
        address = addressMatch[1].trim()
      }
    }
  } else {
    // 没有找到手机号，整个作为地址
    address = content.replace(/^\d+[、.]/, '').trim()
    // 尝试提取"收件人："格式
    if (address.includes('收件人')) {
      const recipientMatch = address.match(/收件人[：:]\s*([^\n]+)/)
      if (recipientMatch) {
        recipient = recipientMatch[1].trim()
        address = address.replace(/收件人[：:]\s*[^\n]+/, '').trim()
      }
    }
    // 尝试提取"收件地址："格式
    if (address.includes('收件地址')) {
      const addressMatch = address.match(/收件地址[：:]\s*(.+)/)
      if (addressMatch) {
        address = addressMatch[1].trim()
      }
    }
  }

  // 清理收件人名称（移除常见的称呼和多余空格）
  recipient = recipient.replace(/^(女士|先生|小姐|老师|老板|收件人[：:])/, '').trim()
  // 清理地址（移除多余的关键词）
  address = address.replace(/^(收件地址[：:]|地址[：:])/, '').trim()
  address = address.replace(/请选择.+快递/, '').trim()

  // 从地址中移除记录人名称和其他多余的人名，放到备注中
  let remark = ''
  let cleanAddress = address

  // 移除记录人名称（如果出现在地址中）
  if (recorder && cleanAddress.includes(recorder)) {
    cleanAddress = cleanAddress.replace(new RegExp(recorder, 'g'), '').trim()
    if (remark) {
      remark += '、' + recorder
    } else {
      remark = recorder
    }
  }

  // 移除地址开头的人名（如 "Sunny 1、"、"恒昌    "等）
  const namePatterns = [
    /^([^\d省市区县街道路号]{2,6})\s*\d+[、.]\s*/,  // 如 "Sunny 1、"、"恒昌 1、"
    /^([^\d省市区县街道路号]{2,6})\s+/,              // 如 "Sunny "、"恒昌    "
    /^([^\d省市区县街道路号]{2,6})[，,]\s*/          // 如 "Sunny，"
  ]

  for (const pattern of namePatterns) {
    const match = cleanAddress.match(pattern)
    if (match) {
      const name = match[1].trim()
      // 确保不是地址的一部分（不包含地址关键词）
      if (!/[省市区县街道路号]/g.test(name) && name.length <= 6) {
        cleanAddress = cleanAddress.replace(pattern, '').trim()
        if (name !== recorder) {  // 避免重复添加
          if (remark) {
            remark += '、' + name
          } else {
            remark = name
          }
        }
        break
      }
    }
  }

  // 清理地址中的多余空格和标点
  cleanAddress = cleanAddress
    .replace(/^[，,、]\s*/, '')  // 移除开头的逗号、顿号
    .replace(/\s+/g, ' ')        // 多个空格合并为一个
    .trim()

  return {
    recorder: recorder || '未知',
    address: cleanAddress || '',
    recipient: recipient || '',
    phone: phone || '',
    quantityJu: quantityJu || 0,
    quantityGong: quantityGong || 0,
    remark: remark || '',
    originalText: line
  }
}

/**
 * 解析数量和产品信息
 * @param {string} quantityInfo - 数量信息字符串，如 "2桔"、"1贡1桔"、"3桔2贡"
 * @returns {Object} { quantityJu: 桔的数量, quantityGong: 贡的数量 }
 */
function parseQuantity(quantityInfo) {
  if (!quantityInfo) {
    return { quantityJu: 0, quantityGong: 0 }
  }

  let quantityJu = 0
  let quantityGong = 0

  // 匹配 "数字+桔" 或 "数字+贡"
  const juMatch = quantityInfo.match(/(\d+)\s*[桔橘]/)
  const gongMatch = quantityInfo.match(/(\d+)\s*贡/)

  if (juMatch) {
    quantityJu = parseInt(juMatch[1]) || 0
  }

  if (gongMatch) {
    quantityGong = parseInt(gongMatch[1]) || 0
  }

  return { quantityJu, quantityGong }
}

/**
 * 计算统计信息
 * @param {Array} records - 快递记录数组
 * @returns {Object} { totalJu: 总桔数, totalGong: 总贡数, totalCount: 总记录数 }
 */
function calculateStatistics(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { totalJu: 0, totalGong: 0, totalCount: 0 }
  }

  const totalJu = records.reduce((sum, record) => sum + (record.quantityJu || 0), 0)
  const totalGong = records.reduce((sum, record) => sum + (record.quantityGong || 0), 0)
  const totalCount = records.length

  return { totalJu, totalGong, totalCount }
}

module.exports = {
  parseExpressContent,
  parseLine,
  parseQuantity,
  calculateStatistics
}

