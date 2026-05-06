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

// ─── 过滤器选项 ────────────────────────────────────────────────────────

/** Phase 过滤器（按阶段过滤，对齐 deriveLifecycle.phase） */
export const STATUS_FILTER_OPTIONS = [
  { label: 'Queued', value: 'queued' },
  { label: 'Starting', value: 'starting' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Prepared', value: 'prepared' },
  { label: 'Running', value: 'running' },
  { label: 'Finished', value: 'finished' },
]

/** Result 过滤器（按结果过滤，对齐 deriveLifecycle.result） */
export const SCOPE_FILTER_OPTIONS = [
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Connector Missing', value: 'connector_missing' },
  { label: 'Manual Run', value: 'manual_run' },
]
