<template>
  <el-row :gutter="16" class="sql-viewer__body">
    <!-- 左侧：数据预览表格 + 分页 -->
    <el-col :xs="14" :sm="14" :md="16" :lg="18" class="sql-viewer__left">
      <el-card shadow="hover" style="width: 100%" footer-class="sql-viewer-footer">
        <!-- 表格主体区域：占满卡片中间高度，内部滚动 -->
        <div class="sql-viewer__table-wrapper">
          <el-table
            :data="tableData"
            border
            fit
            lazy
            stripe
            :show-header="hasData"
            highlight-current-row
            height="100%"
            size="small"
            @row-click="handleRowClick"
          >
            <template #empty>
              <div v-if="!queryLoading">
                <el-empty>
                  <template #description>
                    <p>暂无数据</p>
                  </template>
                </el-empty>
              </div>
              <div v-else><el-icon class="is-loading" size="large"><Loading /></el-icon> 请耐心等待, 努力加载中 ╰(*°▽°*)╯ ...</div>
            </template>
            <el-table-column
              label="media"
              min-width="120"
              v-if="hasMedium"
            >
              <template #header>
                <div class="sql-viewer__meta-title">media</div>
                <div class="sql-viewer__meta-sub">list · lengths</div>
                <div class="sql-viewer__tokens-bar">
                  <span v-for="n in 4" :key="n" class="tokens-bar__item" />
                </div>
              </template>
              <template #default="scope">
                <el-row align="middle">
                  <el-col :xs="16" :sm="16" :md="16" :lg="18">
                    <div v-if="scope.row.medium && scope.row.medium.length" class="expand-cell"
                      :class="{ 'expanded': scope.row.isExpanded }">
                      <!-- 循环渲染最多 2 个媒体文件 -->
                      <template v-for="(media, idx) in (scope.row.isExpanded ? scope.row.medium : scope.row.medium.slice(0, 2))" :key="idx">
                        <!-- 图片展示 -->
                        <el-image
                          v-if="scope.row.mediaType === 'image'"
                          style="width: 48px; height: 48px; margin-right: 4px; cursor: pointer;"
                          :src="media"
                          :initial-index="idx"
                          fit="fill"
                          show-progress
                          :preview-teleported="true"
                          @click.prevent.stop="toggleConversationsExpand(scope.$index, scope.row)"
                        >
                          <template #error>
                            <div>加载失败</div>
                          </template>
                        </el-image>

                        <!-- 视频展示 -->
                        <video
                          v-else-if="scope.row.mediaType === 'video'"
                          style="width: 180px; height: 180px; margin-right: 4px; object-fit: fill;"
                          :src="media"
                          controls
                          muted
                          preload="metadata"
                          @click.prevent.stop="toggleConversationsExpand(scope.$index, scope.row)"
                        >
                          您的浏览器不支持视频播放
                        </video>

                        <!-- 音频展示（显示音频图标） -->
                        <audio
                          v-else-if="scope.row.mediaType === 'audio'"
                          :src="media"
                          controls
                          style="width: 220px; height: 48px; margin-right: 4px; border-radius: 4px;"
                          @click.prevent.stop="toggleConversationsExpand(scope.$index, scope.row)"
                        ></audio>

                      </template>
                    </div>
                    <div v-else>加载失败</div>
                  </el-col>
                  <el-col :xs="8" :sm="8" :md="8" :lg="6">
                    <!-- 显示剩余额外媒体展开按钮 -->
                    <div v-if="scope.row.medium.length > 2 && !scope.row.isExpanded" class="medium-more-trigger" @click="toggleExpand(scope.row)" style="cursor: pointer;">
                      展开<el-icon><View /></el-icon>
                    </div>
                    <div v-else-if="scope.row.medium.length > 2" @click="toggleExpand(scope.row)" style="cursor: pointer;">
                      收起<el-icon><Hide /></el-icon>
                    </div>
                  </el-col>
                </el-row>
              </template>
            </el-table-column>
            <el-table-column
              min-width="300"
              v-if="hasConvs"
            >
              <template #header>
                <div class="sql-viewer__meta-title">conversations</div>
                <div class="sql-viewer__meta-sub">list · lengths</div>
                <div class="sql-viewer__tokens-bar">
                  <span v-for="n in 8" :key="n" class="tokens-bar__item" />
                </div>
              </template>
              <template #default="scope">
                <el-row>
                  <el-col :xs="22" :sm="22" :md="22" :lg="23">
                    <div class="expand-cell"
                    @click="toggleExpand(scope.row)"
                    :class="{ 'expanded': scope.row.isExpanded }"
                    style="cursor: pointer;">
                      {{ scope.row.conversations}}
                    </div>
                  </el-col>
                  <el-col :xs="2" :sm="2" :md="2" :lg="1">
                    <div class="conversations-trigger" @click.prevent="toggleConversationsExpand(scope.$index, scope.row)" style="cursor: pointer;">
                      {...}
                    </div>
                  </el-col>
                </el-row>
              </template>
            </el-table-column>
            <el-table-column
              v-for="column in dynamicColumns"
              :key="column"
              :label="formatColumnLabel(column)"
              min-width="120"
            >
            <template #default="scope">
              <div class="expand-cell"
                @click="toggleExpand(scope.row)"
                :class="{ 'expanded': scope.row.isExpanded }"
                style="cursor: pointer;"
              >{{ scope.row[column] }}</div>
            </template>
            </el-table-column>
          </el-table>
        </div>
        <template v-if="hasData" #footer>
          <div class="sql-viewer__pagination">
            <el-pagination
              :current-page="pagination.currentPage"
              :page-sizes="pagination.pageSizes"
              size="small"
              :page-size="pagination.pageSize"
              :default-page-size="pagination.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </template>
      </el-card>
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
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('limitImage')">
              image 资源查询示例
            </el-button>
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('limitVideo')">
              video 资源查询示例
            </el-button>
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('limitAudio')">
              audio 资源查询示例
            </el-button>
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('stat')">
              统计 Token 数分布
            </el-button>
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('tableInfo')">
              查询 table 结构
            </el-button>
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('catalog')">
              查询 catalog 列表
            </el-button>
          </div>
        </div>
        <template #footer>
          <el-button :loading="queryLoading" class="sql-query-btn"  type="primary" @click="runSql">
            执行 SQL
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

  <el-dialog
    v-model="isDialogOpen"
    fullscreen
    :append-to-body="true"
    @close="isDialogOpen = false"
  >
    <template #header>
      <div>
        <span style="font-weight: 700; margin-right: 28px;">数据透视弹窗</span>
        <el-button plain type="primary" icon="ArrowLeftBold" circle v-if="currentRow.idx > 0" @click="toggleCurrentRow(currentRow.idx - 1)"></el-button>
        <el-button plain type="primary" icon="ArrowRightBold" circle v-if="currentRow.idx < tableData.length - 1" @click="toggleCurrentRow(currentRow.idx + 1)"></el-button>
      </div>
    </template>
    <div class="dialog-layout">
      <el-row :gutter="16">
        <el-col v-if="dialogMediumShown" :xs="12" :sm="8" :md="8" :lg="6">
          <el-divider content-position="left">{{ currentRow.mediaType === 'image' ? '图片' : currentRow.mediaType === 'video' ? '视频' : '音频' }}视图</el-divider>
          <div class="dialog-media">
            <template v-for="(media, index) in currentRow.medium" :key="index">
              <!-- 弹窗内图片展示 -->
              <el-image
                v-if="currentRow.mediaType === 'image'"
                class="dialog-left__image"
                :src="media"
                :preview-src-list="currentRow.medium"
                :initial-index="index"
                fit="scale-down"
                show-progress
              >
                <template #error>
                  <div class="dialog-left__image--fallback">加载失败</div>
                </template>
              </el-image>

              <!-- 弹窗内视频展示 -->
              <video
                v-else-if="currentRow.mediaType === 'video'"
                class="dialog-left__image"
                :src="media"
                controls
              >
                您的浏览器不支持视频播放
              </video>

              <!-- 弹窗内音频展示 -->
              <audio
                v-else-if="currentRow.mediaType === 'audio'"
                :src="media"
                controls
              >
                您的浏览器不支持音频播放
              </audio>
            </template>
          </div>
        </el-col>
        <el-col :xs="dialogMediumShown ? 12:20" :sm="dialogMediumShown ? 12:20" :md="dialogMediumShown ? 12:20" :lg="dialogMediumShown ? 14:20">
          <el-divider content-position="left">JSON 视图</el-divider>
          <vue-json-pretty
            class="dialog-conversations"
            :data="currentRow.conversations"
            :expand-depth="3"
            show-length
            showIcon
            show-line-number
            highlight-hover
          />
        </el-col>
        <el-col :xs="dialogMediumShown ? 24:4" :sm="dialogMediumShown ? 4:4" :md="dialogMediumShown ? 4:4" :lg="dialogMediumShown ? 4:4">
          <el-divider content-position="left">#{{currentRow.idx + 1}} 元数据概览</el-divider>
          <div class="dialog-metadata" v-if="activeRow">
            <div class="detail-section">
              <div
                class="detail-label"
                :class="{ 'is-active': dialogMediumShown === true }"
                @click="changeDialogMediumShown(!dialogMediumShown)"
              >
                {{ currentRow.mediaType === 'image' ? '图片' : currentRow.mediaType === 'video' ? '视频' : '音频' }}预览
              </div>
              <div class="detail-images">
                <template v-for="(media, index) in currentRow.medium" :key="index">
                  <el-image
                    v-if="currentRow.mediaType === 'image'"
                    style="width: 48px; height: 48px; margin-right: 4px"
                    :src="media"
                    :preview-src-list="currentRow.medium"
                    :initial-index="index"
                    fit="fill"
                    show-progress
                  >
                    <template #error>
                      <div>加载失败</div>
                    </template>
                  </el-image>

                  <video
                    v-else-if="currentRow.mediaType === 'video'"
                    style="width: 48px; height: 48px; margin-right: 4px; object-fit: cover;"
                    :src="media"
                    controls
                    muted
                    preload="metadata"
                  >
                    不支持视频
                  </video>

                  <div
                    v-else-if="currentRow.mediaType === 'audio'"
                    style="width: 48px; height: 48px; margin-right: 4px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center;"
                    @click="playAudio(media)"
                  >
                  </div>
                </template>
              </div>
            </div>
            <div class="detail-section">
              <div
                class="detail-label"
                :class="{ 'is-active': dialogMediumShown === false }"
              >
                文本内容
              </div>
              <div class="detail-content detail-content--scroll">
                {{ currentRow.conversations }}
              </div>
            </div>

            <div v-for="column in dynamicColumns" :key="column" class="detail-section">
              <div class="detail-label">{{ formatColumnLabel(column) }}</div>
              <div class="detail-content detail-content--scroll">
                {{ currentRow[column] || "NULL" }}
              </div>
            </div>

          </div>
          <div class="sql-viewer__detail sql-viewer__detail--empty" v-else>
            点击左侧表格的行或右侧“+”图标，在此查看完整数据详情
          </div>
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script setup>
import { inject, reactive, ref, onMounted, computed, nextTick } from 'vue'
import { postSQLQuery } from '@/api/SQLAdaptor/index'
import { startProcessScheduler } from '@/api/processScheduler/index'
import { useRouter } from 'vue-router'
import { formatDate } from '@/utils'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { View, Hide } from '@element-plus/icons-vue'

