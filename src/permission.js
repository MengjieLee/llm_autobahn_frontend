import router from './router'
import {
  ctx,
  dispatch
} from './store'
import {
  getUserInfoFromToken
} from '@/utils/auth'
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

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = to.meta.title ? `${to.meta.title} - Data Autobahn` : `Data Autobahn`

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
        next()
      } else {
        try {
          // 使用本地 token + mock 文件解析用户信息
          const userInfo = await getUserInfoFromToken(hasToken)
          if (!userInfo) {
            throw new Error('本地未找到对应的用户信息，请重新授权登录')
          }
          dispatch.user.saveInfo(userInfo)
          next()
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
