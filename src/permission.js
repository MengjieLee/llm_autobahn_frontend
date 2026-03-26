import router from './router'
import {
  ctx,
  dispatch
} from './store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
  showSpinner: false,
})

// no redirect whitelist
const whiteList = [
  '/account/login',
  '/404'
]

// 检查用户 groups 是否满足路由要求的身份
// requiredGroups 中任意匹配一个即可
function hasRequiredGroup(route, userGroups) {
  const requiredGroups = route.matched
    .map(r => r.meta?.requiredGroups)
    .find(g => Array.isArray(g) && g.length > 0)

  // 路由未配置 requiredGroups，无需身份即可访问
  if (!requiredGroups) return true

  return requiredGroups.some(g => userGroups.includes(g))
}

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = to.meta.title ? `${to.meta.title} - Data Vortex` : `Data Vortex`

  // determine whether the user has logged in
  const hasToken = dispatch.user.getToken()

  if (hasToken) {

    if (to.path === '/account/login') {
      // if is logged in, redirect to the home page
      next({
        path: '/',
      })
      NProgress.done()
    } else {
      const hasUserInfo = ctx.userInfo.name

      if (hasUserInfo) {
        if (hasRequiredGroup(to, ctx.userInfo.groups || [])) {
          next()
        } else {
          ElMessage.error('您没有访问该页面的权限')
          next('/404')
          NProgress.done()
        }
      } else {
        try {
          // 从 localStorage 恢复用户信息（含 groups）
          const userInfo = dispatch.user.restoreInfo()
          if (!userInfo) {
            throw new Error('未找到用户信息，请重新授权登录')
          }
          dispatch.user.saveInfo(userInfo)
          if (hasRequiredGroup(to, userInfo.groups || [])) {
            next()
          } else {
            ElMessage.error('您没有访问该页面的权限')
            next('/404')
            NProgress.done()
          }
        } catch (error) {
          // remove token and go to login page to re-login
          dispatch.user.removeToken()
          ElMessage.error(error || 'Has Error')
          if (whiteList.indexOf(to.path) === -1) {
            next(`/account/login?redirect=${to.path}`)
            NProgress.done()
          } else {
            next()
          }
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) === -1) {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/account/login?redirect=${to.path}`)
      NProgress.done()
    } else {
      // in the free login whitelist, go directly
      next()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
