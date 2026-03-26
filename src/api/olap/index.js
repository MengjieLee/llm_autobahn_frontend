import { autobahnBackendService } from '@/utils/request'

/**
 * 获取任务列表（按创建时间降序）
 * @param {Object} [params] - 可选过滤参数 { username, task_name }
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
