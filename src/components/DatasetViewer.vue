<template>
  <el-card shadow="hover" style="width: 100%" footer-class="dataset-viwer-footer">
    <!-- 表格主体区域：占满卡片中间高度，内部滚动 -->
    <div class="dataset-viwer__table-wrapper">
      <el-table
        :data="tableData"
        border
        fit
        lazy
        stripe
        :show-header="hasData"
        highlight-current-row
        :height="height ? height : '100%'"
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
          <div v-else><el-icon class="is-loading" size="large"><Loading /></el-icon> 请不要切换页面，数据正在努力加载中╰(*°▽°*)╯ ...</div>
        </template>
        <el-table-column
          label="media"
          min-width="120"
          v-if="hasMedium"
        >
          <template #header>
            <div class="dataset-viwer__meta-title">media</div>
            <div class="dataset-viwer__meta-sub">list · lengths</div>
            <div class="dataset-viwer__tokens-bar">
              <span v-for="n in 4" :key="n" class="tokens-bar__item" />
            </div>
          </template>
          <template #default="scope">
            <el-row align="middle">
              <el-col :xs="16" :sm="16" :md="16" :lg="18">
                <div v-if="scope.row?.medium && scope.row?.medium?.length" class="expand-cell"
                  :class="{ 'expanded': scope.row?.isExpanded }">
                  <!-- 循环渲染最多 2 个媒体文件 -->
                  <template v-for="(media, idx) in (scope.row?.isExpanded ? scope.row?.medium : scope.row?.medium?.slice(0, 2))" :key="idx">
                    <!-- 图片展示 -->
                    <el-image
                      v-if="scope.row?.mediaType === 'image'"
                      style="width: 48px; height: 48px; margin-right: 4px; cursor: pointer;"
                      :src="media"
                      :initial-index="idx"
                      fit="fill"
                      show-progress
                      :preview-teleported="true"
                      @click.prevent.stop="toggleConversationsExpand(scope.$index, scope.row)"
                    >
                      <template #error>
                        <div>图片加载失败</div>
                      </template>
                    </el-image>

                    <!-- 视频展示 -->
                    <video
                      v-else-if="scope.row?.mediaType === 'video'"
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
                      v-else-if="scope.row?.mediaType === 'audio'"
                      :src="media"
                      controls
                      style="width: 220px; height: 48px; margin-right: 4px; border-radius: 4px;"
                      @click.prevent.stop="toggleConversationsExpand(scope.$index, scope.row)"
                    ></audio>

                  </template>
                </div>
                <div v-else>媒体资源加载失败</div>
              </el-col>
              <el-col :xs="8" :sm="8" :md="8" :lg="6">
                <!-- 显示剩余额外媒体展开按钮 -->
                <div v-if="scope.row?.medium?.length > 2 && !scope.row?.isExpanded" class="medium-more-trigger" @click="toggleExpand(scope.row)" style="cursor: pointer;">
                  展开<el-icon><View /></el-icon>
                </div>
                <div v-else-if="scope.row?.medium?.length > 2" @click="toggleExpand(scope.row)" style="cursor: pointer;">
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
            <div class="dataset-viwer__meta-title">conversations</div>
            <div class="dataset-viwer__meta-sub">list · lengths</div>
            <div class="dataset-viwer__tokens-bar">
              <span v-for="n in 8" :key="n" class="tokens-bar__item" />
            </div>
          </template>
          <template #default="scope">
            <el-row>
              <el-col :xs="22" :sm="22" :md="22" :lg="23">
                <div class="expand-cell"
                @click="toggleExpand(scope.row)"
                :class="{ 'expanded': scope.row?.isExpanded }"
                style="cursor: pointer;">
                  {{ scope.row?.conversations}}
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
            :class="{ 'expanded': scope.row?.isExpanded }"
            style="cursor: pointer;"
          >{{ scope.row[column] }}</div>
        </template>
        </el-table-column>
      </el-table>
    </div>
    <template v-if="hasData" #footer>
      <div class="dataset-viwer__pagination">
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

  <!-- 数据透视弹窗 -->
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
          <div class="dataset-viwer__detail dataset-viwer__detail--empty" v-else>
            点击左侧表格的行或右侧“+”图标，在此查看完整数据详情
          </div>
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, computed, nextTick, watch } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { View, Hide, Loading } from '@element-plus/icons-vue'

