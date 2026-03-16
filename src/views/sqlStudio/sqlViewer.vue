<template>
  <el-row :gutter="16" class="sql-viewer__body">
    <!-- 左侧：数据预览表格 + 分页（新组件） -->
    <el-col :xs="14" :sm="14" :md="16" :lg="18" class="sql-viewer__left">
      <DatasetViewer
        :all-table-data="allTableData"
        :query-loading="queryLoading"
      />
    </el-col>

    <!-- 右侧：SQL 编辑器 + 模板按钮 -->
    <el-col :xs="10" :sm="10" :md="8" :lg="6" class="sql-viewer__right">
      <el-card shadow="hover" style="width: 100%" footer-class="sql-query-footer">
        <!-- SQL 编辑区域 -->
        <el-alert
          v-show="sqlQueryWindowAlertVisible"
          title="在线 SQL 查询👇🏻"
          type="primary"
          description="在线仅支持查询且至多支持 1000 条哦"
          close-text="已知晓"
          show-icon
        />
        <div class="sql-viewer__sql-panel">
          <el-input
            v-model="sql"
            type="textarea"
            class="sql-viewer__sql-input"
            :rows="10"
            resize="none"
            placeholder="在此编写 SQL, 支持在线查询至多 1000 条数据, 例如：SELECT * FROM dataset LIMIT 1000;"
          />
        </div>
        <!-- 行详情展示区域：对应左侧表格中选中的记录 -->
        <el-divider content-position="left">猜你想用</el-divider>
        <div class="sql-viewer__sql-toolbar">
          <div class="sql-query-actions">
            <el-button
              v-for="(template, key) in templates"
              :key="key"
              class="sql-query-action"
              size="small"
              @click="applySQLTemplate(key)"
            >
              {{ template.label }}
            </el-button>
          </div>
        </div>
        <template #footer>
          <el-button :disabled="queryLoading" :loading="queryLoading" class="sql-query-btn"  type="primary" @click="runSql">
            {{ queryLoading ? '正在努力加载...' : '执行 SQL' }}
          </el-button>
          <el-button class="sql-query-btn" type="success" @click="exportSQL" ref="sqlExportBtnRef">
            导出至
          </el-button>
          <el-button class="sql-query-btn" type="danger" @click="clearSql">
            清空
          </el-button>
        </template>
      </el-card>
    </el-col>
  </el-row>

  <!-- 导出至弹窗 -->
  <el-popover
    :virtual-ref="sqlExportBtnRef"
    title="填写导出保存的地址"
    virtual-triggering
    :visible="sqlExportOutputVisible"
    width="360"
  >
    <el-form-item required>
      <el-input
        v-model="popoverForm.output"
        type="textarea"
        :rows="3"
        placeholder="保存的地址目录（必填）"
        clearable
      ></el-input>
    </el-form-item>
    <div style="text-align: right; margin: 0">
      <el-button size="small" text @click="sqlExportOutputVisible = false">cancel</el-button>
      <el-button size="small" type="primary" @click="confirmExport">
        confirm
      </el-button>
    </div>
  </el-popover>
</template>

<script setup>
import { inject, reactive, ref, onMounted, nextTick, computed } from 'vue'
import { postSQLQuery } from '@/api/SQLAdaptor/index'
import { startProcessScheduler } from '@/api/processScheduler/index'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '@/utils'
import DatasetViewer from '@/components/DatasetViewer.vue'

// 示例数据
const allTableData = ref([]) // 全量数据（传给 DatasetViewer）
const sqlQueryWindowAlertVisible = ref(false)
let sqlQueryWindowAlertTimer = null

const ctx = inject('context')

// 导出至弹窗的配置
const sqlExportBtnRef = ref()
const popoverForm = reactive({
  output: ""
})
const sqlExportOutputVisible = ref(false)
const route = useRoute();
const router = useRouter()

const queryLoading = ref(false)
const sqlQueryName = ref('mantis_instruct_dreamsim_v1')
const sql = ref(`SELECT * FROM qianfan_bos_catalog.all_data.${sqlQueryName.value} LIMIT 20`)

// 动态生成 SQL 模板
const templates = computed(() => {
  return {
    limitQuery: {
      label: 'limit 查询示例',
      sql: `SELECT * FROM qianfan_bos_catalog.all_data.${sqlQueryName.value} LIMIT 20`
    },
    stat: {
      label: '统计 Token 数分布',
      sql: `SELECT
        CONCAT(FLOOR(conversations_tokens / 5) * 5, '-', FLOOR(conversations_tokens / 5) * 5 + 4) AS token_range,
        COUNT(*) AS cnt
      FROM qianfan_bos_catalog.all_data.${sqlQueryName.value}
      GROUP BY FLOOR(conversations_tokens / 5)
      ORDER BY FLOOR(conversations_tokens / 5)
      `
    },
    tableInfo: {
      label: '查询 table 结构',
      sql: `SHOW COLUMNS FROM qianfan_bos_catalog.all_data.${sqlQueryName.value}`
    },
    catalog: {
      label: '查询 catalog 列表',
      sql: 'SHOW DATABASES'
    }
  }
})

