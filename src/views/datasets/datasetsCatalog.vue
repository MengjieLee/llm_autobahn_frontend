<template>
  <el-row class="catalog-container">
    <el-col :xs="10" :sm="8" :lg="6" class="catelog-filter-wrapper">
      <!-- 数据阶段 -->
      <el-divider content-position="left"><svg-icon class="filter-title-icon" icon="stage" />数据阶段</el-divider>
      <el-row>
        <el-col>
          <el-checkbox-group v-model="filterGroup.stages" @change="fetchData">
            <el-checkbox-button style="margin: 0 10px 10px 0;" v-for="stage in filterStages" :key="stage" :value="stage">
              {{ stage }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-col>
      </el-row>

      <!-- Labels 数据模态 -->
      <el-divider content-position="left"><svg-icon class="filter-title-icon" icon="modality" />数据模态</el-divider>
      <el-row>
        <el-col>
          <el-checkbox-group size="small" v-model="filterGroup.labels[0].label_values" @change="fetchData">
            <el-checkbox-button style="margin: 0 10px 10px 0;" v-for="modality in filterLabelsModalities" :key="modality" :value="modality">
              {{ modality }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-col>
      </el-row>

      <!-- Labels 数据细分类型 -->
      <el-divider content-position="left"><svg-icon class="filter-title-icon" icon="type" />数据细分类型</el-divider>
      <el-row>
        <el-col>
          <el-checkbox-group size="small" v-model="filterGroup.labels[1].label_values" @change="fetchData">
            <el-checkbox-button style="margin: 0 10px 10px 0;" v-for="type in filterLabelsTypes" :key="type" :value="type">
              {{ type }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-col>
      </el-row>

      <!-- Labels 数据语种 -->
      <el-divider content-position="left"><svg-icon class="filter-title-icon" icon="language" />数据语种</el-divider>
      <el-row>
        <el-col>
          <el-checkbox-group size="small" v-model="filterGroup.labels[2].label_values" @change="fetchData">
            <el-checkbox-button style="margin: 0 10px 10px 0;" v-for="language in filterLabelsLanguages" :key="language" :value="language">
              {{ language }}
            </el-checkbox-button>
          </el-checkbox-group>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <el-divider content-position="left"><svg-icon class="filter-title-icon" icon="pagination" />分页</el-divider>
      <div class="custom-pagination-container">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-sizes="pagination.pageSizes"
          :page-size="pagination.pageSize"
          :default-page-size="pagination.pageSize"
          layout="prev, pager, next, sizes, "
          :total="pagination.total"
          :pager-count="5"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-col>
    <el-col :xs="14" :sm="16" :lg="18" class="catelog-content-wrapper">
      <!-- 搜索头 -->
      <el-affix class="affix-container" :offset="100">
        <el-row justify="space-between">
          <el-col :span="12">
            <div class="content-search-container">
              <span class="content-search-label">数据集</span>
              <CountTo class="content-search-count" :start-val="0" :end-val="allDatasetList.length" :duration="2500" />
              <el-input class="content-search-input" v-model="filterGroup.name" @input="fetchData" placeholder="按关键字搜索 🔍" clearable ></el-input>
            </div>
          </el-col>
        </el-row>
      </el-affix>
      <!-- 数据集列表 -->
      <el-row v-loading="catelogContentLoading" element-loading-text="🏃 努力加载中..." element-loading-custom-class="catelog-content-loading-wrapper" justify="space-between" class="catelog-content-container">
        <el-col :xs="24" :sm="24" :md="24" :lg="11" v-for="dataset in datasetList">
          <div class="dataset-card-wrapper" @mouseleave="hideOverlay(dataset.name)">
            <el-card shadow="hover" @click.stop="toggleOverlay(dataset.name)" class="dataset-card" body-class="dataset-card-body" footer-class="dataset-card-footer">
              <template #default>
                <el-row justify="space-between">
                  <el-col :span="11">
                    <span class="dataset-name-multiline" :title="dataset.name">{{ dataset.name }}</span>
                  </el-col>
                  <el-col :span="11" style="display: flex; justify-content: flex-end;">
                    <span class="dataset-tag"><el-icon style="margin-right: 4px;"><User /></el-icon>{{ dataset.registrant }}</span>
                    <span class="dataset-tag"><el-icon style="margin-right: 4px;"><Clock /></el-icon>{{ formatDate('yyyy-MM-dd hh:mm:ss', dataset.updated_at) }}</span>
                  </el-col>
                </el-row>
              </template>
              <template #footer>
                <el-check-tag
                  v-for="stage in dataset.stages"
                  class="dataset-footer-tags"
                  :checked="isLabelChecked('stages', stage)"
                  :key="stage"
                  type="success"
                  @click.prevent.stop
                  @change="handleTagLabel('stages', filterGroup.stages,stage)"
                >
                  {{ stage }}
                </el-check-tag>
                <el-divider direction="vertical" />
                <el-popover
                  placement="bottom"
                  title="存储信息概览"
                  :width="420"
                  trigger="hover"
                >
                  <template #reference>
                    <el-button size="small" @click.prevent.stop class="m-2"><el-icon ><View /></el-icon>查看存储</el-button>
                  </template>
                  <template #default>
                    <el-row justify="space-between" v-for="(datasetPath, idx) in [dataset.src_paths, dataset.media_root_dir, dataset.converted_paths, dataset.converted_preview_paths]">
                      <el-col :span="4">
                        <el-button text :disabled="isContentEmpty(datasetPath)" @click.prevent="handleClipboard(datasetPath)">
                          <el-icon ><CopyDocument /></el-icon><span>{{ datasetPathLabelMap[idx] }}</span>
                        </el-button>
                      </el-col>
                      <el-col :span="18">
                        <p class="dataset-name-multiline" style="margin: 0 0 15px 0;">{{ datasetPath || '无' }}</p>
                      </el-col>
                    </el-row>
                  </template>
                </el-popover>
                <el-divider direction="vertical" />
                <div v-for="(group,idx) in dataset.labels" :key="group.label_name" style="display: inline">
                  <el-check-tag
                    class="dataset-footer-tags dataset-labels-tag"
                    :checked="isLabelChecked(group.label_name, val)"
                    v-for="val in group.label_values"
                    :key="val"
                    type="success"
                    @click.prevent.stop
                    @change="handleTagLabel('labels', group, val)"
                  >
                    {{ val }}
                  </el-check-tag>
                  <!-- <el-divider v-if="idx !== dataset.labels.length - 1" direction="vertical" /> -->
                </div>
              </template>
            </el-card>
            <div class="dataset-card-overlay" :class="{ 'visible': overlayVisible[dataset.name] }" @click.stop="toggleOverlay(dataset.name)">
              <div class="overlay-buttons">
                <el-button type="primary" size="large" @click.stop="handleQuickVisualization(dataset)">
                  <el-icon><View /></el-icon>
                  快速可视化
                </el-button>
                <el-button v-if="dataset.tables && Array.isArray(dataset.tables) && dataset.tables.length > 0" type="success" size="large" @click.stop="handleAnalysis(dataset)">
                  <el-icon><DataAnalysis /></el-icon>
                  SQL 分析
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script setup>
import { getDatasetMetadataList } from '@/api/datasetMetadata/index'
import { onMounted, nextTick, ref, reactive } from 'vue'
import { CountTo } from 'vue3-count-to'
import { formatDate } from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import { copyText } from '@/utils'

const allDatasetList = ref([]) // 全量数据
const datasetList = ref([]) // 分页展示数据
const route = useRoute();
const router = useRouter()
const overlayVisible = ref({}) // 记录每个数据集遮罩的显示状态

const filterGroup = reactive({
  name: "",
  stages: ["SFT", "Pretrain"],
  labels: [
    {
      label_name: "数据模态",
      label_values: []
    },
    {
      label_name: "数据细分类型",
      label_values: []
    },
    {
        label_name: "language",
        label_values: []
    }
  ]
})

onMounted(async () => {
  try {
    // 1. 核心修复：获取 URL 中的 query 参数（解构+默认值，避免 undefined）
    const { query } = route;
    // 遍历 query 对象，找到唯一的筛选字段（stage/modality/type/language）
    const [queryParamField, queryParamValue] = Object.entries(query).find(([key]) =>
      ['stage', 'modality', 'type', 'language'].includes(key)
    ) || [];

    // 2. 字段映射与筛选条件赋值（修复判断逻辑+reactive 赋值规范）
    const fieldMap = ["modality", "type", "language"];
    if (queryParamField && queryParamValue) { // 先校验参数存在
      // 处理 labels 类字段（modality/type/language）
      console.log("labelsIdx", queryParamField)
      if (fieldMap.includes(queryParamField)) {
        const labelIndex = fieldMap.indexOf(queryParamField);
        // 确保下标有效，避免越界赋值
        if (labelIndex >= 0 && labelIndex < filterGroup.labels.length) {
          // Vue3 reactive 数组/对象赋值规范
          filterGroup.labels[labelIndex].label_values = [queryParamValue];
        }
      }
      // 处理 stage 字段
      else if (queryParamField === 'stage') {
        // 修复：原代码错误赋值给 queryParam，实际应赋值给 stages
        filterGroup.stages = [queryParamValue];
      }
    }

    // 3. 修复：先加载数据，再清空 query（避免数据还没加载就丢参数）
    await fetchData();

  } catch (err) {
    console.error("onMounted 加载筛选条件失败:", err);
  } finally {
    // 4. 修复：路由替换时保留原始 path，仅清空 query
    router.replace({
      path: route.path,
      query: {} // 清空 URL 中的筛选参数，避免刷新重复解析
    });
  }
})

const pagination = reactive({
  currentPage: 1,
  pageSizes: [10, 20, 50 ,100],
  pageSize: 20,
  total: 0
})

// 实现分页大小变化事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  setDatasetListByPage()
}

// 实现分页页码切换事件
const handlePageChange = (val) => {
  pagination.currentPage = val
  setDatasetListByPage()
}

const setDatasetListByPage = () => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  datasetList.value = allDatasetList.value.slice(startIndex, endIndex)
}

const datasetPathLabelMap = ref(["源址：", "媒体：", "索引：", "预览："])
const catelogContentLoading = ref(false)

const filterStages = ref(["SFT", "Pretrain"])
const filterLabelsModalities = ref(["🔤 纯文本", "🏞 单图", "🖼️ 多图", "📰 图文交错", "📣 音频", "🎬 视频", "🔗 CoT", "☀️ unknown", "🌟 ALL"])
const filterLabelsTypes = ref(["OCR", "Mathematics", "Caption", "Document", "Grounding", "General VQA", "Chart", "GUI", "LLM", "text", "☀️ unknown", "stem", "VQA", "🌟 ALL", "Knowledge", "interleave", "多图", "Science", "Conversation", "Medical"])
const filterLabelsLanguages = ref(["ZH", "EN", "多语种", "☀️ unknown", "🌟 ALL"])


const isContentEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (Array.isArray(val)) return val.length === 0;
  return false;
};

