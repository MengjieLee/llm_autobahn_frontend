<template>
  <el-dialog
    v-model="visible"
    title="任务详情"
    width="850px"
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
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
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
      <el-table :data="taskRows" size="small" stripe border style="width: 100%">
        <el-table-column prop="bench" label="Bench" min-width="120">
          <template #default="{ row }">{{ row.bench || row.id || '—' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="110">
          <template #default="{ row }">
            <el-tag :type="rowStatusType(row.status)" size="small">{{ row.status || '—' }}</el-tag>
          </template>
        </el-table-column>
        <template v-if="showMetrics">
          <el-table-column label="accept_len" width="100" align="center">
            <template #default="{ row }">{{ fmtNum(row.accept_length) }}</template>
          </el-table-column>
          <el-table-column label="throughput" width="100" align="center">
            <template #default="{ row }">{{ fmtNum(row.throughput) }}</template>
          </el-table-column>
          <el-table-column label="latency" width="90" align="center">
            <template #default="{ row }">{{ fmtNum(row.latency) }}</template>
          </el-table-column>
          <el-table-column label="MTP head rates" min-width="140">
            <template #default="{ row }">
              <span v-if="row.macro_mtp_head_accept_rates">
                {{ formatRates(row.macro_mtp_head_accept_rates) }}
              </span>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column label="Run Script" min-width="200">
            <template #default="{ row }">
              <code v-if="row.manual_run" class="script-val small">{{ row.manual_run }}</code>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </template>
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
import { mtpGetTask, mtpCancelTask } from '@/api/mtpEval/index'

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

const RUNNING_STATUSES = new Set(['queued', 'starting', 'running', 'preparing', 'materializing'])
const TERMINAL_STATUSES = new Set(['completed', 'done', 'failed', 'cancelled', 'prepared'])

const isMaterialize = computed(() => task.value?.execution_mode === 'materialize_only')

const isCompleted = computed(() => statusKey.value === 'completed' || statusKey.value === 'failed')

const showMetrics = computed(() => !isMaterialize.value || isCompleted.value)

const statusKey = computed(() => {
  const s = task.value?.pipeline?.current_stage || task.value?.status || 'unknown'
  return s === 'done' ? 'completed' : s
})

const statusLabel = computed(() => {
  const map = {
    queued: 'Queued', starting: 'Starting', running: 'Running',
    completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled',
    preparing: 'Preparing', materializing: 'Materializing', prepared: 'Prepared',
    scheduled: 'Scheduled', unknown: 'Unknown',
  }
  return map[statusKey.value] || statusKey.value
})

const statusTagType = computed(() => {
  const map = {
    running: '', starting: '', queued: 'info',
    completed: 'success', failed: 'danger', cancelled: 'info',
    preparing: 'warning', materializing: 'warning', prepared: 'success',
  }
  return map[statusKey.value] || 'info'
})

const canCancel = computed(() => RUNNING_STATUSES.has(statusKey.value))

const taskRows = computed(() => task.value?.task_rows || [])

const rowStatusType = (s) => {
  if (s === 'completed' || s === 'done' || s === 'prepared') return 'success'
  if (s === 'failed') return 'danger'
  if (s === 'running') return ''
  return 'info'
}

const fmtNum = (v) => v != null ? Number(v).toFixed(3) : '—'

const formatRates = (rates) => {
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
      const s = task.value?.pipeline?.current_stage || task.value?.status
      if (TERMINAL_STATUSES.has(s) || TERMINAL_STATUSES.has(s === 'done' ? 'completed' : s)) {
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
</style>
