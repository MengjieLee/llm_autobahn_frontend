<template>
  <el-dialog
    v-model="visible"
    title="任务详情"
    width="95%"
    style="max-width: 1400px"
    destroy-on-close
  >
    <!-- 加载状态 -->
    <div v-if="loading" v-loading="true" element-loading-text="正在加载任务详情…" class="detail-loading" />

    <template v-else-if="task">
      <!-- 基本信息 -->
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="任务 ID">{{ task.id }}</el-descriptions-item>
        <el-descriptions-item label="任务名">{{ task.name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="连接器">{{ task.connector_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="执行模式">
          <el-tag type="primary" size="small">
            {{ task.execution_mode || '—' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <div class="status-stack">
            <el-tag :type="phaseTagType" size="small">{{ lifecycle.phase }}</el-tag>
            <el-tag v-if="lifecycle.result !== '-'" :type="resultTagType" size="small">{{ lifecycle.result }}</el-tag>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ task.created_at || '—' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 物化模式：脚本路径 -->
      <template v-if="isMaterialize && task.manual_run">
        <el-divider content-position="left">Run Scripts</el-divider>
        <div class="script-block">
          <div v-for="(val, key) in task.manual_run" :key="key" class="script-row">
            <span class="script-key">{{ key }}:</span>
            <code class="script-val">{{ val }}</code>
            <el-button link size="small" @click="copy(val)">复制</el-button>
          </div>
        </div>
      </template>

      <!-- task_rows 基准测试明细 -->
      <el-divider content-position="left">基准测试明细</el-divider>
      <el-table :data="taskRows" size="small" stripe border style="width: 100%" :default-sort="{ prop: 'id' }">
        <el-table-column prop="id" label="id" min-width="100">
          <template #default="{ row }">{{ row.id || '—' }}</template>
        </el-table-column>
        <el-table-column prop="bench" label="bench" min-width="100">
          <template #default="{ row }">{{ row.bench || '—' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="status" width="140">
          <template #default="{ row }">
            <div class="status-stack">
              <el-tag :type="rowPhaseType(row.status)" size="small">{{ rowLifecycle(row.status).phase }}</el-tag>
              <el-tag v-if="rowLifecycle(row.status).result !== '-'" :type="rowResultType(row.status)" size="small">{{ rowLifecycle(row.status).result }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="progress" width="90" align="center">
          <template #default="{ row }">{{ row.progress || '—' }}</template>
        </el-table-column>
        <template v-if="showMetrics">
          <el-table-column label="throughput" width="95" align="center">
            <template #default="{ row }">{{ fmtNum(row.throughput) }}</template>
          </el-table-column>
          <el-table-column label="latency" width="80" align="center">
            <template #default="{ row }">{{ fmtNum(row.latency) }}</template>
          </el-table-column>
          <el-table-column label="eta" width="70" align="center">
            <template #default="{ row }">{{ row.eta || '—' }}</template>
          </el-table-column>
          <el-table-column width="90" align="center">
            <template #header>
              <el-tooltip content="Macro=mean。先对每条样本单独算接受长度，再对样本平均。" placement="top">
                <span>al_macro <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ fmtNum(row.macro_accept_length ?? row.sample_mean_accept_length ?? row.accept_length) }}</template>
          </el-table-column>
          <el-table-column width="90" align="center">
            <template #header>
              <el-tooltip content="Micro=pooled。把所有 verify 混在一起统计，相当于 sum(accept_length)/sum(verify_ct)。" placement="top">
                <span>al_micro <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ fmtNum(row.micro_accept_length ?? row.pooled_accept_length ?? row.accept_length_sum_over_sum) }}</template>
          </el-table-column>
          <el-table-column min-width="130">
            <template #header>
              <el-tooltip content="先对每条样本单独算条件头接受率 AR，再对样本平均。" placement="top">
                <span>ar_macro <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ formatRates(row.macro_mtp_head_accept_rates || row.sample_mean_mtp_head_accept_rates) }}</template>
          </el-table-column>
          <el-table-column min-width="130">
            <template #header>
              <el-tooltip content="先对每条样本单独算累计头接受率 CumAR，再对样本平均；它和 AL_macro 严格配套。" placement="top">
                <span>cumar_macro <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ formatRates(row.macro_mtp_head_cumulative_accept_rates || row.sample_mean_mtp_head_cumulative_accept_rates) }}</template>
          </el-table-column>
          <el-table-column min-width="130">
            <template #header>
              <el-tooltip content="把所有 verify 混在一起统计得到的条件头接受率 AR。" placement="top">
                <span>ar_micro <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ formatRates(row.micro_mtp_head_accept_rates || row.pooled_mtp_head_accept_rates) }}</template>
          </el-table-column>
          <el-table-column min-width="120">
            <template #header>
              <el-tooltip content="按 verify 级接受长度统计的 pooled diff 分布。格式为 diff:count。" placement="top">
                <span>diff_hist <span class="metric-help">?</span></span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ formatDiffHist(row.pooled_stream_completion_token_diff_histogram) }}</template>
          </el-table-column>
          <el-table-column label="f_acc" width="80" align="center">
            <template #default="{ row }">{{ fmtNum(row.filtered_accept_length) }}</template>
          </el-table-column>
          <el-table-column label="success" width="70" align="center">
            <template #default="{ row }">{{ row.success_count ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="failure" width="70" align="center">
            <template #default="{ row }">{{ row.failure_count ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="top_error" min-width="120">
            <template #default="{ row }">
              <el-tooltip v-if="row.error_counter" :content="JSON.stringify(row.error_counter)" placement="top">
                <span class="mono small">{{ formatErrorSummary(row.error_counter) }}</span>
              </el-tooltip>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="outputs" min-width="200">
          <template #default="{ row }">
            <div class="inline-actions">
              <el-button v-if="row.args" link size="small" @click="showJson('config', row.args)">查看配置</el-button>
              <el-button v-if="row.run_dir" link size="small" @click="copy(row.run_dir)">查看目录</el-button>
              <el-button v-if="row.outputs" link size="small" @click="showJson('outputs', row.outputs)">查看输出</el-button>
              <el-button link size="small" @click="showLog(row, 'runner')">runner log</el-button>
              <el-button v-if="row.outputs?.service_log" link size="small" @click="showLog(row, 'service')">service log</el-button>
              <el-button v-if="row.manual_run" link size="small" @click="copy(row.manual_run.command || row.manual_run.script_path || '')">manual run</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 操作 -->
      <div class="detail-actions" v-if="canCancel">
        <el-popconfirm title="确认取消该任务？" @confirm="doCancel">
          <template #reference>
            <el-button type="danger" :loading="cancelling">取消任务</el-button>
          </template>
        </el-popconfirm>
      </div>
    </template>

    <!-- 加载失败 / 空 -->
    <el-empty v-else-if="!loading" description="未能加载任务详情" />
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { mtpGetTask, mtpCancelTask } from '@/api/mtpEval/index'
import { RUNNING_STATUSES, TERMINAL_STATUSES, normalizeStatus, deriveLifecycle, PHASE_TAG_TYPES, RESULT_TAG_TYPES } from '../constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  taskId: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'cancelled'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const task = ref(null)
const loading = ref(false)
const cancelling = ref(false)
let pollTimer = null

