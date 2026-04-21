import { autobahnBackendService } from '@/utils/request'

/**
 * 获取命中率趋势数据（Dashboard 页面）
 * @param {string} [timeRange='1d'] - 时间范围: 1h, 6h, 1d, 7d, 30d
 */
export function kvDashboard(timeRange = '1d') {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/dashboard',
    method: 'get',
    params: { time_range: timeRange }
  })
}

/**
 * 获取可用模型列表（热加载，修改 models.json 即时生效）
 */
export function kvModels() {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/models',
    method: 'get'
  })
}

/**
 * 获取任务列表（分页，按创建时间降序）
 * @param {Object} [params] - 过滤参数 { username, task_name, status, page, page_size }
 * @returns {Promise<{ items: Array, total: number, page: number, page_size: number }>}
 */
export function kvTaskList(params) {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/tasks',
    method: 'get',
    params
  })
}

/**
 * 提交 ES 数据拉取任务（全自动 pipeline）
 * @param {Object} params - { start_datetime, end_datetime, app_id, task_name }
 */
export function kvFetch(params) {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/fetch',
    method: 'get',
    params
  })
}

/**
 * 查询当前用户 QPD 配额
 */
export function kvQpd() {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/qpd',
    method: 'get'
  })
}

/**
 * 查询任务状态
 * @param {string} taskId
 */
export function kvStatus(taskId) {
  return autobahnBackendService({
    url: `/api/v1/olap/kv/status/${taskId}`,
    method: 'get'
  })
}

/**
 * 软删除任务（运行中的会被取消）
 * @param {string} taskId
 */
export function kvDeleteTask(taskId) {
  return autobahnBackendService({
    url: `/api/v1/olap/kv/tasks/${taskId}`,
    method: 'delete'
  })
}

/**
 * 获取按时间片的命中率趋势数据（供详情页趋势图使用）
 * @param {string} taskId
 */
export function kvHitRateTrend(taskId) {
  return autobahnBackendService({
    url: `/api/v1/olap/kv/hit-rate-trend/${taskId}`,
    method: 'get'
  })
}

/**
 * 获取任务数据目录树（懒加载）
 * @param {Object} params - { task_id, path }
 */
export function kvFileTree(params) {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/file-tree',
    method: 'get',
    params
  })
}

/**
 * 获取全场景实时命中率趋势（常驻 Worker 产出）
 * @param {string} [timeRange='1h'] - 时间范围: 1h, 6h, 1d, 7d, 30d
 */
export function kvRealtime(timeRange = '1h') {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/realtime',
    method: 'get',
    params: { time_range: timeRange }
  })
}

/**
 * 获取实时 Worker 存活状态
 */
export function kvRealtimeStatus() {
  return autobahnBackendService({
    url: '/api/v1/olap/kv/realtime/status',
    method: 'get'
  })
}
