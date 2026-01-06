import request from '@/utils/request'

// 登录请求：调用后会跳转到零信任网关 UUAP，不需要传递 data
// 从响应 Headers 的 X-Zt-Authorization 字段中获取 JWT
export function login() {
  return request({
    url: '/user/login',
    method: 'get',
    returnFullResponse: true, // 标记需要返回完整响应对象，以便访问 headers
    // 不传递 data，让请求自动跳转到 UUAP 网关
  })
}

export function getInfo() {
  return request({
    url: '/user/info',
    method: 'get',
  })
}

export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}
