// 认证相关工具方法 & 配置
// 约定的 LocalStorage key，与后端/网关约定保持一致
import CryptoJS from 'crypto-js'

import {
  DATA_VORTEX_LS_JWT_ID,
  DATA_VORTEX_LS_TOKEN_ID,
  getJwt,
  setJwt,
  setPreAuthToken,
} from '@/store/storage'
import { refresh_token } from '@baidu/zerotrust-cross'

export {
  DATA_VORTEX_LS_JWT_ID,
  DATA_VORTEX_LS_TOKEN_ID,
  getJwt,
  setJwt,
}

// 解析 JWT，返回 payload 对象
export function parseJwtPayload(jwt) {
  if (!jwt || typeof jwt !== 'string') return null
  const parts = jwt.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder('utf-8').decode(bytes)
    return JSON.parse(json)
  } catch (e) {
    console.error('parseJwtPayload error', e)
    return null
  }
}

export async function sha256Hex(text) {
  // 判空校验（复用原逻辑的健壮性）
  if (typeof text !== 'string') {
    throw new Error('参数必须是字符串类型');
  }
  // CryptoJS 核心哈希计算（纯JS实现，无环境限制）
  const hash = CryptoJS.SHA256(text);
  // 转为 64 位小写十六进制字符串（与原代码输出格式完全一致）
  return CryptoJS.enc.Hex.stringify(hash);
}

// 根据 username 计算 token
export async function usernameToToken(username) {
  if (!username) return ''
  return sha256Hex(username)
}

// 刷新零信任预认证 token（防并发：多个请求同时触发时只刷新一次）
let refreshingPromise = null

export async function refreshPreAuthToken() {
  if (!refreshingPromise) {
    refreshingPromise = refresh_token('https://vortex-api.n.baidu-int.com/')
      .then(newToken => {
        setPreAuthToken(newToken)
        return newToken
      })
      .finally(() => {
        refreshingPromise = null
      })
  }
  return refreshingPromise
}

// 调用 /user/login 获取用户信息（含 jwt、groups 等）
export async function resolveUserFromLogin() {
  // 2. 从 /user/login 响应中获取用户信息
  try {
    const { login } = await import('@/api/user')
    const response = await login()

    // 注意：autobahnBackendService 拦截器已经返回 response.data
    // 所以 response 的结构是 {code, message, data: {user: {jwt, groups, ...}}}
    console.log('response', response)
    const user = response?.data?.user
    if (user) {
      return user
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }

  return null
}


