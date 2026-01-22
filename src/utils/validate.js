/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.indexOf(str.trim()) >= 0
}

export function safeJsonParse(jsonStr, defaultValue) {
  // 第一步：处理自定义默认值（如果传入了自定义兜底值，直接优先使用）
  if (arguments.length >= 2) {
    try {
      return typeof jsonStr === 'string' && jsonStr.trim() ? JSON.parse(jsonStr) : defaultValue
    } catch (error) {
      console.warn('JSON 解析失败，返回自定义兜底值：', error, '原始数据：', jsonStr)
      return defaultValue
    }
  }

  // 第二步：处理非字符串类型输入（null、undefined、数字、布尔等）
  if (typeof jsonStr !== 'string') {
    if (Array.isArray(jsonStr)) return jsonStr
    if (typeof jsonStr === 'object' && jsonStr !== null) return jsonStr
    return ''
  }

  // 第三步：处理字符串类型输入（先去除首尾空白字符，避免 "  [1,2]  " 这类格式问题）
  const trimmedJsonStr = jsonStr.trim()
  if (!trimmedJsonStr) {
    return []
  }

  // 第四步：预判 JSON 类型（数组 / 对象），准备对应兜底值
  let isArrayType = false
  let fallbackValue = {} // 默认兜底为对象
  if (trimmedJsonStr.startsWith('[') && trimmedJsonStr.endsWith(']')) {
    isArrayType = true
    fallbackValue = [] // 数组类型兜底为 []
  } else if (trimmedJsonStr.startsWith('{') && trimmedJsonStr.endsWith('}')) {
    isArrayType = false
    fallbackValue = {} // 对象类型兜底为 {}
  } else {
    // 非标准 JSON 数组/对象字符串，返回原处理后字符串
    return trimmedJsonStr
  }

  // 第五步：执行 JSON 解析，捕获异常并返回对应兜底值（移除冗余的额外类型校验）
  try {
    const parsedResult = JSON.parse(trimmedJsonStr)
    // 直接返回解析结果（JSON.parse 已保证类型与预判一致，无需额外校验）
    return parsedResult
  } catch (error) {
    console.error('JSON 解析失败，返回对应兜底值：', error, '原始数据：', jsonStr)
    return fallbackValue
  }
}
