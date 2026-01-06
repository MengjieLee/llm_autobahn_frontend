// 本地认证相关工具方法 & 配置
// 约定的 LocalStorage key，与后端/网关约定保持一致
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
    groups: ['official', 'group_a'],
  },
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
  // 1. 严格校验浏览器环境 & 安全上下文 & Crypto API 可用性
  if (typeof window === 'undefined') {
    throw new Error('This function only runs in the browser environment');
  }
  // 浏览器crypto对象优先级：window.crypto > globalThis.crypto
  const cryptoObj = window.crypto || globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error(
      'Web Crypto API is not available. \n' +
      '👉 解决方案：1. 使用HTTPS协议 2. 本地开发用localhost/127.0.0.1'
    );
  }

  // 2. 标准SHA256哈希流程
  const encoder = new TextEncoder();
  const data = encoder.encode(text); // 文本转Uint8Array二进制
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data); // 计算哈希
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // 转8位无符号数组
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // 转64位十六进制字符串
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
  const stored = getJwt()
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