const handleClipboard = (text) => {
  if (!text) {
    ElMessage.closeAll();
		ElMessage({
			message: '无内容!',
			type: 'warning',
			duration: 2 * 1000,
    })
    return
  }
	copyText(text, () => {
    ElMessage.closeAll();
		ElMessage({
			message: 'Copied!',
			type: 'success',
			duration: 2 * 1000,
    })
	})
}

const initDatasetList = () => {
  pagination.total = 0
  datasetList.value = []
  allDatasetList.value = []
}

const fetchData = async () => {
  console.log("过滤条件变更", filterGroup)
  try {
    catelogContentLoading.value = true
    initDatasetList()
    await getDatasetMetadataList(filterGroup).then((response) => {
      allDatasetList.value = response.data.result
    })
    pagination.total = allDatasetList.value.length
    pagination.currentPage = 1
    setDatasetListByPage()
  } catch (err) {
    console.error('数据集目录查询请求失败：', err)
    initDatasetList()
    ElNotification({
      title: '数据集目录查询请求失败：',
      message: `失败原因：${err.message || '网络异常或接口错误'}`,
      type: 'error',
      duration: 0,
    })
  } finally {
    nextTick(() => {
      catelogContentLoading.value = false
    })
  }
}

const isLabelChecked = (labelName, val) => {
  if (labelName === 'stages') {
    return filterGroup.stages.includes(val)
  }
  // 1. 在 filterGroup.labels 中找到对应 label_name 的那一组
  const targetGroup = filterGroup.labels.find(item => item.label_name === labelName);

  // 2. 如果找到了组，并且该组的 label_values 包含当前的 val，则返回 true
  if (targetGroup && targetGroup.label_values) {
    return targetGroup.label_values.includes(val);
  }

  return false;
};


