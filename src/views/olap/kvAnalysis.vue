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
    <el-card shadow="never" class="task-card">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
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
      </template>
      <el-table
        :data="taskList"
        border
        stripe
        fit
        v-loading="tableLoading"
        max-height="600"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="任务 ID" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text size="small" truncated>{{ row.task_id }}</el-text>
            <el-button text size="small" @click="handleCopyTaskId(row.task_id)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="任务名" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.task_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="查询时段" min-width="220">
          <template #default="{ row }">
            <template v-if="row.query">
              {{ row.query.start_datetime }} ~ {{ row.query.end_datetime }}
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="App ID" min-width="120">
          <template #default="{ row }">
            <span v-if="row.query?.app_id">{{ row.query.app_id }}</span>
            <span v-else class="text-muted">空</span>
          </template>
        </el-table-column>
        <el-table-column label="场景" width="120" align="center">
          <template #default="{ row }">
            {{ row.scenario?.label || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="120" align="center">
          <template #default="{ row }">
            {{ row.created_by?.username || row.created_by?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="stageTagType(row.pipeline?.current_stage)" size="small">
              {{ stageLabel(row.pipeline?.current_stage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阶段进度" min-width="380">
          <template #default="{ row }">
            <div class="stage-progress">
              <div v-for="stage in stageOrder" :key="stage" class="stage-item">
                <el-tag
                  :type="stageStatusType(getStageStatus(row, stage))"
                  size="small"
                  effect="plain"
                  round
                >
                  {{ stageNames[stage] }}
                </el-tag>
                <template v-if="getStageData(row, stage)?.status === 'running'">
                  <el-text type="warning" size="small" class="stage-message">
                    {{ getStageData(row, stage)?.message }}
                  </el-text>
                  <el-text v-if="getStageRunningInfo(row, stage)" type="info" size="small" class="stage-eta">
                    {{ getStageRunningInfo(row, stage).elapsed }}
                    <template v-if="getStageRunningInfo(row, stage).eta">
                      / {{ getStageRunningInfo(row, stage).eta }}
                    </template>
                  </el-text>
                </template>
                <template v-else-if="getStageData(row, stage)?.status === 'failed'">
                  <el-text type="danger" size="small" class="stage-message">
                    {{ getStageData(row, stage)?.message }}
                  </el-text>
                </template>
                <template v-else-if="getStageData(row, stage)?.status === 'completed'">
                  <el-text type="success" size="small" class="stage-elapsed">
                    {{ formatStageDuration(getStageData(row, stage)) }}
                  </el-text>
                </template>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="命中率" min-width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.result && hasModelResults(row.result)">
              <div v-for="(info, model) in getModelResults(row.result)" :key="model" class="hit-rate-item">
                <el-tag size="small" effect="plain" round>{{ model }}</el-tag>
                <el-text type="success" tag="b" size="small">{{ (info.hit_rate * 100).toFixed(2) }}%</el-text>
              </div>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间 (北京)" width="170" align="center">
          <template #default="{ row }">
            {{ row.created_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="定时启动" width="170" align="center">
          <template #default="{ row }">
            <template v-if="row.scheduled_at">
              <el-text :type="row.pipeline?.current_stage === 'scheduled' ? 'warning' : 'info'" size="small">
                {{ row.scheduled_at }}
              </el-text>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-bar">
              <el-button text type="primary" size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-popconfirm
                :title="isTaskRunning(row) ? '该任务正在执行中，删除将中断任务，确定删除？' : '确定删除该任务？'"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
                width="280"
              >
                <template #reference>
                  <el-button
                    text
                    :type="isTaskRunning(row) ? 'danger' : 'info'"
                    size="small"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="任务详情" size="560px">
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
          <el-descriptions-item label="默认模型">
            <el-text size="small">{{ detailTask.config?.default_model }}</el-text>
            <el-text type="info" size="small"> (tokenizer 兜底)</el-text>
          </el-descriptions-item>
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

        <!-- 数据目录树（懒加载） -->
        <template v-if="detailTask?.task_id">
          <el-divider>数据目录</el-divider>
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
    </el-drawer>

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
import { InfoFilled, Loading, ArrowRight } from '@element-plus/icons-vue'
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
    parts.push('App (必填)')
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

const tableRowClassName = ({ row }) => {
  if (row.pipeline?.current_stage === 'failed') return 'row-failed'
  if (isTaskRunning(row)) return 'row-running'
  return ''
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

      // 如果详情抽屉打开且是当前任务，同步更新
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
  if (!queryForm.scenario && !queryForm.appId?.trim()) {
    ElMessage.warning('全部场景下必须指定 App ID')
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

.action-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.task-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-muted {
  color: #999;
}

.stage-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.stage-message {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-eta {
  font-size: 11px;
  white-space: nowrap;
}

.stage-elapsed {
  font-size: 11px;
  white-space: nowrap;
}

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

:deep(.row-failed) {
  background-color: #fef0f0 !important;
}

:deep(.row-running) {
  background-color: #fdf6ec !important;
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