// 对外暴露的参数：全量数据
const props = defineProps({
  height: { type: String, default: '100%' },
  allTableData: {
    type: Array,
    default: () => [],
    required: true
  },
  queryLoading: { // 可选：加载状态透传
    type: Boolean,
    default: false
  }
})

// 分页展示数据
const tableData = ref([])
const hasData = computed(() => {
  return !!tableData.value && tableData.value.length > 0
})
const pagination = reactive({
  currentPage: 1,
  pageSizes: [10, 20, 50 ,100],
  pageSize: 20,
  total: 0
})

// 格式化原始数据，统一媒体字段格式，便于前端展示
const formatTableData = (rawData) => {
  return rawData.map((record) => {
    const newRecord = { ...record, isExpanded: false } // 初始化展开状态

    // 优先级：image > video > audio
    if (record.image && record.image.length) {
      newRecord.medium = record.image
      newRecord.mediaType = 'image'
    } else if (record.video && record.video.length) {
      newRecord.medium = record.video
      newRecord.mediaType = 'video'
    } else if (record.audio && record.audio.length) {
      newRecord.medium = record.audio
      newRecord.mediaType = 'audio'
    } else {
      newRecord.medium = []
      newRecord.mediaType = 'none'
    }

    return newRecord
  })
}

// 分页逻辑
const setTableDataByPage = () => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  tableData.value = formatTableData(props.allTableData).slice(startIndex, endIndex)
}

const activeRow = ref(null)
const isDialogOpen = ref(false)
const currentRow = ref(null)
const dialogMediumShown = ref(false)

// 媒体类型相关
const mediumLst = ['image', 'video', 'audio']
const excludeColumns = ['image', 'video', 'audio', 'conversations', 'isExpanded', 'mediaType', 'medium']
const hasMedium = ref(false)
const hasConvs = ref(false)

// 动态列计算
const dynamicColumns = computed(() => {
  hasMedium.value = false
  hasConvs.value = false
  if (tableData.value.length === 0) return []
  const allColumns = Object.keys(tableData.value[0])

  hasMedium.value = mediumLst.some(mediumField => allColumns.includes(mediumField))
  hasConvs.value = allColumns.includes('conversations')

  return allColumns.filter(col => !excludeColumns.includes(col))
})

// 监听外部传入的 allTableData 变化，更新分页数据
watch(() => props.allTableData, (newVal) => {
  pagination.total = newVal.length
  pagination.currentPage = 1
  setTableDataByPage()
}, { immediate: true, deep: true })


// 分页大小变化
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  setTableDataByPage()
}

// 分页页码切换
const handlePageChange = (val) => {
  pagination.currentPage = val
  setTableDataByPage()
}

// 行点击事件
const handleRowClick = (row) => {
  activeRow.value = row
}

// 展开/收起
const toggleExpand = (row) => {
  row.isExpanded = !row.isExpanded
}

// 弹窗相关
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

// 播放音频
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

// 列名格式化
const formatColumnLabel = (column) => {
  return column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
}

// 对外暴露的方法（可选）
defineExpose({
  setTableDataByPage, // 手动触发分页刷新
  toggleConversationsExpand // 手动打开弹窗
})
</script>

<style scoped>
.dataset-viwer__meta-block {
  margin-bottom: 8px;
}

.dataset-viwer__meta-title {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.dataset-viwer__meta-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dataset-viwer__meta-bar-group {
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

.dataset-viwer__meta-block--tokens {
  display: flex;
  flex-direction: column;
}

.dataset-viwer__tokens-bar {
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

.dataset-viwer__table-wrapper {
  min-height: 260px;
  overflow: auto;
}

:deep(.el-table__empty-block) {
  height: 80vh !important;
}

.dataset-viwer__pagination {
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

:deep(.dataset-viwer-footer) {
  height: 48px;
  overflow: auto;
  align-items: center;
  padding: 6px 0 6px 20px;
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
  height: calc(100vh - 120px);
  overflow: auto;
}

.dialog-metadata {
  background-color: var(--el-fill-color-lighter);
  padding-top: 16px;
  height: calc(100vh - 120px);
  overflow: auto;
}

.dataset-viwer__detail {
  max-height: 260px;
  overflow: auto;
}

.dataset-viwer__detail--empty {
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
</style>
