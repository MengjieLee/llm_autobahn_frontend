import { autobahnBackendService } from '@/utils/request'

const BASE = '/api/v1/mtp_eval'

// ===================== Benchmarks =====================

/** 获取可用基准测试列表 */
export function mtpListBenches() {
  return autobahnBackendService({ url: `${BASE}/benches`, method: 'get' })
}

// ===================== Connectors =====================

/** 获取已创建的连接器列表 */
export function mtpListConnectors() {
  return autobahnBackendService({ url: `${BASE}/connectors`, method: 'get' })
}

/** 创建连接器 */
export function mtpCreateConnector(data) {
  return autobahnBackendService({ url: `${BASE}/connectors`, method: 'post', data })
}

/** 获取连接器内置预设列表 */
export function mtpListConnectorPresets() {
  return autobahnBackendService({ url: `${BASE}/connector-presets`, method: 'get' })
}

// ===================== Service Profiles =====================

/** 获取已保存的服务模板列表 */
export function mtpListServiceProfiles() {
  return autobahnBackendService({ url: `${BASE}/service-profiles`, method: 'get' })
}

/** 创建/保存服务模板 */
export function mtpCreateServiceProfile(data) {
  return autobahnBackendService({ url: `${BASE}/service-profiles`, method: 'post', data })
}

/** 获取服务内置预设列表 */
export function mtpListServicePresets() {
  return autobahnBackendService({ url: `${BASE}/service-presets`, method: 'get' })
}

// ===================== Task Presets =====================

/** 获取任务内置预设列表 */
export function mtpListTaskPresets() {
  return autobahnBackendService({ url: `${BASE}/task-presets`, method: 'get' })
}

// ===================== Service Preview =====================

/** 预览部署脚本 */
export function mtpPreviewService(data) {
  return autobahnBackendService({ url: `${BASE}/service-preview`, method: 'post', data })
}

// ===================== Tasks =====================

/** 获取评测任务列表 */
export function mtpListTasks({ poll = false } = {}) {
  return autobahnBackendService({ url: `${BASE}/tasks`, method: 'get', params: poll ? { poll: 1 } : undefined })
}

/** 获取单个任务详情 */
export function mtpGetTask(taskId, { poll = false } = {}) {
  return autobahnBackendService({ url: `${BASE}/tasks/${taskId}`, method: 'get', params: poll ? { poll: 1 } : undefined })
}

/** 获取任务启动配置（用于加载此配置） */
export function mtpGetTaskLaunchConfig(taskId) {
  return autobahnBackendService({ url: `${BASE}/tasks/${taskId}/launch-config`, method: 'get' })
}

/** 发起评测任务 */
export function mtpLaunchTask(data) {
  return autobahnBackendService({ url: `${BASE}/tasks/launch`, method: 'post', data })
}

/** 取消评测任务 */
export function mtpCancelTask(taskId) {
  return autobahnBackendService({ url: `${BASE}/tasks/${taskId}/cancel`, method: 'post' })
}

// ===================== Stats =====================

/** 获取统计数据 */
export function mtpGetStats(hours = 24) {
  return autobahnBackendService({ url: `${BASE}/stats`, method: 'get', params: { hours } })
}
