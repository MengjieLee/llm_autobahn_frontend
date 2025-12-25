import 'normalize.css/normalize.css' // CSS resets
import '@/styles/main.scss' // global css

// ======================== dayjs 优化配置 START ========================
import dayjs from 'dayjs'
// 1. 按需引入常用插件（根据业务需求增删，示例为通用必备）
import relativeTime from 'dayjs/plugin/relativeTime' // 相对时间（如“1小时前”）
import localizedFormat from 'dayjs/plugin/localizedFormat' // 本地化格式（LLLL/LL等）
import 'dayjs/locale/zh-cn' // 中文语言包（全局默认中文）

// 2. 注册插件 + 全局配置
dayjs.extend(relativeTime) // 启用相对时间插件
dayjs.extend(localizedFormat) // 启用本地化格式插件
dayjs.locale('zh-cn') // 全局默认语言为中文（无需每个组件单独设置）

// ======================== dayjs 优化配置 END ========================

// import 'element-plus/theme-chalk/dark/css-vars.css' // dark theme
// dark theme 动态的dark模式样式文件 // theme/index.scss 也将起效 
// 参见 https://juejin.cn/post/7442573821444390949
import 'element-plus/theme-chalk/src/dark/css-vars.scss' 
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import SvgIcon from './components/SvgIcon.vue'
import { ctx } from './store'
import './permission'

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  const { worker } = await import('../mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    // quiet: true, // Disables all the logging from the library (e.g. the activation message, the intercepted requests’ messages).
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
    // Decide how to react to unhandled requests (i.e. those that do not have a matching request handler).
    // filter warnings
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      if (url.pathname.includes('/dev-api')) {
        print.warning()
      }
      return
    },
  })
}

enableMocking().then(async () => {
  // await import('@/permission')

  const app = createApp(App)
  
  // ======================== dayjs 全局挂载优化 ========================
  // 1. 基础挂载（选项式API可用 this.$dayjs）
  app.config.globalProperties.$dayjs = dayjs
  // 可选：组合式API推荐：provide 方式（更贴合Vue3生态，TS友好）
  // app.provide('$dayjs', dayjs)
  // 2. 可选：封装全局通用格式化方法（减少组件重复代码）
  app.provide('$formattedCNTime', (time, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!time) return '-' // 容错：空值返回占位符
    return dayjs(time).format(format)
  })

  // 原有逻辑保留
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  app.use(router) // It must be after the enablemock function

  app.provide('context', ctx)
  app.component('svg-icon', SvgIcon)

  app.mount('#app')
})