const handleTagLabel = async (field, group, val) => {
  if (field === 'stages') {
    const index = filterGroup.stages.indexOf(val)
    if (index > -1) {
      // 如果已存在，则移除（取消选中）
      filterGroup.stages.splice(index, 1);
    } else {
      // 如果不存在，则添加（选中）
      targetGroup.stages.push(val);
    }
  } else {
    const targetGroup = filterGroup.labels.find(item => item.label_name === group.label_name);
    if (targetGroup) {
      const index = targetGroup.label_values.indexOf(val);
      if (index > -1) {
        // 如果已存在，则移除（取消选中）
        targetGroup.label_values.splice(index, 1);
      } else {
        // 如果不存在，则添加（选中）
        targetGroup.label_values.push(val);
      }
    }
  }
  await fetchData()
}

const handleDatasetCardClicked = async (name) => {
  router.push({ path: '/datasets/detail', query: { name: name } })
}

const toggleOverlay = (datasetName) => {
  overlayVisible.value[datasetName] = !overlayVisible.value[datasetName]
}

const hideOverlay = (datasetName) => {
  overlayVisible.value[datasetName] = false
}

const handleQuickVisualization = (dataset) => {
  overlayVisible.value[dataset.name] = false // 关闭遮罩
  router.push({ path: '/datasets/detail', query: { name: dataset.name } })
}

