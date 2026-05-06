/**
 * MTP Eval 状态机常量 —— 单一权威定义
 *
 * 对齐上游: qf_mtp_eval/fastmtp_eval/static/app.js deriveLifecycle()
 *
 * Task 状态集: queued, preparing, materializing, starting, running,
 *              prepared, completed, failed, cancelled, finished, connector_missing
 * 历史别名:    done → completed, canceled → cancelled
 *
 * TaskRow 状态集: pending, running, completed, failed, cancelled, prepared
 */

// ─── 状态分组 ──────────────────────────────────────────────────────────

/** 活跃状态（任务正在进行中，支持取消） */
export const RUNNING_STATUSES = new Set([
  'queued', 'starting', 'running', 'preparing', 'materializing',
])

/** 终态（任务不会再自动推进） */
export const TERMINAL_STATUSES = new Set([
  'completed', 'failed', 'cancelled', 'prepared', 'finished', 'connector_missing',
])

// ─── 归一化 ────────────────────────────────────────────────────────────

/**
 * 状态归一化：处理历史别名和拼写兼容
 * - done → completed (pipeline.current_stage 返回值)
 * - canceled → cancelled (美式拼写兼容)
 * 注意: finished 保留为独立状态（进程死亡但结果不明），不归一化为 completed
 */
export function normalizeStatus(raw) {
  if (!raw) return 'unknown'
  if (raw === 'done') return 'completed'
  if (raw === 'canceled') return 'cancelled'
  return raw
}

// ─── 双 Pill 生命周期推导（对齐上游 deriveLifecycle） ─────────────────────

/**
 * 从原始 status 推导 Phase + Result 双层展示信息
 * 对齐上游 app.js deriveLifecycle()
 *
 * 返回值:
 *   phase      - 阶段文案 (Queued / Preparing / Prepared / Running / Finished)
 *   result     - 结果文案 (- / Manual Run / Completed / Failed / Cancelled / Connector Missing)
 *   phaseClass - 阶段 CSS class (queued / preparing / prepared / running / finished)
 *   resultClass- 结果 CSS class (neutral / completed / failed / cancelled)
 */
export function deriveLifecycle(status) {
  const raw = String(status || 'pending').toLowerCase()
  if (raw === 'queued' || raw === 'pending') {
    return { phase: 'Queued', result: '-', phaseClass: 'queued', resultClass: 'neutral' }
  }
  if (raw === 'starting') {
    return { phase: 'Starting', result: '-', phaseClass: 'running', resultClass: 'neutral' }
  }
  if (raw === 'preparing' || raw === 'materializing') {
    return { phase: 'Preparing', result: '-', phaseClass: 'preparing', resultClass: 'neutral' }
  }
  if (raw === 'prepared') {
    return { phase: 'Prepared', result: 'Manual Run', phaseClass: 'prepared', resultClass: 'neutral' }
  }
  if (raw === 'running') {
    return { phase: 'Running', result: '-', phaseClass: 'running', resultClass: 'neutral' }
  }
  if (raw === 'connector_missing') {
    return { phase: 'Finished', result: 'Connector Missing', phaseClass: 'finished', resultClass: 'failed' }
  }
  if (raw === 'completed' || raw === 'done') {
    return { phase: 'Finished', result: 'Completed', phaseClass: 'finished', resultClass: 'completed' }
  }
  if (raw === 'failed') {
    return { phase: 'Finished', result: 'Failed', phaseClass: 'finished', resultClass: 'failed' }
  }
  if (raw === 'cancelled' || raw === 'canceled') {
    return { phase: 'Finished', result: 'Cancelled', phaseClass: 'finished', resultClass: 'cancelled' }
  }
  if (raw === 'finished') {
    return { phase: 'Finished', result: '-', phaseClass: 'finished', resultClass: 'neutral' }
  }
  return { phase: raw || '-', result: '-', phaseClass: 'queued', resultClass: 'neutral' }
}

// ─── El-Tag 映射（兼容 Element Plus） ──────────────────────────────────

/**
 * Phase class → el-tag type
 * 对齐上游色彩:
 *   running → 蓝(primary/'')    preparing → 橙(warning)
 *   prepared → 蓝调(info)       queued → 信息(info)
 *   finished → 信息(info)
 */
export const PHASE_TAG_TYPES = {
  running: '',
  preparing: 'warning',
  prepared: 'info',
  queued: 'info',
  finished: 'info',
}

/**
 * Result class → el-tag type
 */
export const RESULT_TAG_TYPES = {
  completed: 'success',
  failed: 'danger',
  cancelled: 'info',
  neutral: '',
}

// ─── 状态过滤器选项（对齐上游页面 task-status-filter） ──────────────────

export const STATUS_FILTER_OPTIONS = [
  { label: 'Running', value: 'running' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Queued', value: 'queued' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
]

/** 展示范围选项（对齐上游 task-scope-filter） */
export const SCOPE_FILTER_OPTIONS = [
  { label: '最近 20 条', value: 'recent' },
  { label: '仅运行中/排队', value: 'active' },
  { label: '仅失败', value: 'failed' },
  { label: '全部', value: 'all' },
]

/** 排序选项（对齐上游 task-sort-select） */
export const SORT_OPTIONS = [
  { label: '按创建时间倒序', value: 'created_desc' },
  { label: '按创建时间正序', value: 'created_asc' },
  { label: '按任务名', value: 'name_asc' },
]
