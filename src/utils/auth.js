// 本地认证相关工具方法 & 配置
// 约定的 LocalStorage key，与后端/网关约定保持一致
import CryptoJS from 'crypto-js'

import {
  DATA_VORTEX_LS_JWT_ID,
  DATA_VORTEX_LS_TOKEN_ID,
  getJwt,
  setJwt,
} from '@/store/storage'

export {
  DATA_VORTEX_LS_JWT_ID,
  DATA_VORTEX_LS_TOKEN_ID,
  getJwt,
  setJwt,
}



// 本地用户配置（mock 文件）
// 使用 username 作为 key，方便维护；运行时通过 username 计算 token 再反查。
// TODO: 按实际 UUAP 账号补充/修改这里的映射关系
export const LOCAL_USER_CONFIG = {
  'v_limengjie03': {
    name: '李梦杰',
    groups: ['official',],
  },
  'chenjieting': {
    name: '陈捷挺',
    groups: ['official',],
  }
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

// 使用 token 遍历本地 mock 配置，解析出用户信息（name / username / groups）
export async function getUserInfoFromToken(token) {
  if (!token) return null

  const entries = Object.entries(LOCAL_USER_CONFIG)
  for (const [username, cfg] of entries) {
    const candidate = await usernameToToken(username)
    if (candidate === token) {
      return {
        username,
        name: cfg.name || username,
        groups: Array.isArray(cfg.groups) ? cfg.groups : [],
      }
    }
  }
  return null
}

// 从 /user/login 请求的响应 Headers 中获取 JWT
// 该请求会自动跳转到零信任网关 UUAP，响应 Headers 中包含 X-Zt-Authorization 字段
export async function resolveJwtFromContext() {
  // 1. 优先从 LocalStorage 中读取（可能是之前已经获取并保存过的）
  const stored = getJwt() || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZfbGltZW5namllMDNAYmFpZHUuY29tIiwiaWF0IjoxNzY2OTk4MTMyLCJleHAiOjE3NjcwMDE3MzIsIm5hbWUiOiLmnY7moqbmnbAiLCJ1c2VybmFtZSI6InZfbGltZW5namllMDMiLCJpc3MiOiJ6dCJ9.TVDGfhZIBQMx-NEe2jciIERcBlCT6GeCbEOeN9SdO4M"
  if (stored) {
    return stored
  }

  // 2. TODO 调用 /user/login API，从响应 Headers 中获取 X-Zt-Authorization
  try {
    const { login } = await import('@/api/user')
    const response = await login()
    
    // 从响应 headers 中获取 X-Zt-Authorization
    // axios 响应对象中，headers 是标准化的（小写），但也可以尝试不同的大小写格式
    const headers = response?.headers || {}
    const jwt = headers['x-zt-authorization'] || 
                headers['X-Zt-Authorization'] ||
                headers['X-ZT-AUTHORIZATION'] ||
                // 某些情况下 headers 可能是 Headers 对象，需要使用 get 方法
                (headers.get && headers.get('X-Zt-Authorization')) ||
                (headers.get && headers.get('x-zt-authorization'))
    
    if (jwt) {
      return String(jwt)
    }
  } catch (error) {
    console.error('获取 JWT 失败:', error)
    // 如果请求失败，可能是已经跳转到 UUAP 网关，返回空字符串
    return ''
  }

  return ''
}


