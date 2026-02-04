/*
 * @desc 日期格式化
 * @param {string} format 例如："yyyy/MM/dd"
 * @param {number} [timestamp] 时间戳，精确到毫秒
 * @returns {string}
 */
export function formatDate(format, timestamp) {
  let d = timestamp ? new Date(timestamp) : new Date()
  let o = {
    'M+': d.getMonth() + 1, // month
    'd+': d.getDate(), // day
    'h+': d.getHours(), // hour
    'm+': d.getMinutes(), // minute
    's+': d.getSeconds(), // second
    'q+': Math.floor((d.getMonth() + 3) / 3), // quarter
    'S': d.getMilliseconds() // millisecond
  }
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (d.getFullYear() + '').substring(4 - RegExp.$1.length))
  for (let k in o)
    if (new RegExp('(' + k + ')').test(format))
      format = format.replace(RegExp.$1,
        RegExp.$1.length == 1 ? o[k] :
        ('00' + o[k]).substring(('' + o[k]).length))
  return format
}

/*
 * @desc 复制文本
 * @param {string} text 复制内容
 * @param {function} success 成功回调
 */
export function copyText(text, success) {
    // 数字没有 .length 不能执行selectText 需要转化成字符串
    const textString = text.toString()
    let input = document.querySelector('#copy-input')
    if (!input) {
        input = document.createElement('input')
        input.id = 'copy-input'
        input.readOnly = 'readOnly'        // 防止ios聚焦触发键盘事件
        input.style.position = 'fixed'
        input.style.left = '-1000px'
        input.style.zIndex = '-1000'
        document.body.appendChild(input)
    }
    input.value = textString
    // ios必须先选中文字且不支持 input.select();
    selectText(input, 0, textString.length)
    if (document.execCommand('copy')) {
        document.execCommand('copy')
        if (success) {
            success(textString)
        } else {
            alert('已复制到粘贴板')
        }

    } else {
        console.log('不兼容')
    }
    input.blur()
    // input自带的select()方法在苹果端无法进行选择，所以需要自己去写一个类似的方法
    // 选择文本。createTextRange(setSelectionRange)是input方法
    function selectText(textbox, startIndex, stopIndex) {
        if (textbox.createTextRange) {// ie
            const range = textbox.createTextRange()
            range.collapse(true)
            range.moveStart('character', startIndex)// 起始光标
            range.moveEnd('character', stopIndex - startIndex)// 结束光标
            range.select()// 不兼容苹果
        } else {// firefox/chrome
            textbox.setSelectionRange(startIndex, stopIndex)
            textbox.focus()
        }
    }
}

export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result

  const later = function() {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function(...args) {
    context = this
    timestamp = +new Date()
    const callNow = immediate && !timeout
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}