const isMaterialize = computed(() => task.value?.execution_mode === 'materialize_only')

const isCompleted = computed(() => statusKey.value === 'completed' || statusKey.value === 'failed')

const showMetrics = computed(() => !isMaterialize.value || isCompleted.value)

const statusKey = computed(() => {
  const raw = task.value?.pipeline?.current_stage || task.value?.status || 'unknown'
  return normalizeStatus(raw)
})

const lifecycle = computed(() => deriveLifecycle(statusKey.value))

const phaseTagType = computed(() => PHASE_TAG_TYPES[lifecycle.value.phaseClass] || 'info')

const resultTagType = computed(() => RESULT_TAG_TYPES[lifecycle.value.resultClass] || '')

const canCancel = computed(() => RUNNING_STATUSES.has(statusKey.value))

const taskRows = computed(() => task.value?.task_rows || [])

const rowLifecycle = (s) => deriveLifecycle(normalizeStatus(s))
const rowPhaseType = (s) => PHASE_TAG_TYPES[rowLifecycle(s).phaseClass] || 'info'
const rowResultType = (s) => RESULT_TAG_TYPES[rowLifecycle(s).resultClass] || ''

const fmtNum = (v) => v != null ? Number(v).toFixed(3) : '—'

const formatRates = (rates) => {
  if (!rates) return '—'
  if (Array.isArray(rates)) return rates.map(r => Number(r).toFixed(3)).join(', ')
  if (rates && typeof rates === 'object') {
    return ['head_1', 'head_2', 'head_3', 'head_4']
      .filter(k => rates[k] != null)
      .map(k => `${k.replace('head_', 'h')}:${Number(rates[k]).toFixed(3)}`)
      .join('  ')
      || '—'
  }
  return String(rates)
}

