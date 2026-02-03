/* eslint-disable no-undef */
import axios from 'axios'

import {
  dispatch
} from '@/store'

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    const token = dispatch.user.getToken()
    if (token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['token'] = token
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    // 如果请求配置中标记了需要返回完整响应（用于获取 headers），则直接返回完整 response
    if (response.config?.returnFullResponse) {
      return response
    }

    const res = response.data

    // if the custom code is not 20000, it is judged as an error.
    if (res.code !== 20000) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
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
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err ' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)


// SQLWrapper 专用的请求实例
const SQLWrapperService = axios.create({
  baseURL: import.meta.env.VITE_AUTOBAHN_BACKEND_HOST,
  timeout: 600000
})

// SQLWrapperService 请求拦截器
SQLWrapperService.interceptors.request.use(
  config => {
    const token = dispatch.user.getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
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
  timeout: 60000
})

// autobahnBackend 请求拦截器
autobahnBackendService.interceptors.request.use(
  config => {
    const token = dispatch.user.getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
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
    // console.log(response)
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
    console.log('err ' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
export { autobahnBackendService, SQLWrapperService }
