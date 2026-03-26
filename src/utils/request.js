/* eslint-disable no-undef */
import axios from 'axios'

import {
  dispatch
} from '@/store'
import { getPreAuthToken } from '@/store/storage'
import { refreshPreAuthToken } from '@/utils/auth'


// SQLWrapper 专用的请求实例
const SQLWrapperService = axios.create({
  baseURL: import.meta.env.VITE_AUTOBAHN_BACKEND_HOST,
  timeout: 600000,
  withCredentials: true,
})

// SQLWrapperService 请求拦截器
SQLWrapperService.interceptors.request.use(
  config => {
    const token = dispatch.user.getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const preAuthToken = getPreAuthToken()
    if (preAuthToken) {
      config.headers['X-Zt-Auth-Token'] = preAuthToken
    }
    console.log(`SQLWrapperService config:${config}`)
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// SQLWrapperService 响应拦截器
SQLWrapperService.interceptors.response.use(
  response => {
    // console.log(response)
    const res = response.data

    // if the custom err_code is not 20000, it is judged as an error.
    if (response.status !== 200) {
      ElMessage({
        message: res.message || res.msg || 'SQLWrapperService Response Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.err_code === 50012 || res.err_code === 50014) {
        // to re-login
        ElMessageBox.confirm(
          'You have been logged out, you can cancel to stay on this page, or log in again',
          'Confirm logout', {
            confirmButtonText: 'Re-Login',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }).then(() => {
          dispatch.user.removeToken()
          location.reload()
        })
      }
      return Promise.reject(new Error(res.message || 'SQLWrapperService Response Error'))
    } else {
      return res
    }
  },
  error => {
    // 检测 pre_auth_token 过期：后端返回 X-Zt-CORS-Auth-Failed: true
    const corsAuthFailed = error.response?.headers?.['x-zt-cors-auth-failed']
    if (corsAuthFailed === 'true' && !error.config._retried) {
      error.config._retried = true
      return refreshPreAuthToken().then(newToken => {
        error.config.headers['X-Zt-Auth-Token'] = newToken
        return SQLWrapperService(error.config)
      })
    }
    console.log('err ' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

// autobahnBackend 专用的请求实例
const autobahnBackendService = axios.create({
  baseURL: import.meta.env.VITE_AUTOBAHN_BACKEND_HOST,
  timeout: 60000,
  withCredentials: true,
})

// autobahnBackend 请求拦截器
autobahnBackendService.interceptors.request.use(
  config => {
    const token = dispatch.user.getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const preAuthToken = getPreAuthToken()
    if (preAuthToken) {
      config.headers['X-Zt-Auth-Token'] = preAuthToken
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// autobahnBackend 响应拦截器
autobahnBackendService.interceptors.response.use(
  response => {
    const res = response.data

    // if the custom err_code is not 20000, it is judged as an error.
    if (response.status !== 200) {
      ElMessage({
        message: res.message || res.msg || 'autobahnBackend Response Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.err_code === 50008 || res.err_code === 50012 || res.err_code === 50014) {
        // to re-login
        ElMessageBox.confirm(
          'You have been logged out, you can cancel to stay on this page, or log in again',
          'Confirm logout', {
            confirmButtonText: 'Re-Login',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }).then(() => {
          dispatch.user.removeToken()
          location.reload()
        })
      }
      return Promise.reject(new Error(res.message || 'autobahnBackend Response Error'))
    } else {
      return res
    }
  },
  error => {
    // 检测 pre_auth_token 过期：后端返回 X-Zt-CORS-Auth-Failed: true
    const corsAuthFailed = error.response?.headers?.['x-zt-cors-auth-failed']
    if (corsAuthFailed === 'true' && !error.config._retried) {
      error.config._retried = true
      return refreshPreAuthToken().then(newToken => {
        error.config.headers['X-Zt-Auth-Token'] = newToken
        return autobahnBackendService(error.config)
      })
    }
    console.log('err: ' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default autobahnBackendService
export { autobahnBackendService, SQLWrapperService }
