const sidebarOpenedCacheKey = 'VA_sidebar_opened'
// 统一使用 DATA_VORTEX 前缀的缓存 key，便于与后端/网关对齐
export const DATA_VORTEX_LS_JWT_ID = 'data_vortex_jwt'
export const DATA_VORTEX_LS_TOKEN_ID = 'data_vortex_auth_token'
export const DATA_VORTEX_LS_PRE_AUTH_TOKEN_ID = 'data_vortex_pre_auth_token'

const tokenCacheKey = DATA_VORTEX_LS_TOKEN_ID
const themeCacheKey = 'VA_theme'

export function getToken() {
  return localStorage.getItem(tokenCacheKey)
}

export function setToken(token) {
  return localStorage.setItem(tokenCacheKey, token)
}

export function removeToken() {
  return localStorage.removeItem(tokenCacheKey)
}

export function getJwt() {
  return localStorage.getItem(DATA_VORTEX_LS_JWT_ID)
}

export function setJwt(jwt) {
  return localStorage.setItem(DATA_VORTEX_LS_JWT_ID, jwt)
}

export function removeJwt() {
  return localStorage.removeItem(DATA_VORTEX_LS_JWT_ID)
}

export function getPreAuthToken() {
  return localStorage.getItem(DATA_VORTEX_LS_PRE_AUTH_TOKEN_ID)
}

export function setPreAuthToken(token) {
  return localStorage.setItem(DATA_VORTEX_LS_PRE_AUTH_TOKEN_ID, token)
}

export function removePreAuthToken() {
  return localStorage.removeItem(DATA_VORTEX_LS_PRE_AUTH_TOKEN_ID)
}

const userInfoCacheKey = 'data_vortex_user_info'

export function getUserInfo() {
  try {
    const raw = localStorage.getItem(userInfoCacheKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUserInfo(info) {
  return localStorage.setItem(userInfoCacheKey, JSON.stringify(info))
}

export function removeUserInfo() {
  return localStorage.removeItem(userInfoCacheKey)
}

export function getSidebarStatus() {
  const status = localStorage.getItem(sidebarOpenedCacheKey)
  return status ? !!+status : true
}

export function setSidebarStatus(status) {
  localStorage.setItem(sidebarOpenedCacheKey, status ? 1 : 0)
}

export function setTheme(tName) {
  localStorage.setItem(themeCacheKey, tName)
}

export function getTheme() {
  return localStorage.getItem(themeCacheKey) || ''
}

