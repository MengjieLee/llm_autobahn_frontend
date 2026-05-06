<template>
  <div class="app-container">
    <!-- 双 Tab -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1: 物化脚本 -->
      <el-tab-pane label="物化脚本" name="materialize">
        <div class="tab-toolbar">
          <el-select
            v-model="matFilter.owner"
            placeholder="Owner"
            clearable
            style="width: 140px"
            @change="loadMaterializeTasks"
          >
            <el-option
              v-for="o in ownerOptions"
              :key="o"
              :label="o"
              :value="o"
            />
          </el-select>
          <el-input
            v-model="matFilter.name"
            placeholder="按任务名搜索"
            clearable
            style="width: 200px"
            @clear="loadMaterializeTasks"
            @keyup.enter="loadMaterializeTasks"
          />
          <el-select
            v-model="matFilter.status"
            placeholder="Phase"
            clearable
            style="width: 130px"
            @change="loadMaterializeTasks"
          >
            <el-option
              v-for="opt in STATUS_FILTER_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select
            v-model="matFilter.scope"
            placeholder="Result"
            clearable
            style="width: 160px"
            @change="loadMaterializeTasks"
          >
            <el-option
              v-for="opt in SCOPE_FILTER_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div v-loading="matLoading" element-loading-text="正在加载物化脚本列表…" class="task-list">
          <TaskCard
            v-for="task in matPagedTasks"
            :key="task.id"
            :task="task"
            mode="materialize"
            @click="openDetail(task)"
            @cancel="handleCancel"
            @load-config="handleLoadConfig"
          />
          <el-empty v-if="!matLoading && !materializeTasks.length" description="暂无物化脚本任务" />
        </div>

        <div class="task-fixed-panel">
          <div class="panel-left">
            <el-button type="primary" @click="preloadTask = null; createVisible = true">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon> 新建评测 ✨
            </el-button>
            <el-button text @click="refreshAll">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <el-pagination
            v-if="materializeTasks.length"
            v-model:current-page="matPage.current"
            v-model:page-size="matPage.size"
            :page-sizes="[12, 24, 48]"
            :total="materializeTasks.length"
            layout="total, sizes, prev, pager, next"
            @size-change="matPage.current = 1"
          />
        </div>
      </el-tab-pane>
      
      <!-- Tab 2: 自动执行 -->
      <el-tab-pane label="自动执行" name="execute">
        <div class="tab-toolbar">
          <el-input
            v-model="execFilter.name"
            placeholder="按任务名搜索"
            clearable
            style="width: 200px"
            @clear="loadExecuteTasks"
            @keyup.enter="loadExecuteTasks"
          />
          <el-select
            v-model="execFilter.status"
            placeholder="状态"
            clearable
            style="width: 130px"
            @change="loadExecuteTasks"
          >
            <el-option
              v-for="opt in STATUS_FILTER_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select
            v-model="execFilter.scope"
            placeholder="Result"
            clearable
            style="width: 160px"
            @change="loadExecuteTasks"
          >
            <el-option
              v-for="opt in SCOPE_FILTER_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select
            v-model="execFilter.owner"
            placeholder="Owner"
            clearable
            style="width: 140px"
            @change="loadExecuteTasks"
          >
            <el-option
              v-for="o in ownerOptions"
              :key="o"
              :label="o"
              :value="o"
            />
          </el-select>
        </div>
        <div v-loading="execLoading" element-loading-text="正在加载任务列表…" class="task-list">
          <TaskCard
            v-for="task in execPagedTasks"
            :key="task.id"
            :task="task"
            mode="execute"
            @click="openDetail(task)"
            @cancel="handleCancel"
            @load-config="handleLoadConfig"
          />
          <el-empty v-if="!execLoading && !executeTasks.length" description="暂无自动执行任务" />
        </div>
        <div class="task-fixed-panel">
          <div class="panel-left">
            <el-button type="primary" @click="preloadTask = null; createVisible = true">
              <el-icon><Plus /></el-icon> 新建评测
            </el-button>
            <el-button text @click="refreshAll">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <el-pagination
            v-if="executeTasks.length"
            v-model:current-page="execPage.current"
            v-model:page-size="execPage.size"
            :page-sizes="[12, 24, 48]"
            :total="executeTasks.length"
            layout="total, sizes, prev, pager, next"
            @size-change="execPage.current = 1"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建向导 -->
    <TaskCreateStepper v-model="createVisible" :preload-task="preloadTask" @created="onTaskCreated" />

    <!-- 详情弹窗 -->
    <TaskDetail
      v-model="detailVisible"
      :task-id="detailTaskId"
      @cancelled="refreshCurrentTab"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { mtpListTasks, mtpCancelTask, mtpGetTaskLaunchConfig } from '@/api/mtpEval/index'
import { TERMINAL_STATUSES, normalizeStatus, deriveLifecycle, STATUS_FILTER_OPTIONS, SCOPE_FILTER_OPTIONS } from './constants'
import TaskCard from './components/TaskCard.vue'
import TaskCreateStepper from './components/TaskCreateStepper.vue'
import TaskDetail from './components/TaskDetail.vue'

const activeTab = ref('materialize')

// --- 新建 ---
const createVisible = ref(false)
const preloadTask = ref(null)

// --- 详情 ---
const detailVisible = ref(false)
const detailTaskId = ref('')

