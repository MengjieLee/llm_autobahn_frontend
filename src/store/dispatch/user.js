import {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
} from '../storage'
import {
  resetRouter
} from '@/router'

import ctx from '../context'

const state = ctx.userInfo

export default {
  getToken,
  setToken,
  removeToken,

  removeInfo() {
    removeToken() // must remove  token  first
    removeUserInfo()
    resetRouter() // 防止后退上一页跳到需要登录的页面
    Object.keys(state).forEach(key => delete state[key]);

  },

  saveInfo(data) {
    Object.assign(state, data)
    setUserInfo(data)
  },

  // 从 localStorage 恢复 userInfo 到内存态
  restoreInfo() {
    const info = getUserInfo()
    if (info) {
      Object.assign(state, info)
    }
    return info
  },

}
