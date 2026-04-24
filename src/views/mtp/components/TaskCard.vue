<template>
  <div
    class="mtp-task-card"
    :class="[`status-${statusKey}`, { 'is-running': isRunning }]"
  >
    <!-- 顶栏：名称 + 状态 + 操作 -->
    <div class="card-top">
      <div class="card-top-left">
        <span class="task-name" :title="task.name || task.id">{{ task.name || task.id }}</span>
        <el-tag :type="statusTagType" :class="statusTagClass" size="small" disable-transitions>
          <span v-if="isRunning" class="running-dot" />
          {{ statusLabel }}
        </el-tag>
      </div>
      <div class="card-top-right">
        <el-button size="small" @click.stop="$emit('click', task)">查看详情</el-button>
        <el-button size="small" @click.stop="$emit('load-config', task)">加载此配置</el-button>
        <el-popconfirm
          v-if="canCancel"
          title="确认取消该任务？"
          confirm-button-text="取消任务"
          cancel-button-text="不了"
          @confirm.stop="$emit('cancel', task.id)"
        >
          <template #reference>
            <el-button type="danger" size="small" link @click.stop>取消</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 指标网格 -->
    <div class="card-grid">
      <!-- Row 1: 基本信息 -->
      <div class="cell">
        <span class="cell-label">CREATED</span>
        <span class="cell-value">{{ task.created_at || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">OWNER</span>
        <span class="cell-value">{{ task.owner || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">CONNECTOR</span>
        <span class="cell-value">{{ task.connector_name || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">SERVICE</span>
        <span class="cell-value">{{ serviceName }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">EXEC MODE</span>
        <span class="cell-value">{{ task.execution_mode || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">QUEUE GROUP</span>
        <span class="cell-value">{{ task.queue_group || '—' }}</span>
      </div>

      <!-- Row 2: 进度 -->
      <div class="cell">
        <span class="cell-label">ROWS PROGRESS</span>
        <span class="cell-value">{{ summary.rowsProgress || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">OVERALL PROGRESS</span>
        <span class="cell-value">{{ summary.overallProgress || '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">SUCCESS</span>
        <span class="cell-value">{{ summary.successCount ?? '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">FAILURE</span>
        <span class="cell-value">{{ summary.failureCount ?? '—' }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">PHASE</span>
        <span class="cell-value">{{ statusLabel }}</span>
      </div>
      <div class="cell">
        <span class="cell-label">RESULT</span>
        <span class="cell-value">{{ resultLabel }}</span>
      </div>

      <!-- Row 3: 核心指标（execute 模式 或 完成态的 materialize 模式） -->
      <template v-if="mode === 'execute' || (mode === 'materialize' && isTerminal)">
        <div class="cell">
          <span class="cell-label">THROUGHPUT</span>
          <span class="cell-value">{{ fmtNum(summary.throughput) }}</span>
        </div>
        <div class="cell">
          <span class="cell-label">LATENCY</span>
          <span class="cell-value">{{ fmtNum(summary.latency) }}</span>
        </div>
        <div class="cell">
          <span class="cell-label">AL MEAN</span>
          <span class="cell-value">{{ fmtNum(summary.acceptLength || summary.sampleMeanAcceptLength) }}</span>
        </div>
        <div class="cell">
          <span class="cell-label">AL POOLED</span>
          <span class="cell-value">{{ fmtNum(summary.pooledAcceptLength) }}</span>
        </div>
        <div class="cell">
          <span class="cell-label">FILTERED ACC</span>
          <span class="cell-value">{{ fmtNum(summary.filteredAcceptLength) }}</span>
        </div>
        <div class="cell">
          <span class="cell-label">MTP HEAD RATES</span>
          <span class="cell-value small">{{ formatRateMap(summary.sampleMeanMtpHeadAcceptRates) }}</span>
        </div>
      </template>

      <!-- materialize 模式：脚本 -->
      <template v-if="mode === 'materialize' && task.manual_run">
        <div class="cell wide" :class="cellAccentClass">
          <span class="cell-label">MANUAL RUN</span>
          <span class="cell-value script manual-run-value" :title="task.manual_run.command">
            {{ task.manual_run.command || '—' }}
            <el-button v-if="task.manual_run.command" size="small" link :class="copyBtnClass" @click.stop="copyCommand">
              <el-icon><DocumentCopy /></el-icon> 复制命令
            </el-button>
          </span>
        </div>
      </template>

      <!-- RUN DIR -->
      <template v-if="mode === 'materialize' && task.remote_run_dir">
        <div class="cell wide" :class="cellAccentClass">
          <span class="cell-label">RUN DIR</span>
          <span class="cell-value script manual-run-value" :title="task.remote_run_dir">
            {{ task.remote_run_dir }}
            <el-button size="small" link :class="copyBtnClass" @click.stop="copyRunDir">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
          </span>
        </div>
      </template>

      <!-- TOP ERROR -->
      <div v-if="topError" class="cell wide">
        <span class="cell-label">TOP ERROR</span>
        <span class="cell-value small error">{{ topError }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'

const props = defineProps({
  task: { type: Object, required: true },
  mode: { type: String, default: 'execute' },
  isActive: { type: Boolean, default: false },
})

defineEmits(['click', 'cancel', 'load-config'])

const RUNNING_STATUSES = new Set(['queued', 'starting', 'running', 'preparing', 'materializing'])

const summary = computed(() => props.task.task_summary || {})

const statusKey = computed(() => {
  const stage = props.task.pipeline?.current_stage || props.task.status || 'unknown'
  return stage === 'done' ? 'completed' : stage
})

const isRunning = computed(() => RUNNING_STATUSES.has(statusKey.value))

const isTerminal = computed(() => statusKey.value === 'completed' || statusKey.value === 'failed')

const statusLabel = computed(() => {
  const map = {
    queued: 'Queued', starting: 'Starting', running: 'Running',
    completed: 'Completed', done: 'Completed', failed: 'Failed',
    cancelled: 'Cancelled', preparing: 'Preparing', materializing: 'Materializing',
    prepared: 'Prepared', scheduled: 'Scheduled', unknown: 'Unknown',
  }
  return map[statusKey.value] || statusKey.value
})

const statusTagType = computed(() => {
  const map = {
    running: '', starting: '', queued: 'info',
    completed: 'success', failed: 'danger', cancelled: 'info',
    preparing: 'warning', materializing: 'warning', prepared: 'info',
    scheduled: 'info',
  }
  return map[statusKey.value] || 'info'
})

const statusTagClass = computed(() => ({
  'tag-purple': statusKey.value === 'prepared',
  'tag-running': isRunning.value,
}))

const cellAccentClass = computed(() => {
  if (statusKey.value === 'completed') return 'cell-ready-green'
  if (statusKey.value === 'prepared') return 'cell-ready-purple'
  return ''
})

const copyBtnClass = computed(() => {
  if (statusKey.value === 'prepared') return 'btn-purple'
  if (statusKey.value === 'completed') return 'btn-green'
  return ''
})

const canCancel = computed(() => RUNNING_STATUSES.has(statusKey.value))

const resultLabel = computed(() => {
  if (props.task.execution_mode === 'materialize_only') {
    return statusKey.value === 'prepared' ? 'Manual Run' : '—'
  }
  if (statusKey.value === 'completed') return 'Done'
  if (statusKey.value === 'failed') return 'Error'
  return '—'
})

const isReady = computed(() => {
  return statusKey.value === 'prepared' || statusKey.value === 'completed'
})

const copyCommand = async () => {
  const cmd = props.task.manual_run?.command
  if (cmd) {
    try {
      await navigator.clipboard.writeText(cmd)
      ElMessage.success('已复制命令')
    } catch {
      ElMessage.warning('复制失败')
    }
  }
}

const copyRunDir = async () => {
  const dir = props.task.remote_run_dir
  if (dir) {
    try {
      await navigator.clipboard.writeText(dir)
      ElMessage.success('已复制路径')
    } catch {
      ElMessage.warning('复制失败')
    }
  }
}

const serviceName = computed(() => {
  return props.task.service_profile_name || props.task.service?.command_file || '—'
})

const topError = computed(() => {
  const ec = summary.value.errorCounter
  if (!ec || typeof ec !== 'object') return ''
  const entries = Object.entries(ec)
  if (!entries.length) return ''
  entries.sort((a, b) => b[1] - a[1])
  return `${entries[0][0]} (${entries[0][1]})`
})

const fmtNum = (v) => v != null ? Number(v).toFixed(3) : '—'

const formatRateMap = (rates) => {
  if (!rates || typeof rates !== 'object') return '—'
  return ['head_1', 'head_2', 'head_3', 'head_4']
    .filter(k => rates[k] != null)
    .map(k => `${k.replace('head_', 'h')}:${Number(rates[k]).toFixed(3)}`)
    .join(' ') || '—'
}
</script>

<style scoped>
.mtp-task-card {
  --sc: 144, 147, 153;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 14px 18px;
  transition: all 0.25s;
  background: #fff;
  position: relative;
}
.mtp-task-card:hover {
  border-color: rgb(var(--sc));
  animation: status-glow 2s ease-in-out infinite;
}

/* 运行中呼吸动画 */
.mtp-task-card.is-running {
  animation: status-glow 2.5s ease-in-out infinite;
}

@keyframes status-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--sc), 0); }
  50% { box-shadow: 0 0 0 5px rgba(var(--sc), 0.3); }
}

/* 状态颜色 */
.status-running, .status-starting { --sc: 64, 158, 255; border-left: 3px solid rgb(var(--sc)); }
.status-queued { --sc: 121, 187, 255; border-left: 3px solid rgb(var(--sc)); }
.status-completed { --sc: 103, 194, 58; border-left: 3px solid rgb(var(--sc)); }
.status-failed { --sc: 245, 108, 108; border-left: 3px solid rgb(var(--sc)); }
.status-prepared { --sc: 168, 85, 247; border-left: 3px solid rgb(var(--sc)); }
.status-preparing, .status-materializing { --sc: 230, 162, 60; border-left: 3px solid rgb(var(--sc)); }
.status-cancelled { --sc: 144, 147, 153; border-left: 3px solid rgb(var(--sc)); }
.status-scheduled { --sc: 121, 187, 255; border-left: 3px solid rgb(var(--sc)); }

/* 顶栏 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.card-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}
.card-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.task-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* 运行中 tag + 闪烁圆点 */
.tag-running {
  --el-tag-bg-color: #ecf5ff;
  --el-tag-border-color: #b3d8ff;
  --el-tag-text-color: #409eff;
}
.running-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--sc));
  margin-right: 4px;
  vertical-align: middle;
  animation: dot-blink 1.2s ease-in-out infinite;
}
@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

/* 指标网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1px;
  background: #ebeef5;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}
.cell {
  background: #fafafa;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.cell.wide {
  grid-column: span 6;
}
.cell-label {
  font-size: 10px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 500;
}
.cell-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-value.small {
  font-size: 11px;
}
.cell-value.script {
  font-family: monospace;
  font-size: 11px;
  color: #606266;
  cursor: copy;
}
.cell-value.script:hover {
  color: #409eff;
}
.cell-value.error {
  color: #f56c6c;
}
.cell-ready-green {
  background: #f0f9eb;
}
.cell-ready-purple {
  background: #f3e8ff;
}
.manual-run-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 紫色主题 */
.tag-purple {
  --el-tag-bg-color: #f3e8ff;
  --el-tag-border-color: #d8b4fe;
  --el-tag-text-color: #7c3aed;
}
.btn-purple {
  color: #a855f7;
}
.btn-purple:hover {
  color: #7c3aed;
}
.btn-green {
  color: #67c23a;
}
.btn-green:hover {
  color: #529b2e;
}
</style>