// 示例数据
const allTableData = ref([]) // 全量数据
const tableData = ref([]) // 分页展示数据
const hasData = computed(() => {
  // 增加空值保护，避免 tableData 为 undefined/null 时报错
  return !!tableData.value && tableData.value.length > 0
})

const sqlQueryWindowAlertVisible = ref(false)
let sqlQueryWindowAlertTimer = null

const ctx = inject('context')

// 导出至弹窗的配置
const sqlExportBtnRef = ref()
const popoverForm = reactive({
  output: ""
})
const sqlExportOutputVisible = ref(false)
const router = useRouter()

const pagination = reactive({
  currentPage: 1,
  pageSizes: [10, 20, 50 ,100],
  pageSize: 20,
  total: 0
})

const queryLoading = ref(false)
const activeRow = ref(null)
const sql = ref('SELECT * FROM qianfan_bos_catalog.all_data.mantis_instruct_dreamsim_v1 LIMIT 20')

const templates = {
  limitImage: 'SELECT * FROM qianfan_bos_catalog.all_data.mantis_instruct_dreamsim_v1 LIMIT 20',
  limitVideo: 'SELECT * FROM qianfan_bos_catalog.all_data.sharegpt4o_video_v1 LIMIT 20',
  limitAudio: 'SELECT * FROM qianfan_bos_catalog.all_data.sharegpt4o_audio_v1 LIMIT 20',
  stat: `SELECT
      CONCAT(FLOOR(conversations_tokens / 5) * 5, '-', FLOOR(conversations_tokens / 5) * 5 + 4) AS token_range,
      COUNT(*) AS cnt
    FROM qianfan_bos_catalog.all_data.infovqa_v1
    GROUP BY FLOOR(conversations_tokens / 5)
    ORDER BY FLOOR(conversations_tokens / 5)
  `,
  tableInfo: 'SHOW COLUMNS FROM qianfan_bos_catalog.all_data.infovqa_v1',
  catalog: 'SHOW DATABASES'
}

