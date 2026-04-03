<template>
  <div class="app-container">
    <!-- 数据采集表单 -->
    <el-card shadow="never" class="query-card">
      <template #header>
        <span>KV Cache 分析</span>
      </template>
      <el-form :inline="true" :model="queryForm" label-width="auto">
        <el-form-item label="场景">
          <el-radio-group v-model="queryForm.scenario">
            <el-radio value="/v2/coding/chat/completions">coding plan</el-radio>
            <el-radio value="">all</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.timeRange"
            type="datetimerange"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :shortcuts="timeShortcuts"
          />
        </el-form-item>
        <el-form-item label="App ID">
          <el-input v-model="queryForm.appId" placeholder="app-3Lut8O2E" style="width: 200px" />
        </el-form-item>
        <el-form-item label="模型过滤">
          <el-select
            v-model="queryForm.selectedModels"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="全部模型"
            style="width: 280px"
          >
            <el-option
              v-for="m in modelOptions"
              :key="m"
              :label="m"
              :value="m"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名">
          <el-input v-model="queryForm.taskName" placeholder="请输入任务名" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="!qpdInfo.is_official && qpdInfo.remaining <= 0"
            @click="handleSubmit"
          >
            提交分析任务
          </el-button>
        </el-form-item>
      </el-form>
      <div class="query-summary">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ querySummary }}</span>
      </div>
      <el-alert
        v-if="!qpdInfo.is_official"
        :title="`今日配额 ${qpdInfo.used}/${qpdInfo.limit}（剩余 ${qpdInfo.remaining} 次）`"
        :type="qpdInfo.remaining > 0 ? 'info' : 'warning'"
        show-icon
        :closable="false"
        class="qpd-alert"
      />
    </el-card>

    <!-- 任务列表 -->
    <div class="task-list-section">
      <div class="task-list-header">
        <span class="task-list-title">任务列表</span>
        <div class="filter-bar">
          <el-input
            v-model="filterForm.username"
            placeholder="按用户名过滤（空=全部）"
            clearable
            style="width: 200px"
            @clear="loadAllTasks"
            @keyup.enter="loadAllTasks"
          />
          <el-input
            v-model="filterForm.taskName"
            placeholder="按任务名过滤"
            clearable
            style="width: 200px"
            @clear="loadAllTasks"
            @keyup.enter="loadAllTasks"
          />
          <el-button type="primary" @click="loadAllTasks">搜索</el-button>
          <el-button text @click="refreshAllTasks">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <div v-loading="tableLoading" class="task-grid">
        <div
          v-for="task in taskList"
          :key="task.task_id"
          class="task-card-item"
          :class="{ 'is-running': isTaskRunning(task), 'is-failed': task.pipeline?.current_stage === 'failed' }"
          :style="getCardBorderStyle(task)"
          @click="handleViewDetail(task)"
        >
          <!-- 水面波纹层 -->
          <div class="ripple-layer"></div>
          <!-- bling 光效层 -->
          <div class="bling-layer"></div>

          <!-- 阶段徽章 (45° 倾斜，右上角) -->
          <div class="stage-ribbon" :class="'ribbon-' + (task.pipeline?.current_stage || 'pending')">
            {{ stageLabel(task.pipeline?.current_stage) }}
          </div>

          <!-- Header -->
          <div class="tc-header">
            <div class="tc-header-info">
              <div class="tc-task-name" :title="task.task_name || task.task_id">
                {{ task.task_name || task.task_id }}
              </div>
              <div class="tc-initiator">
                <el-icon size="12"><User /></el-icon>
                {{ task.created_by?.username || task.created_by?.name || '-' }}
              </div>
            </div>
            <div class="tc-header-actions" @click.stop>
              <el-popconfirm
                :title="isTaskRunning(task) ? '该任务正在执行中，删除将中断任务，确定删除？' : '确定删除该任务？'"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDelete(task)"
                width="280"
              >
                <template #reference>
                  <el-button
                    text
                    :type="isTaskRunning(task) ? 'danger' : 'info'"
                    size="small"
                    circle
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>

          <!-- Body -->
          <div class="tc-body">
            <!-- 已完成 → 展示命中率（核心指标） -->
            <template v-if="task.pipeline?.current_stage === 'done' && task.result && hasModelResults(task.result)">
              <div class="tc-hitrate-chart">
                <div
                  v-for="(info, model) in getModelResults(task.result)"
                  :key="model"
                  class="tc-bar-col"
                >
                  <span class="tc-bar-pct">{{ (info.hit_rate * 100).toFixed(1) }}%</span>
                  <div class="tc-bar-track">
                    <div
                      class="tc-bar-fill"
                      :style="{ height: (info.hit_rate * 100) + '%', background: hitRateColor(info.hit_rate) }"
                    ></div>
                  </div>
                  <span class="tc-bar-label" :title="model">{{ model }}</span>
                </div>
              </div>
            </template>
            <!-- 未完成 → 阶段进度 -->
            <template v-else>
              <div class="tc-stage-bar">
                <div
                  v-for="(stage, idx) in stageOrder"
                  :key="stage"
                  class="tc-stage-dot-group"
                >
                  <div
                    class="tc-stage-dot"
                    :class="'dot-' + getStageStatus(task, stage)"
                  ></div>
                  <span class="tc-stage-name">{{ stageNames[stage] }}</span>
                  <div v-if="idx < stageOrder.length - 1" class="tc-stage-line" :class="{ 'line-done': getStageStatus(task, stage) === 'completed' }"></div>
                </div>
              </div>
              <div v-if="getRunningStageMessage(task)" class="tc-running-msg">
                {{ getRunningStageMessage(task) }}
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="tc-footer">
            <span class="tc-footer-item" :title="task.query?.app_id || '全局'">
              <el-icon size="12"><Monitor /></el-icon>
              {{ task.query?.app_id || '全局' }}
            </span>
            <span class="tc-footer-item" :title="task.query ? `${task.query.start_datetime} ~ ${task.query.end_datetime}` : '-'">
              <el-icon size="12"><Clock /></el-icon>
              {{ formatTimeRangeShort(task) }}
            </span>
            <span class="tc-footer-item">
              <el-icon size="12"><Collection /></el-icon>
              {{ task.scenario?.label || '-' }}
            </span>
            <span v-if="task.query?.models?.length" class="tc-footer-item" :title="task.query.models.join(', ')">
              <el-icon size="12"><Filter /></el-icon>
              {{ task.query.models.length }}模型
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="!tableLoading && taskList.length === 0" description="暂无任务" />
      </div>
    </div>

    <!-- 详情全屏弹窗 -->
    <el-dialog v-model="detailVisible" title="任务详情" fullscreen append-to-body>
      <template v-if="detailTask">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="任务 ID">{{ detailTask.task_id }}</el-descriptions-item>
          <el-descriptions-item label="任务名">{{ detailTask.task_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="查询时段">
            {{ detailTask.query?.start_datetime }} ~ {{ detailTask.query?.end_datetime }}
          </el-descriptions-item>
          <el-descriptions-item label="App ID">
            <span v-if="detailTask.query?.app_id">{{ detailTask.query.app_id }}</span>
            <span v-else class="text-muted">空</span>
          </el-descriptions-item>
          <el-descriptions-item label="模型过滤">
            <template v-if="detailTask.query?.models?.length">
              <el-tag v-for="m in detailTask.query.models" :key="m" size="small" effect="plain" round style="margin-right: 4px">{{ m }}</el-tag>
            </template>
            <span v-else class="text-muted">全部模型</span>
          </el-descriptions-item>
          <el-descriptions-item label="场景">{{ detailTask.scenario?.label || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailTask.created_by?.name || detailTask.created_by?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Block Size">{{ detailTask.config?.block_size }}</el-descriptions-item>
          <el-descriptions-item label="Cache Size">{{ detailTask.config?.cache_size?.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="创建时间 (北京)">{{ detailTask.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间 (北京)">{{ detailTask.updated_at }}</el-descriptions-item>
        </el-descriptions>

        <!-- 各阶段详情 -->
        <el-divider>Pipeline 阶段</el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="stage in stageOrder"
            :key="stage"
            :type="stageStatusType(getStageStatus(detailTask, stage))"
            :hollow="!getStageData(detailTask, stage)"
          >
            <div class="timeline-stage-title">
              {{ stageNames[stage] }}
              <el-text
                v-if="getStageData(detailTask, stage)?.status === 'completed'"
                type="info"
                size="small"
              >
                ({{ formatStageDuration(getStageData(detailTask, stage)) }})
              </el-text>
              <el-text
                v-else-if="getStageData(detailTask, stage)?.status === 'running'"
                type="warning"
                size="small"
              >
                ({{ formatElapsed(getStageData(detailTask, stage)?.started_at) }})
              </el-text>
            </div>
            <template v-if="getStageData(detailTask, stage)">
              <el-text size="small" type="info">{{ getStageData(detailTask, stage)?.message }}</el-text>
              <div v-if="stage === 'fetch' && getStageData(detailTask, stage)?.total_count" class="timeline-detail">
                总记录数: {{ getStageData(detailTask, stage).total_count.toLocaleString() }}
              </div>
              <!-- fetch 阶段失败切片 -->
              <div
                v-if="stage === 'fetch' && getStageData(detailTask, stage)?.incomplete_count"
                class="timeline-detail"
                style="margin-top: 4px"
              >
                <el-text type="danger" size="small">
                  {{ getStageData(detailTask, stage).incomplete_count }} 个切片拉取失败：
                </el-text>
                <div
                  v-for="(inc, iidx) in getStageData(detailTask, stage).incomplete_files"
                  :key="iidx"
                  class="timeline-file-item"
                >
                  <el-tag type="danger" size="small" effect="plain" round>失败</el-tag>
                  <el-text size="small">{{ inc.hour }}</el-text>
                  <el-text size="small" type="info" style="margin-left: 4px">({{ inc.file }})</el-text>
                  <el-text v-if="inc.error" size="small" type="danger" class="file-error">
                    {{ inc.error.substring(0, 100) }}
                  </el-text>
                </div>
              </div>
              <div v-if="stage === 'tokenize' && getStageData(detailTask, stage)?.total_lines" class="timeline-detail">
                总行数: {{ getStageData(detailTask, stage).total_lines.toLocaleString() }}
                <template v-if="getStageData(detailTask, stage)?.success_count != null">
                  ({{ getStageData(detailTask, stage).success_count }} 成功
                  <template v-if="getStageData(detailTask, stage)?.failed_count">
                    / {{ getStageData(detailTask, stage).failed_count }} 失败
                  </template>)
                </template>
              </div>
              <!-- tokenize 完成后展示实际模型分布 -->
              <div
                v-if="stage === 'tokenize' && getStageData(detailTask, stage)?.models?.length"
                class="timeline-detail"
              >
                实际模型:
                <el-tag
                  v-for="m in getStageData(detailTask, stage).models"
                  :key="m"
                  size="small"
                  effect="plain"
                  round
                  style="margin-left: 4px"
                >
                  {{ m }}
                </el-tag>
              </div>
              <!-- tokenize 各文件状态（可折叠，默认收起） -->
              <div
                v-if="stage === 'tokenize' && getStageData(detailTask, stage)?.files?.length"
                class="timeline-files"
              >
                <div class="files-toggle" @click="tokenizeFilesExpanded = !tokenizeFilesExpanded">
                  <el-icon class="files-toggle-arrow" :class="{ 'is-expanded': tokenizeFilesExpanded }"><ArrowRight /></el-icon>
                  <el-text size="small" type="info">
                    {{ getStageData(detailTask, stage).files.length }} 个切片文件
                  </el-text>
                </div>
                <template v-if="tokenizeFilesExpanded">
                  <div
                    v-for="(file, fidx) in getStageData(detailTask, stage).files"
                    :key="fidx"
                    class="timeline-file-item"
                  >
                    <el-tag
                      :type="fileStatusType(file.status)"
                      size="small"
                      effect="plain"
                      round
                    >
                      {{ fileStatusIcon(file.status) }}
                    </el-tag>
                    <el-text size="small">{{ file.file }}</el-text>
                    <el-text v-if="file.lines" size="small" type="info"> ({{ file.lines }} 条)</el-text>
                    <el-text v-if="file.status === 'failed' && file.error" size="small" type="danger" class="file-error">
                      {{ file.error.substring(0, 80) }}
                    </el-text>
                  </div>
                </template>
              </div>
              <!-- fetch 阶段的 ETA -->
              <div
                v-if="getStageData(detailTask, stage)?.status === 'running' && getStageRunningInfo(detailTask, stage)"
                class="timeline-detail"
              >
                {{ getStageRunningInfo(detailTask, stage).elapsed }}
                <template v-if="getStageRunningInfo(detailTask, stage).eta">
                  / {{ getStageRunningInfo(detailTask, stage).eta }}
                </template>
              </div>
            </template>
            <template v-else>
              <el-text size="small" type="info">等待中</el-text>
            </template>
          </el-timeline-item>
        </el-timeline>

        <!-- 结果 -->
        <template v-if="detailTask.result && hasModelResults(detailTask.result)">
          <el-divider>模拟结果 (按模型)</el-divider>
          <el-table :data="getModelResultList(detailTask.result)" border size="small">
            <el-table-column label="模型" min-width="120">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.model }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="命中率" width="100" align="center">
              <template #default="{ row }">
                <template v-if="row.hit_rate != null">
                  <el-text type="success" tag="b">{{ (row.hit_rate * 100).toFixed(2) }}%</el-text>
                </template>
                <el-text v-else-if="row.status === 'failed'" type="danger" size="small">失败</el-text>
              </template>
            </el-table-column>
            <el-table-column label="命中次数" width="100" align="right">
              <template #default="{ row }">{{ row.hit_count?.toLocaleString() || '-' }}</template>
            </el-table-column>
            <el-table-column label="总查询数" width="100" align="right">
              <template #default="{ row }">{{ row.total_queries?.toLocaleString() || '-' }}</template>
            </el-table-column>
            <el-table-column label="总 Token" width="120" align="right">
              <template #default="{ row }">{{ row.total_tokens?.toLocaleString() || '-' }}</template>
            </el-table-column>
            <el-table-column label="切片数" width="80" align="center">
              <template #default="{ row }">{{ row.input_files_count || '-' }}</template>
            </el-table-column>
          </el-table>
        </template>

        <!-- 数据目录树（手动触发加载） -->
        <template v-if="detailTask?.task_id">
          <el-divider>数据目录</el-divider>
          <template v-if="!fileTreeVisible">
            <div style="text-align: center; padding: 12px 0;">
              <el-button type="primary" plain size="small" @click="fileTreeVisible = true">
                加载数据目录
              </el-button>
            </div>
          </template>
          <template v-else>
            <div
              class="file-tree-wrapper"
              v-loading="fileTreeLoading"
              element-loading-text="正在扫描数据目录，数据量较大请稍候..."
            >
              <div class="file-tree-root-path">{{ fileTreeRootPath || '加载中...' }}</div>
              <el-tree
                :key="detailTask?.task_id"
                :props="fileTreeProps"
                :load="loadFileTree"
                lazy
                :expand-on-click-node="true"
                highlight-current
                class="file-tree"
              >
                <template #default="{ node, data }">
                  <span class="tree-node">
                    <span class="tree-icon">{{ data.is_dir ? '📂' : '📄' }}</span>
                    <span :class="data.is_dir ? 'tree-dir' : 'tree-file'">{{ data.name }}</span>
                    <span v-if="data.size_label" class="tree-meta">{{ data.size_label }}</span>
                    <el-icon v-if="node.loading" class="tree-spinner"><Loading /></el-icon>
                  </span>
                </template>
              </el-tree>
            </div>
          </template>
        </template>
      </template>
    </el-dialog>

    <!-- 提交确认弹窗 -->
    <el-dialog v-model="submitConfirmVisible" title="确认提交任务" width="480" align-center>
      <div class="submit-confirm-summary">{{ querySummary }}</div>
      <el-divider />
      <el-form label-width="80px">
        <el-form-item label="执行方式">
          <el-radio-group v-model="submitMode">
            <el-radio value="immediate">立即执行</el-radio>
            <el-radio value="scheduled">定时执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="submitMode === 'scheduled'" label="启动时间">
          <el-date-picker
            v-model="scheduledAt"
            type="datetime"
            placeholder="选择定时启动时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="(date) => date < new Date(new Date().setHours(0,0,0,0))"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitConfirmVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="submitMode === 'scheduled' && !scheduledAt"
          @click="doSubmit"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, inject, computed, onMounted, onUnmounted } from 'vue'
import { kvTaskList, kvFetch, kvStatus, kvQpd, kvDeleteTask, kvModels, kvFileTree } from '@/api/olap/index'
import { InfoFilled, Loading, ArrowRight, Delete, User, Monitor, Clock, Collection, Filter } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const ctx = inject('context')
const currentUsername = ctx.userInfo?.username || ''

// ============================================================
// 常量
// ============================================================
const POLL_INTERVAL = 120000  // 2 分钟

const stageOrder = ['fetch', 'tokenize', 'simulate']
const stageNames = {
  fetch: '数据提取',
  tokenize: '序列化',
  simulate: '缓存模拟',
}

// ============================================================
// 时间快捷选项
// ============================================================
const timeShortcuts = [
  {
    text: '昨日全天',
    value: () => {
      const yesterday = dayjs().subtract(1, 'day')
      return [yesterday.startOf('day').toDate(), yesterday.endOf('day').toDate()]
    }
  },
  {
    text: '最近 1 小时',
    value: () => [dayjs().subtract(1, 'hour').toDate(), dayjs().toDate()]
  },
  {
    text: '最近 6 小时',
    value: () => [dayjs().subtract(6, 'hour').toDate(), dayjs().toDate()]
  },
  {
    text: '最近 24 小时',
    value: () => [dayjs().subtract(24, 'hour').toDate(), dayjs().toDate()]
  },
]

// ============================================================
// 响应式状态
// ============================================================
const queryForm = reactive({
  timeRange: [
    dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
  ],
  appId: '',
  taskName: `${currentUsername}-${dayjs().format('YYYYMMDDHHmmss')}`,
  scenario: '/v2/coding/chat/completions',
  selectedModels: [],  // 多选模型过滤，空=全部
})

// 可用模型列表（从后端热加载）
const modelOptions = ref([])

// 过滤条件：默认按当前用户过滤
const filterForm = reactive({
  username: currentUsername,
  taskName: '',
})

const submitLoading = ref(false)
const tableLoading = ref(false)
const taskList = ref([])
const pollTimers = {}

// QPD 配额
const qpdInfo = reactive({ used: 0, limit: 1, is_official: false, remaining: 1 })

const detailVisible = ref(false)
const detailTask = ref(null)
const tokenizeFilesExpanded = ref(false)

// ============================================================
// 动态查询描述
// ============================================================
const scenarioLabel = computed(() => queryForm.scenario ? 'coding plan' : '全部')
const querySummary = computed(() => {
  const parts = []
  parts.push(`分析 ${scenarioLabel.value} 场景`)
  if (queryForm.timeRange?.length === 2) {
    parts.push(`${queryForm.timeRange[0]} ~ ${queryForm.timeRange[1]} 时段`)
  }
  if (queryForm.appId) {
    parts.push(`App ${queryForm.appId}`)
  } else if (!queryForm.scenario) {
    parts.push('App (全局)')
  }
  if (queryForm.selectedModels.length > 0) {
    parts.push(`模型: ${queryForm.selectedModels.join(', ')}`)
  } else {
    parts.push('全部模型')
  }
  parts.push('的 KV Cache 命中率')
  return parts.join('，')
})

// ============================================================
// 阶段状态映射
// ============================================================
const stageTagType = (currentStage) => {
  const map = {
    scheduled: '',
    fetch: 'warning',
    tokenize: 'warning',
    simulate: 'warning',
    done: 'success',
    failed: 'danger',
    cancelled: 'info',
  }
  return map[currentStage] || 'info'
}

const stageLabel = (currentStage) => {
  const map = {
    scheduled: '等待定时启动',
    fetch: '数据提取中',
    tokenize: '序列化中',
    simulate: '模拟中',
    done: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }
  return map[currentStage] || currentStage || '等待中'
}

const stageStatusType = (status) => {
  const map = {
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

const getStageData = (row, stage) => {
  return row.pipeline?.stages?.[stage] || null
}

const getStageStatus = (row, stage) => {
  return getStageData(row, stage)?.status || 'pending'
}

const fileStatusType = (status) => {
  const map = { completed: 'success', running: 'warning', failed: 'danger', pending: 'info' }
  return map[status] || 'info'
}

const fileStatusIcon = (status) => {
  const map = { completed: '完成', running: '处理中', failed: '失败', pending: '等待' }
  return map[status] || '等待'
}

/**
 * result 是否包含 per-model 结果（新格式: { "glm-5": { hit_rate, ... }, ... }）
 */
const hasModelResults = (result) => {
  if (!result) return false
  return Object.keys(result).some(k => result[k]?.hit_rate != null || result[k]?.status === 'failed')
}

/**
 * 提取 per-model 结果（过滤掉非 model 的字段）
 */
const getModelResults = (result) => {
  if (!result) return {}
  const out = {}
  for (const [k, v] of Object.entries(result)) {
    if (v && typeof v === 'object' && (v.hit_rate != null || v.status === 'failed')) {
      out[k] = v
    }
  }
  return out
}

// ============================================================
// 数据目录树（el-tree lazy loading）
// ============================================================
const fileTreeRootPath = ref('')
const fileTreeLoading = ref(false)
const fileTreeVisible = ref(false)

const fileTreeProps = {
  label: 'name',
  isLeaf: 'is_leaf',
}

const loadFileTree = async (node, resolve) => {
  const taskId = detailTask.value?.task_id
  if (!taskId) return resolve([])

  // 根节点：path 为空
  const relPath = node.level === 0 ? '' : node.data?.rel_path || ''

  // 根节点加载时显示全局 loading
  if (node.level === 0) fileTreeLoading.value = true

  try {
    const res = await kvFileTree({ task_id: taskId, path: relPath })
    const { root, children } = res.data || {}

    // 首次加载时设置根路径显示
    if (node.level === 0 && root?.root_path) {
      fileTreeRootPath.value = root.root_path
    }

    resolve(children || [])
  } catch {
    resolve([])
  } finally {
    if (node.level === 0) fileTreeLoading.value = false
  }
}

/**
 * 转为列表形式，供表格渲染
 */
const getModelResultList = (result) => {
  const models = getModelResults(result)
  return Object.entries(models).map(([model, info]) => ({ model, ...info }))
}

const isTaskRunning = (task) => {
  const stage = task.pipeline?.current_stage
  return stage && !['done', 'failed', 'cancelled'].includes(stage)
}

// ============================================================
// 卡片辅助函数
// ============================================================

/**
 * 命中率热力图颜色 —— 连续渐变
 * 0% → 红(#cf222e)  50% → 黄(#d4a017)  100% → 绿(#2da44e)
 */
const hitRateColor = (rate) => {
  if (rate == null) return '#909399'
  const t = Math.max(0, Math.min(1, rate))
  // 三段线性插值: 红 → 橙 → 黄 → 绿
  const stops = [
    { p: 0,   r: 207, g: 34,  b: 46  }, // #cf222e
    { p: 0.3, r: 225, g: 111, b: 36  }, // #e16f24
    { p: 0.5, r: 212, g: 160, b: 23  }, // #d4a017
    { p: 0.7, r: 87,  g: 171, b: 90  }, // #57ab5a
    { p: 1,   r: 45,  g: 164, b: 78  }, // #2da44e
  ]
  let i = 0
  while (i < stops.length - 2 && t > stops[i + 1].p) i++
  const a = stops[i], b = stops[i + 1]
  const f = (t - a.p) / (b.p - a.p)
  const r = Math.round(a.r + (b.r - a.r) * f)
  const g = Math.round(a.g + (b.g - a.g) * f)
  const bl = Math.round(a.b + (b.b - a.b) * f)
  return `rgb(${r},${g},${bl})`
}

/**
 * 卡片左边框颜色 —— 以最高命中率做热力感
 */
const getCardBorderStyle = (task) => {
  if (task.pipeline?.current_stage === 'done' && task.result && hasModelResults(task.result)) {
    const models = getModelResults(task.result)
    const rates = Object.values(models).map(m => m.hit_rate).filter(r => r != null)
    if (rates.length > 0) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length
      return { borderLeftColor: hitRateColor(avg) }
    }
  }
  if (task.pipeline?.current_stage === 'failed') return { borderLeftColor: '#cf222e' }
  if (isTaskRunning(task)) return { borderLeftColor: '#d29922' }
  return {}
}

/**
 * 短时间范围显示
 */
const formatTimeRangeShort = (task) => {
  if (!task.query) return '-'
  const s = task.query.start_datetime?.substring(5, 16) || ''
  const e = task.query.end_datetime?.substring(5, 16) || ''
  return `${s} ~ ${e}`
}

// ============================================================
// 时间计算工具
// ============================================================

/**
 * 解析后端时间字符串 "YYYY-MM-DD HH:mm:ss" 为 Date 对象
 * 后端时间均为北京时间 (UTC+8)，拼上时区偏移确保浏览器正确解析
 */
const parseTime = (timeStr) => {
  if (!timeStr) return null
  return dayjs.utc(timeStr, 'YYYY-MM-DD HH:mm:ss').subtract(8, 'hour').toDate()
}

/**
 * 格式化秒数为可读时间
 */
const formatSeconds = (totalSec) => {
  if (totalSec < 0) return ''
  const sec = Math.round(totalSec)
  if (sec < 60) return `${sec}秒`
  const min = Math.floor(sec / 60)
  const remSec = sec % 60
  if (min < 60) return remSec > 0 ? `${min}分${remSec}秒` : `${min}分`
  const hr = Math.floor(min / 60)
  const remMin = min % 60
  return remMin > 0 ? `${hr}时${remMin}分` : `${hr}时`
}

/**
 * 根据 started_at 计算已耗时
 */
const formatElapsed = (startedAt) => {
  if (!startedAt) return ''
  const start = parseTime(startedAt)
  if (!start) return ''
  const elapsed = (Date.now() - start.getTime()) / 1000
  return `已耗时 ${formatSeconds(elapsed)}`
}

/**
 * 计算 completed 阶段的实际耗时
 */
const formatStageDuration = (stageData) => {
  if (!stageData?.started_at || !stageData?.completed_at) return ''
  const start = parseTime(stageData.started_at)
  const end = parseTime(stageData.completed_at)
  if (!start || !end) return ''
  const dur = (end.getTime() - start.getTime()) / 1000
  return `耗时 ${formatSeconds(dur)}`
}

/**
 * 计算正在运行阶段的 ETA 信息
 * tokenize: 优先用后端下发的 tokenize_speed(记录/秒) + remaining_records 计算
 * fetch: 基于 progress (如 "3/10") 和 started_at 线性外推
 * simulate: 只显示已耗时
 */
const getStageRunningInfo = (row, stage) => {
  const data = getStageData(row, stage)
  if (!data || data.status !== 'running' || !data.started_at) return null

  const start = parseTime(data.started_at)
  if (!start) return null
  const elapsed = (Date.now() - start.getTime()) / 1000
  const elapsedText = formatSeconds(elapsed)

  // tokenize 阶段: 优先用基于记录数的速度估算（更准确）
  if (stage === 'tokenize' && data.tokenize_speed > 0 && data.remaining_records > 0) {
    const remaining = data.remaining_records / data.tokenize_speed
    return {
      elapsed: `已耗时 ${elapsedText}`,
      eta: `预计剩余 ${formatSeconds(remaining)}`
    }
  }

  // fetch 阶段 / tokenize 兜底: 基于切片数线性外推
  if (data.progress) {
    const parts = data.progress.split('/')
    if (parts.length === 2) {
      const current = parseInt(parts[0])
      const total = parseInt(parts[1])
      if (current > 0 && total > 0) {
        const rate = elapsed / current
        const remaining = rate * (total - current)
        return {
          elapsed: `已耗时 ${elapsedText}`,
          eta: `预计剩余 ${formatSeconds(remaining)}`
        }
      }
    }
  }

  // simulate 没有进度信息，只显示已耗时
  return { elapsed: `已耗时 ${elapsedText}`, eta: '' }
}

/**
 * 获取正在运行阶段的信息（卡片用）
 */
const getRunningStageMessage = (task) => {
  for (const stage of stageOrder) {
    const data = getStageData(task, stage)
    if (data?.status === 'running') {
      const info = getStageRunningInfo(task, stage)
      const parts = [data.message]
      if (info?.elapsed) parts.push(info.elapsed)
      if (info?.eta) parts.push(info.eta)
      return parts.filter(Boolean).join(' · ')
    }
  }
  return ''
}

// ============================================================
// 轮询逻辑
// ============================================================
const startPolling = (taskId) => {
  if (pollTimers[taskId]) return

  pollTimers[taskId] = setInterval(async () => {
    try {
      const res = await kvStatus(taskId)
      const data = res.data
      updateTaskInList(taskId, data)

      // 如果详情弹窗打开且是当前任务，同步更新
      if (detailVisible.value && detailTask.value?.task_id === taskId) {
        detailTask.value = data
      }

      if (!isTaskRunning(data)) {
        stopPolling(taskId)
      }
    } catch {
      // 静默失败，继续轮询
    }
  }, POLL_INTERVAL)
}

const stopPolling = (taskId) => {
  if (pollTimers[taskId]) {
    clearInterval(pollTimers[taskId])
    delete pollTimers[taskId]
  }
}

const stopAllPolling = () => {
  Object.keys(pollTimers).forEach(stopPolling)
}

const updateTaskInList = (taskId, data) => {
  const idx = taskList.value.findIndex((t) => t.task_id === taskId)
  if (idx >= 0) {
    taskList.value[idx] = data
  }
}

// ============================================================
// 提交任务（含二次确认）
// ============================================================
const submitConfirmVisible = ref(false)
const submitMode = ref('immediate') // 'immediate' | 'scheduled'
const scheduledAt = ref('')

const handleSubmit = () => {
  if (!queryForm.timeRange || queryForm.timeRange.length < 2) {
    ElMessage.warning('请选择时间范围')
    return
  }
  if (!queryForm.taskName?.trim()) {
    ElMessage.warning('请输入任务名')
    return
  }
  // 查询结束时间不能超过当前时间
  if (dayjs(queryForm.timeRange[1]).isAfter(dayjs())) {
    ElMessage.warning('查询结束时间不能超过当前时间，无法查询未来数据')
    return
  }
  // 打开确认弹窗
  submitMode.value = 'immediate'
  submitConfirmVisible.value = true
}

const doSubmit = async () => {
  // 定时执行时，启动时间必须晚于查询结束时间
  if (submitMode.value === 'scheduled' && scheduledAt.value) {
    if (dayjs(scheduledAt.value).isBefore(dayjs(queryForm.timeRange[1]))) {
      ElMessage.warning('定时启动时间必须晚于查询结束时间')
      return
    }
  }
  submitConfirmVisible.value = false
  submitLoading.value = true
  try {
    const params = {
      start_datetime: queryForm.timeRange[0],
      end_datetime: queryForm.timeRange[1],
      app_id: queryForm.appId,
      task_name: queryForm.taskName.trim(),
      path: queryForm.scenario,
    }
    if (queryForm.selectedModels.length > 0) {
      params.models = queryForm.selectedModels.join(',')
    }
    if (submitMode.value === 'scheduled' && scheduledAt.value) {
      params.scheduled_at = scheduledAt.value
    }
    const res = await kvFetch(params)

    const taskId = res.data.task_id
    ElMessage.success(`任务已提交: ${taskId}`)

    // 重置任务名为新的默认值
    queryForm.taskName = `${currentUsername}-${dayjs().format('YYYYMMDDHHmmss')}`

    // 刷新列表、配额并启动轮询
    await loadAllTasks()
    await loadQpd()
    startPolling(taskId)
  } catch (err) {
    ElNotification({
      title: '提交失败',
      message: err.message || '请检查后端服务',
      type: 'error',
      duration: 0,
    })
  } finally {
    submitLoading.value = false
  }
}

// ============================================================
// 删除任务
// ============================================================
const handleDelete = async (row) => {
  try {
    await kvDeleteTask(row.task_id)
    stopPolling(row.task_id)
    ElMessage.success('任务已删除')
    await loadAllTasks()
    await loadQpd()
  } catch (err) {
    ElNotification({
      title: '删除失败',
      message: err.message || '请检查后端服务',
      type: 'error',
    })
  }
}

// ============================================================
// 加载任务列表（从后端 /kv/tasks）
// ============================================================
const loadAllTasks = async () => {
  tableLoading.value = true
  try {
    const res = await kvTaskList({
      username: filterForm.username || undefined,
      task_name: filterForm.taskName || undefined,
    })
    taskList.value = res.data || []

    // 对 running 任务启动轮询
    taskList.value.forEach((t) => {
      if (isTaskRunning(t)) {
        startPolling(t.task_id)
      }
    })
  } catch (err) {
    ElNotification({
      title: '加载任务列表失败',
      message: err.message || '请检查后端服务',
      type: 'error',
    })
  } finally {
    tableLoading.value = false
  }
}

const refreshAllTasks = () => {
  stopAllPolling()
  loadAllTasks()
}

// ============================================================
// 详情
// ============================================================
const handleViewDetail = (row) => {
  detailTask.value = row
  tokenizeFilesExpanded.value = false
  fileTreeRootPath.value = ''
  fileTreeVisible.value = false
  detailVisible.value = true
}

// ============================================================
// 加载可用模型列表（热加载，每次打开页面刷新）
// ============================================================
const loadModels = async () => {
  try {
    const res = await kvModels()
    modelOptions.value = res.data || []
  } catch { /* 静默 */ }
}

// ============================================================
// QPD 配额查询
// ============================================================
const loadQpd = async () => {
  try {
    const res = await kvQpd()
    Object.assign(qpdInfo, res.data)
  } catch { /* 静默 */ }
}

// ============================================================
// 复制 Task ID
// ============================================================
const handleCopyTaskId = async (taskId) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(taskId)
    } else {
      const input = document.createElement('input')
      input.value = taskId
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadModels()
  loadQpd()
  loadAllTasks()
})

onUnmounted(() => {
  stopAllPolling()
})
</script>

<style scoped>
.query-card {
  margin-bottom: 16px;
}

.query-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 4px;
  font-size: 13px;
  color: #67c23a;
  line-height: 1.6;
}

.qpd-alert {
  margin-top: 8px;
}

.submit-confirm-summary {
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 4px;
  font-size: 13px;
  color: #67c23a;
  line-height: 1.6;
}

.text-muted {
  color: #999;
}

/* ========== 任务列表区域 ========== */
.task-list-section {
  margin-bottom: 16px;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-list-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 卡片网格 ========== */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  min-height: 120px;
}

/* ========== 单张任务卡片 ========== */
.task-card-item {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  border-left: 4px solid var(--el-color-primary);
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.2s;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 12px;
  height: 220px;
}

.task-card-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.task-card-item.is-running {
  border-left-color: #e6a23c;
}

.task-card-item.is-failed {
  border-left-color: #f56c6c;
}

/* --- 波纹动画层 --- */
.ripple-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.task-card-item:hover .ripple-layer {
  opacity: 1;
  background: radial-gradient(circle at 50% 120%, rgba(64, 158, 255, 0.06) 0%, transparent 70%);
  animation: ripple-wave 2s ease-in-out infinite;
}

@keyframes ripple-wave {
  0%   { background-size: 100% 100%; }
  50%  { background-size: 120% 120%; }
  100% { background-size: 100% 100%; }
}

/* --- bling 光效层 --- */
.bling-layer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 60%
  );
  transition: opacity 0.3s;
}

.task-card-item:hover .bling-layer {
  opacity: 1;
  animation: bling-sweep 2.5s ease-in-out infinite;
}

@keyframes bling-sweep {
  0%   { transform: translateX(-80%) translateY(-80%) rotate(0deg); }
  100% { transform: translateX(80%) translateY(80%) rotate(0deg); }
}

/* --- 阶段徽章 ribbon --- */
.stage-ribbon {
  position: absolute;
  top: 12px;
  right: -32px;
  width: 120px;
  text-align: center;
  padding: 3px 0;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  transform: rotate(45deg);
  z-index: 2;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.ribbon-done       { background: linear-gradient(135deg, #2da44e, #3fb950); }
.ribbon-fetch      { background: linear-gradient(135deg, #d29922, #e3b341); }
.ribbon-tokenize   { background: linear-gradient(135deg, #d29922, #e3b341); }
.ribbon-simulate   { background: linear-gradient(135deg, #d29922, #e3b341); }
.ribbon-failed     { background: linear-gradient(135deg, #cf222e, #f85149); }
.ribbon-cancelled  { background: linear-gradient(135deg, #656d76, #8b949e); }
.ribbon-scheduled  { background: linear-gradient(135deg, #0969da, #388bfd); }
.ribbon-pending    { background: linear-gradient(135deg, #656d76, #8b949e); }

/* --- Header --- */
.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  padding-right: 48px; /* 给 ribbon 留空间 */
}

.tc-header-info {
  flex: 1;
  min-width: 0;
}

.tc-task-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2328;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.tc-initiator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #656d76;
  margin-top: 2px;
}

.tc-header-actions {
  flex-shrink: 0;
}

/* --- Body --- */
.tc-body {
  flex: 1;
  min-height: 48px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

/* 命中率柱状图 */
.tc-hitrate-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
  padding-bottom: 18px;
  box-sizing: border-box;
  position: relative;
}

.tc-bar-col {
  flex: none;
  width: calc(100% / 6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 100%;
  position: relative;
}

.tc-bar-pct {
  font-size: 11px;
  font-weight: 700;
  color: #303133;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.tc-bar-track {
  flex: 1;
  width: 100%;
  min-height: 0;
  background:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      rgba(0, 0, 0, 0.06) 3px,
      rgba(0, 0, 0, 0.06) 4px
    ),
    #f0f1f3;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.tc-bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.6s ease;
  min-height: 2px;
}

.tc-bar-label {
  position: absolute;
  top: 100%;
  left: 50%;
  margin-top: 4px;
  font-size: 10px;
  color: #656d76;
  white-space: nowrap;
  font-style: italic;
  transform-origin: top left;
  transform: rotate(20deg) translateX(-16px);
}

/* 阶段进度条 */
.tc-stage-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 0;
}

.tc-stage-dot-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tc-stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #d0d7de;
  background: #fff;
  transition: all 0.3s;
}

.tc-stage-dot.dot-completed {
  border-color: #2da44e;
  background: #2da44e;
}

.tc-stage-dot.dot-running {
  border-color: #d29922;
  background: #d29922;
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.tc-stage-dot.dot-failed {
  border-color: #cf222e;
  background: #cf222e;
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(210, 153, 34, 0.4); }
  50% { box-shadow: 0 0 0 5px rgba(210, 153, 34, 0); }
}

.tc-stage-name {
  font-size: 11px;
  color: #656d76;
  white-space: nowrap;
}

.tc-stage-line {
  width: 20px;
  height: 2px;
  background: #d0d7de;
  margin: 0 4px;
  flex-shrink: 0;
  transition: background 0.3s;
}

.tc-stage-line.line-done {
  background: #2da44e;
}

.tc-running-msg {
  font-size: 11px;
  color: #d29922;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Footer --- */
.tc-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  position: relative;
  z-index: 1;
}

.tc-footer-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #8b949e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* ========== 详情全屏弹窗内容布局 ========== */
:deep(.el-dialog__body) {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 32px;
  overflow-y: auto;
}

/* ========== 详情抽屉内容复用样式 ========== */
.timeline-stage-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-detail {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.timeline-files {
  margin-top: 6px;
  padding-left: 4px;
  border-left: 2px solid #e4e7ed;
}

.files-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 4px;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
}

.files-toggle:hover {
  background: #f5f7fa;
}

.files-toggle-arrow {
  font-size: 12px;
  color: #909399;
  transition: transform 0.2s;
}

.files-toggle-arrow.is-expanded {
  transform: rotate(90deg);
}

.timeline-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0 2px 8px;
  font-size: 12px;
}

.file-error {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-rate-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 0;
}

/* 数据目录树 */
.file-tree-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.file-tree-root-path {
  padding: 8px 12px;
  background: #f5f7fa;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  word-break: break-all;
}

.file-tree {
  max-height: 400px;
  overflow-y: auto;
  background: #fafafa;
}

.file-tree :deep(.el-tree-node__content) {
  height: 28px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.tree-icon {
  flex-shrink: 0;
  font-size: 13px;
}

.tree-dir {
  color: #409eff;
  font-weight: 500;
}

.tree-file {
  color: #606266;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.tree-meta {
  margin-left: 6px;
  color: #909399;
  font-size: 11px;
  white-space: nowrap;
}

.tree-spinner {
  margin-left: 6px;
  color: #409eff;
  font-size: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