const applySQLTemplate = (key) => {
  if (templates.value[key]) {
    sql.value = templates.value[key].sql
  }
}

const initSQLViewerData = () => {
  allTableData.value = []
}

const runSql = async () => {
  // 1. 前置校验
  if (!sql.value || sql.value.trim().length <= 10) {
    ElNotification({
      title: '提示',
      message: '请输入有效的 SQL 语句后再执行！',
      type: 'warning',
    })
    return
  }

  // 2. 开启加载状态
  queryLoading.value = true
  initSQLViewerData()

  try {
    // 3. 发起 POST 请求
    const response = await postSQLQuery({
      sql: sql.value.trim()
    })

    // 4. 处理响应数据 - 标记媒体类型
    if (response && response.data.result.length > 0) {
      allTableData.value = response.data.result

      ElNotification({
        title: '执行成功',
        message: 'SQL 已成功执行，数据已更新！',
        type: 'success',
        duration: 5000,
      })
    } else {
      initSQLViewerData()
      ElNotification({
        title: '提示',
        message: `（traceID:${response?.trace_id}）未检测到有效数据。原因: ${response?.message || '接口返回空数据'}`,
        type: 'info',
        duration: 0,
      })
      return
    }
  } catch (err) {
    console.error('SQL 执行请求失败：', err)
    initSQLViewerData()
    ElNotification({
      title: '执行失败',
      message: `失败原因：${err.message || '网络异常或接口错误'}`,
      type: 'error',
      duration: 0,
    })
  } finally {
    nextTick(() => {
      queryLoading.value = false
    })
  }
}

const exportSQL = () => {
  sqlExportOutputVisible.value = true
  popoverForm.output = `bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/${ctx?.userInfo?.username || 'llm_autobahn_sql_export_default_dir'}/${formatDate("yyyyMMddhhmmss")}`
}

const confirmExport = async () => {
  if (!popoverForm.output.trim()) {
    ElMessage.error('请输入导出内容，不能为空！')
    return
  }

  // 组装最终传递的data对象
  const data = {
    pipeline_id: "693928853e44d2c75bccb450",
    parameters: {
        "name": "sqlexport",
        "sql": sql.value,
        "output": popoverForm.output,
        "exec_num": 50,
    },
    queue: "kubespark",
    name: `export-iceberg-${ctx?.userInfo?.username}`,
  }

  try {
    const response = await startProcessScheduler(data)
    if (response.code !== 0) {
      ElNotification({
        title: '导出任务执行失败',
        message: response.message,
        type: 'error',
        duration: 0,
      })
    } else {
      ElNotification({
        title: '导出任务执行成功',
        message: '导出任务已添加，请移步导出任务页查看进度~',
        type: 'success',
        duration: 5000,
      })
      // 跳转至任务详情页
      await router.push('/sqlStudio/sqlExporter')
    }
  } catch (err) {
    ElNotification({
      title: '导出失败',
      message: `失败原因：${err.message || '网络异常或接口错误,请联系管理员'}`,
      type: 'error',
      duration: 0,
    })
  } finally {
    nextTick(() => {
      sqlExportOutputVisible.value = false
    })
  }
}

const clearSql = () => {
  sql.value = ''
}

const showAlert = () => {
  sqlQueryWindowAlertVisible.value = true;

  if(sqlQueryWindowAlertTimer) clearTimeout(sqlQueryWindowAlertTimer)

  // 设置 3 秒后自动关闭
  sqlQueryWindowAlertTimer = setTimeout(() => {
    sqlQueryWindowAlertVisible.value = false
  }, 5000)
};

onMounted(() => {
  showAlert();
  // --- 生命周期 ---
  const name = route.query.name
  if (name) {
    sqlQueryName.value = name
    sql.value = `SELECT * FROM qianfan_bos_catalog.all_data.${sqlQueryName.value} LIMIT 20`
    runSql()
  }
})
</script>

<style scoped>
.sql-viewer__left,
.sql-viewer__right {
  height: calc(100vh - 120px);
  display: flex;
}

.sql-viewer__sql-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.sql-viewer__sql-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:deep(.sql-query-footer) {
  height: 48px;
  overflow: auto;
  padding: 2px 0 2px 20px;
}

.sql-query-action {
  margin: 4px;
}

.sql-query-btn {
  margin: 4px;
}

.sql-viewer__sql-input {
  font-family: var(--el-font-family-monospace, SFMono-Regular, Menlo, Monaco,
      Consolas, 'Liberation Mono', 'Courier New', monospace);
}
</style>
