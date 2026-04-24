<template>
  <div class="app-container">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <el-button type="primary" @click="preloadTask = null; createVisible = true">
        <el-icon><Plus /></el-icon> 新建评测
      </el-button>
      <el-button text @click="refreshAll">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <!-- 双 Tab -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1: 自动执行 -->
      <el-tab-pane label="自动执行" name="execute">
        <div class="tab-toolbar">
          <el-input
            v-model="execFilter.name"
            placeholder="按任务名过滤"
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
            <el-option label="Queued" value="queued" />
            <el-option label="Starting" value="starting" />
            <el-option label="Running" value="running" />
            <el-option label="Completed" value="completed" />
            <el-option label="Failed" value="failed" />
            <el-option label="Cancelled" value="cancelled" />
            <el-option label="Scheduled" value="scheduled" />
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
        <el-pagination
          v-if="executeTasks.length"
          class="task-pagination"
          v-model:current-page="execPage.current"
          v-model:page-size="execPage.size"
          :page-sizes="[12, 24, 48]"
          :total="executeTasks.length"
          layout="total, sizes, prev, pager, next"
          @size-change="execPage.current = 1"
        />
      </el-tab-pane>

      <!-- Tab 2: 物化脚本 -->
      <el-tab-pane label="物化脚本" name="materialize">
        <div class="tab-toolbar">
          <el-input
            v-model="matFilter.name"
            placeholder="按任务名过滤"
            clearable
            style="width: 200px"
            @clear="loadMaterializeTasks"
            @keyup.enter="loadMaterializeTasks"
          />
          <el-select
            v-model="matFilter.status"
            placeholder="状态"
            clearable
            style="width: 130px"
            @change="loadMaterializeTasks"
          >
            <el-option label="Preparing" value="preparing" />
            <el-option label="Materializing" value="materializing" />
            <el-option label="Prepared" value="prepared" />
            <el-option label="Running" value="running" />
            <el-option label="Completed" value="completed" />
            <el-option label="Failed" value="failed" />
            <el-option label="Cancelled" value="cancelled" />
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
        <el-pagination
          v-if="materializeTasks.length"
          class="task-pagination"
          v-model:current-page="matPage.current"
          v-model:page-size="matPage.size"
          :page-sizes="[12, 24, 48]"
          :total="materializeTasks.length"
          layout="total, sizes, prev, pager, next"
          @size-change="matPage.current = 1"
        />
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
import TaskCard from './components/TaskCard.vue'
import TaskCreateStepper from './components/TaskCreateStepper.vue'
import TaskDetail from './components/TaskDetail.vue'

const activeTab = ref('execute')

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

const execFilter = reactive({ name: '', status: '' })
const matFilter = reactive({ name: '', status: '' })

const EXECUTE_STATUSES = new Set(['queued', 'starting', 'running', 'completed', 'done', 'failed', 'cancelled'])
const MATERIALIZE_STATUSES = new Set(['preparing', 'materializing', 'prepared'])

const executeTasks = ref([])
const materializeTasks = ref([])

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
  if (execFilter.status) {
    exec = exec.filter(t => {
      const s = t.pipeline?.current_stage || t.status || ''
      if (execFilter.status === 'completed') return s === 'done' || s === 'completed'
      if (execFilter.status === 'running') return ['queued', 'starting', 'running'].includes(s)
      return s === execFilter.status
    })
  }
  executeTasks.value = exec

  // materialize tasks
  let mat = all.filter(t => t.execution_mode === 'materialize_only')
  if (matFilter.name) {
    mat = mat.filter(t => (t.name || '').includes(matFilter.name))
  }
  if (matFilter.status) {
    mat = mat.filter(t => {
      const s = t.pipeline?.current_stage || t.status || ''
      return s === matFilter.status
    })
  }
  materializeTasks.value = mat
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
      const s = t.pipeline?.current_stage || t.status || ''
      return !['done', 'completed', 'failed', 'cancelled', 'prepared'].includes(s)
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
.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.task-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
