import { autobahnBackendService } from '@/utils/request'

// 登录请求：调用后会跳转到零信任网关 UUAP，不需要传递 data
// 从响应 Headers 的 X-Zt-Authorization 字段中获取 JWT
export function login() {
  return autobahnBackendService({
    url: '/api/v1/account/login',
    method: 'post'
  })
}

export function logout() {
  return autobahnBackendService({
    url: '/api/v1/account/logout',
    method: 'post'
  })
}