const openDetail = (task) => {
  detailTaskId.value = task.id
  detailVisible.value = true
}

// --- 任务数据 ---
const allTasks = ref([])
const execLoading = ref(false)
const matLoading = ref(false)

const execFilter = reactive({ name: '', status: '', scope: '', owner: '' })
const matFilter = reactive({ name: '', status: '', scope: '', owner: '' })

const executeTasks = ref([])
const materializeTasks = ref([])

// 动态提取所有不重复的 owner 列表
const ownerOptions = computed(() => {
  const set = new Set()
  for (const t of allTasks.value) {
    if (t.owner) set.add(t.owner)
  }
  return [...set].sort()
})

// --- 分页 ---
const execPage = reactive({ current: 1, size: 12 })
const matPage = reactive({ current: 1, size: 12 })

const execPagedTasks = computed(() => {
  const start = (execPage.current - 1) * execPage.size
  return executeTasks.value.slice(start, start + execPage.size)
})
const matPagedTasks = computed(() => {
  const start = (matPage.current - 1) * matPage.size
  return materializeTasks.value.slice(start, start + matPage.size)
})

const loadAllTasks = async ({ silent = false, poll = false } = {}) => {
  if (!silent) {
    execLoading.value = true
    matLoading.value = true
  }
  try {
    const res = await mtpListTasks({ poll })
    allTasks.value = res.data || []
    splitTasks()
  } catch (e) {
    ElNotification({ title: '加载任务列表失败', message: e.message || '', type: 'error' })
  } finally {
    execLoading.value = false
    matLoading.value = false
  }
}

const splitTasks = () => {
  const all = allTasks.value

  // execute tasks
  let exec = all.filter(t => {
    const mode = t.execution_mode || ''
    return mode !== 'materialize_only'
  })
  if (execFilter.name) {
    exec = exec.filter(t => (t.name || '').includes(execFilter.name))
  }
  exec = applyFilters(exec, execFilter)
  executeTasks.value = exec

  // materialize tasks
  let mat = all.filter(t => t.execution_mode === 'materialize_only')
  if (matFilter.name) {
    mat = mat.filter(t => (t.name || '').includes(matFilter.name))
  }
  mat = applyFilters(mat, matFilter)
  materializeTasks.value = mat
}

/**
 * 按 Phase (status) + Result (scope) 过滤
 * status → 匹配 deriveLifecycle().phaseClass
 * scope  → 匹配 deriveLifecycle().resultClass (或 'manual_run' 特殊处理)
 */
const applyFilters = (tasks, filter) => {
  let result = tasks
  if (filter.status) {
    result = result.filter(t => {
      const s = normalizeStatus(t.pipeline?.current_stage || t.status)
      const lc = deriveLifecycle(s)
      return lc.phaseClass === filter.status
    })
  }
  if (filter.scope) {
    result = result.filter(t => {
      const s = normalizeStatus(t.pipeline?.current_stage || t.status)
      const lc = deriveLifecycle(s)
      if (filter.scope === 'manual_run') return lc.result === 'Manual Run'
      if (filter.scope === 'connector_missing') return lc.resultClass === 'failed' && s === 'connector_missing'
      return lc.resultClass === filter.scope
    })
  }
  if (filter.owner) {
    result = result.filter(t => (t.owner || '') === filter.owner)
  }
  return result
}

const loadExecuteTasks = () => { execPage.current = 1; splitTasks() }
const loadMaterializeTasks = () => { matPage.current = 1; splitTasks() }

const onTabChange = () => { splitTasks() }

// --- 操作 ---
const handleCancel = async (taskId) => {
  try {
    await mtpCancelTask(taskId)
    ElMessage.success('任务已取消')
    await loadAllTasks()
  } catch (e) {
    ElMessage.error('取消失败: ' + (e.message || e))
  }
}

const handleLoadConfig = async (task) => {
  try {
    const res = await mtpGetTaskLaunchConfig(task.id)
    preloadTask.value = res.data || task
  } catch (e) {
    ElMessage.warning('获取启动配置失败，使用列表数据: ' + (e.message || e))
    preloadTask.value = task
  }
  createVisible.value = true
}

const onTaskCreated = () => {
  preloadTask.value = null
  loadAllTasks()
  // 根据新任务类型切到对应 tab (创建后刷新即可)
}

const refreshCurrentTab = () => { loadAllTasks() }
const refreshAll = () => { loadAllTasks() }

// --- 轮询运行中任务 ---
let globalPollTimer = null
const POLL_INTERVAL = 120000

const startGlobalPolling = () => {
  stopGlobalPolling()
  globalPollTimer = setInterval(() => {
    const hasRunning = allTasks.value.some(t => {
      const s = normalizeStatus(t.pipeline?.current_stage || t.status)
      return !TERMINAL_STATUSES.has(s)
    })
    if (hasRunning) loadAllTasks({ silent: true, poll: true })
  }, POLL_INTERVAL)
}

const stopGlobalPolling = () => {
  if (globalPollTimer) { clearInterval(globalPollTimer); globalPollTimer = null }
}

// --- 生命周期 ---
onMounted(() => {
  loadAllTasks()
  startGlobalPolling()
})

onUnmounted(() => {
  stopGlobalPolling()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  overflow: hidden;
  padding: 0px 20px;
}
/* 
.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
} */

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.task-fixed-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  margin-top: 12px;
  flex-shrink: 0;
}

.panel-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