const handleAnalysis = (dataset) => {
  overlayVisible.value[dataset.name] = false // 关闭遮罩
  router.push({ path: '/sqlStudio/sqlViewer', query: { name: dataset.name } })
}

</script>

<style lang="scss" scoped>
.catalog-container {

}
.catelog-filter-wrapper {
  padding: 20px;
  height: calc(100vh - 85px);
  background-color: var(--el-fill-color-extra-light);
  overflow: auto;
}
.catelog-content-wrapper {
  padding: 20px;
  height: calc(100vh - 85px);
  background-color: var(--el-bg-color);
  overflow: auto;
}
.filter-title-icon {
  font-size: 20px;
  margin-right: 8px;
}

.content-search-container {
  padding: 10px 0 10px 0;
  display: flex;          /* 启用 Flex 布局 */
  align-items: center;    /* 垂直居中 */
  gap: 12px;              /* 元素之间的间距 */
  width: 100%;

  .content-search-label {
    font-size: 24px;
    white-space: nowrap;    /* 防止文字换行 */
  }

  :deep(.content-search-count) {
    color: #99a0ae;
    font-weight: bold;
    font-size: 24px;
    min-width: 50px;       /* 给数字预留宽度，防止数字跳动时影响布局 */
  }

  :deep(.content-search-input) {
    margin-left: 20px;
    flex: 1;
    max-width: 200px;
    border-radius: 4px;
    transition: all 0.5s ease;
    box-shadow: 0 8px 14px 4px var(--el-border-color) !important;

    &:hover {
      /* 悬浮时只针对外层容器添加阴影 */
      box-shadow: 5px 5px 18px 2px var(--el-color-primary) !important;

      /* 关键：重置内部 wrapper 的 hover 效果，防止干扰 */
      .el-input__wrapper {
        /* 如果你不想让内部框体变色，可以把颜色锁定 */
        /* transition: none; */

        &:hover {
          /* 让内部 wrapper 的阴影失效，只保留外层的大阴影 */
          box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
        }
      }
    }
  }
}