const formatDiffHist = (hist) => {
  if (!hist || typeof hist !== 'object') return '—'
  const entries = Object.entries(hist)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, v]) => `${k}:${v}`)
  return entries.length ? entries.join(' ') : '—'
}

const formatErrorSummary = (counter) => {
  if (!counter || typeof counter !== 'object') return '—'
  const entries = Object.entries(counter).sort(([, a], [, b]) => b - a)
  if (!entries.length) return '—'
  const [msg, count] = entries[0]
  const short = msg.length > 40 ? msg.slice(0, 40) + '…' : msg
  return `${short} (${count})`
}

const showJson = (title, data) => {
  ElMessageBox.alert(JSON.stringify(data, null, 2), title, {
    confirmButtonText: '关闭',
    customClass: 'json-preview-box',
    dangerouslyUseHTMLString: true,
    message: `<pre style="white-space:pre-wrap;word-break:break-all;max-height:400px;overflow:auto;font-size:12px">${JSON.stringify(data, null, 2)}</pre>`,
  })
}

const showLog = (row, kind) => {
  const logPath = kind === 'runner'
    ? (row.outputs?.runner_log || `${row.run_dir}/runner.log`)
    : (row.outputs?.service_log || `${row.run_dir}/service.log`)
  copy(logPath)
}

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

const loadTask = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    const res = await mtpGetTask(props.taskId)
    task.value = res.data || null
  } catch (e) {
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

const doCancel = async () => {
  cancelling.value = true
  try {
    await mtpCancelTask(props.taskId)
    ElMessage.success('已取消')
    emit('cancelled')
    await loadTask()
  } catch (e) {
    ElMessage.error('取消失败: ' + (e.message || e))
  } finally {
    cancelling.value = false
  }
}

const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!props.taskId || !visible.value) return
    try {
      const res = await mtpGetTask(props.taskId, { poll: true })
      task.value = res.data || null
      if (TERMINAL_STATUSES.has(statusKey.value)) {
        stopPolling()
      }
    } catch { /* ignore */ }
  }, 15000)
}

const stopPolling = () => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

watch(visible, (v) => {
  if (v && props.taskId) {
    loadTask().then(() => {
      if (task.value && RUNNING_STATUSES.has(statusKey.value)) startPolling()
    })
  } else {
    stopPolling()
    task.value = null
  }
})
</script>

<style scoped>
.status-stack {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.script-block {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}
.script-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.script-row:last-child { margin-bottom: 0; }
.script-key { font-size: 12px; color: #909399; min-width: 80px; }
.script-val {
  font-size: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 2px 8px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.script-val.small { font-size: 11px; }

.detail-actions {
  margin-top: 16px;
  text-align: right;
}

.detail-loading {
  min-height: 200px;
}

.metric-help {
  color: #409eff;
  cursor: help;
  font-size: 11px;
  margin-left: 2px;
}

.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mono { font-family: monospace; }
.small { font-size: 11px; }
</style>