const handleRowClick = (row) => {
  activeRow.value = row
}

// 实现分页大小变化事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  setTableDataByPage()
}

// 实现分页页码切换事件
const handlePageChange = (val) => {
  pagination.currentPage = val
  setTableDataByPage()
}

const setTableDataByPage = () => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  tableData.value = allTableData.value.slice(startIndex, endIndex)
}

const applySQLTemplate = (key) => {
  if (templates[key]) {
    sql.value = templates[key]
  }
}

// 播放音频方法
const playAudio = (src) => {
  const audio = new Audio(src)
  audio.play().catch(err => {
    ElNotification({
      title: '提示',
      message: '音频播放失败，请检查文件格式或浏览器权限',
      type: 'warning'
    })
    console.error('音频播放失败:', err)
  })
}

const initSQLViewerData = () => {
  allTableData.value = []
  tableData.value = []
  pagination.total = 0
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

    // 4. 处理响应数据 - 核心修改：标记媒体类型
    if (response && response.data.result.length > 0) {
      allTableData.value = response.data.result.map((record) => {
        const newRecord = { ...record, isExpanded: false } // 初始化展开状态

        // 优先级：image > video > audio（根据实际业务调整）
        if (record.image && record.image.length) {
          newRecord.medium = record.image
          newRecord.mediaType = 'image' // 标记图片类型
        } else if (record.video && record.video.length) {
          newRecord.medium = record.video
          newRecord.mediaType = 'video' // 标记视频类型
        } else if (record.audio && record.audio.length) {
          newRecord.medium = record.audio
          newRecord.mediaType = 'audio' // 标记音频类型
        } else {
          newRecord.medium = []
          newRecord.mediaType = 'none' // 无媒体文件
        }

        return newRecord
      })

      // 更新分页总数
      pagination.total = allTableData.value.length
      pagination.currentPage = 1
      setTableDataByPage()
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

    ElNotification({
      title: '执行成功',
      message: 'SQL 已成功执行，数据已更新！',
      type: 'success',
      duration: 5000,
    })

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

const mediumLst = ['image', 'video', 'audio']
const excludeColumns = ['image', 'video', 'audio', 'conversations', 'isExpanded', 'mediaType', 'medium']
const hasMedium = ref(false)
const hasConvs = ref(false)

const dynamicColumns = computed(() => {
  hasMedium.value = false
  hasConvs.value = false
  if (tableData.value.length === 0) return []
  const allColumns = Object.keys(tableData.value[0])

  hasMedium.value = mediumLst.some(mediumField => allColumns.includes(mediumField))
  hasConvs.value = allColumns.includes('conversations')

  return allColumns.filter(col => !excludeColumns.includes(col))
})

const formatColumnLabel = (column) => {
  // 首字母大写 + 驼峰转空格
  return column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
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

const toggleExpand = (row) => {
  row.isExpanded = !row.isExpanded
}

const isDialogOpen = ref(false)
const currentRow = ref(null)
const dialogMediumShown = ref(false)

const toggleConversationsExpand = (idx, row) => {
  currentRow.value = row
  currentRow.value.idx = idx
  isDialogOpen.value = true
  dialogMediumShown.value = row?.medium?.length > 0
}

const changeDialogMediumShown = (value) => {
  dialogMediumShown.value = value
}

const toggleCurrentRow = (idx) => {
  currentRow.value = tableData.value[idx]
  currentRow.value.idx = idx
}

const showAlert = () => {
  sqlQueryWindowAlertVisible.value = true;

  if(sqlQueryWindowAlertTimer) clearTimeout(sqlQueryWindowAlertTimer)

  // 设置 3 秒后自动关闭（可自定义时长，单位：毫秒）
  sqlQueryWindowAlertTimer = setTimeout(() => {
    sqlQueryWindowAlertVisible.value = false
  }, 5000)
};

onMounted(() => {
  showAlert();
})

</script>

<style scoped>

.sql-viewer__meta-block {
  margin-bottom: 8px;
}

.sql-viewer__meta-title {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.sql-viewer__meta-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sql-viewer__meta-bar-group {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.meta-bar {
  width: 18px;
  border-radius: 2px;
  background-color: var(--el-border-color-lighter);
  height: 10px;
}

.meta-bar--primary {
  background-color: var(--el-color-primary-light-5);
  height: 16px;
}

.meta-bar--muted {
  opacity: 0.8;
}

.sql-viewer__meta-block--tokens {
  display: flex;
  flex-direction: column;
}

.sql-viewer__tokens-bar {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin-top: 4px;
}

.tokens-bar__item {
  width: 4px;
  border-radius: 999px;
  background-color: var(--el-color-primary);
  height: 8px;
}

.tokens-bar__item:nth-child(3n) {
  height: 16px;
}

.tokens-bar__item:nth-child(2n) {
  height: 12px;
}

.sql-viewer__left,
.sql-viewer__right {
  height: calc(100vh - 120px);
  display: flex;
}

.sql-viewer__table-wrapper {
  min-height: 260px;
  overflow: auto;
}

:deep(.el-table__empty-block) {
  height: 80vh !important;
}

.sql-viewer__pagination {
  overflow: auto;
}

.medium-more-trigger {
  color: var(--el-text-color-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
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

:deep(.sql-viewer-footer) {
  height: 48px;
  overflow: auto;
  align-items: center;
  padding: 6px 0 6px 20px;
}

.sql-query-action {
  margin: 4px;
}

:deep(.sql-query-footer) {
  height: 48px;
  overflow: auto;
  padding: 2px 0 2px 20px;
}

.sql-query-btn {
  margin: 4px;
}

.sql-viewer__sql-input {
  font-family: var(--el-font-family-monospace, SFMono-Regular, Menlo, Monaco,
      Consolas, 'Liberation Mono', 'Courier New', monospace);
}

.sql-viewer__detail {
  max-height: 260px;
  overflow: auto;
}

.sql-viewer__detail--empty {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.detail-section {
  margin-bottom: 12px;
}

.detail-label {
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.detail-label.is-active {
  color: var(--el-color-primary);
}

.detail-content {
  font-size: 13px;
  border: solid 1px;
  box-shadow: 0 2px 8px var(--el-text-color-secondary);
  &:hover {
    box-shadow: 0 6px 12px var(--el-color-primary);
    transition: all 0.2s ease;
  }
}

.detail-content--scroll {
  max-height: 120px;
  overflow-y: auto;
  padding: 6px 8px;
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.expand-cell {
  display: -webkit-box;
  line-clamp: 2; /* 兼容标准属性 */
  -webkit-line-clamp: 2; /* 限制显示行数 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 2; /* 行高，可根据需求调整 */
  max-height: 4em; /* 2行 * 1.5行高 = 3em */
  transition: all 0.2s ease; /* 过渡动画，提升体验 */
  white-space: normal;
  word-break: break-word;
}

/* 展开状态：显示完整内容 */
.expand-cell.expanded {
  line-clamp: unset; /* 兼容标准属性 */
  -webkit-line-clamp: unset; /* 取消行数限制 */
  max-height: none; /* 取消高度限制 */
  white-space: pre-wrap;
}

.conversations-trigger {
  display: flex;
  font-weight: 700;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(179, 180, 179, 0.8);
  &:hover {
    width: 28px;
    height: 28px;
    box-shadow: 0 6px 8px rgba(68, 186, 130, 0.55);
    transition: all 0.2s ease;
  }
}

.dialog-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 120px);
  gap: 16px;
}


.dialog-media {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  height: calc(100vh - 120px);
  gap: 12px;
  overflow: auto;
}

.dialog-left__image {
  width: 48vh;
  height: 48vh;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.dialog-left__image--fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.dialog-conversations {
  padding-top: 16px;
  white-space: pre-wrap;
  /* background: #fff; */
  /* border: 1px solid var(--el-border-color-lighter); */
  height: calc(100vh - 120px);
  overflow: auto;
}

.dialog-metadata {
  background-color: var(--el-fill-color-lighter);
  padding-top: 16px;
  height: calc(100vh - 120px);
  overflow: auto;
}

</style>