.dataset-card {
  border-radius: 4px;
  box-shadow: 0 2px 10px 2px var(--el-border-color) !important;
  &:hover {
    cursor: pointer;
    .dataset-name-multiline {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    box-shadow: 5px 5px 18px 2px var(--el-color-primary) !important;
  }
}

.dataset-card-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.dataset-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
  cursor: pointer;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .overlay-buttons {
    display: flex;
    flex-direction: row;
    gap: 16px;
    z-index: 11;

    .el-button {
      padding: 15px 30px;
      font-size: 16px;
      border-radius: 8px;
      min-width: 180px;
    }
  }
}

:deep(.dataset-card-body) {
  padding: 12px 20px;
}

:deep(.dataset-card-footer) {
  height: 36px;
  padding: 4px 0 4px 20px;
  overflow: auto;
}

.dataset-name-multiline {
  /* 必须使用 flex 或 block 布局 */
  display: -webkit-box;

  /* 关键：设置排列方向为垂直 */
  -webkit-box-orient: vertical;

  /* 关键：设置显示的行数 */
  -webkit-line-clamp: 2;

  /* 溢出隐藏 */
  overflow: hidden;

  /* 确保文字在必要时换行 */
  word-break: break-all;

  /* 商业工整：设置合适的小标题行高，增加阅读感 */
  line-height: 1;
  min-height: 1em; /* 可选：固定两行高度，保持卡片整齐 */
}

.dataset-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  color: var(--el-text-color-secondary);
}

.dataset-footer-tags {
  display: inline-flex;
  align-items: center;

  /* 商业工整配色：浅灰底 + 中灰字 */
  background-color: var(--el-fill-color-light); /* 或使用 #f2f3f5 */
  color: var(--el-text-color-secondary);      /* 或使用 #606266 */

  /* 字体细节 */
  font-size: 12px;
  font-weight: 500;
  line-height: 1;

  /* 呼吸感：上下 4px，左右 8px */
  padding: 4px 8px;

  /* 细节修饰 */
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter); /* 极浅边框增加精致感 */

  /* 交互 */
  user-select: none;
  transition: all 0.2s;
  &:hover {
    background-color: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }
}

.dataset-labels-tag {
  margin-right: 10px;
}

.catelog-content-container {
  margin-top: 20px;
}

.affix-container {
  :deep(.el-affix--fixed) {
    border-radius: 4px;
    padding: auto;
    background: #99a0ae9b;
    .content-search-label {
      color: var(--el-text-color-primary);
    }
    .content-search-count {
      color: var(--el-text-color-primary);
    }
  }
}

:deep(.catelog-content-loading-wrapper) {
  .el-loading-spinner {
    /* 1. 撤销默认的 50% 居中偏移 */
    top: 0 !important;
    margin-top: 0 !important;

    /* 2. 设为固定或绝对定位在顶部 */
    position: absolute;
    padding-top: 20px; /* 距离容器顶部的间距 */

    /* 3. 如果希望在滚动时也悬浮在屏幕顶部（吸顶效果） */
    position: sticky;
    top: 120px;
  }
}

.custom-pagination-container :deep(.el-pagination) {
  display: flex;
  flex-wrap: wrap;     /* 允许换行 */
  row-gap: 12px;       /* 行间距 */
}

/* 强制让 sizes 后面的元素换行 */
/* 在 Element Plus 中，sizes 对应的是 .el-pagination__sizes */
.custom-pagination-container :deep(.el-pagination__jump) {
  margin-right: auto;  /* 将 total 和 sizes 靠左，或者根据需要调整 */
}

.custom-pagination-container :deep(.el-pagination__sizes) {
  margin-left: 0px;
}

</style>
