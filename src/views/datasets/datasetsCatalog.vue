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
    </el-col>
    <el-col :xs="14" :sm="16" :lg="18" class="catelog-content-wrapper">
      <!-- 搜索头 -->
      <el-row justify="space-between">
        <el-col :span="12">
          <div class="content-search-container">
            <span class="content-search-label">数据集</span>
            <CountTo class="content-search-count" :start-val="0" :end-val="datasetsList.length" :duration="2500" />
            <el-input class="content-search-input" v-model="filterGroup.name" @input="fetchData" placeholder="按关键字搜索 🔍" clearable ></el-input>
          </div>
        </el-col>
      </el-row>
      <!-- 搜索内容 -->
      <el-row v-loading="catelogContentLoading" element-loading-text="🏃 努力加载中..." justify="space-between" class="catelog-content-container">
        <el-col :span="11" v-for="dataset in datasetsList">
          <el-card shadow="hover" footer-class="dataset-card-footer">
            <template #header>{{ dataset.name }}</template>

            <div><span>Size: </span>{{ dataset.size }}</div>


            <template #footer>
              <span class="dataset-footer-author"><el-icon style="margin-right: 4px;"><User /></el-icon>{{ dataset.registrant }}</span>
              <el-divider direction="vertical"></el-divider>
              <div v-for="(group,idx) in dataset.labels" :key="group.label_name" style="display: inline">
                <el-check-tag
                  class="dataset-footer-tag"
                  :checked="isLabelChecked(group.label_name, val)"
                  v-for="val in group.label_values"
                  :key="val"
                  type="success"
                  @change="handleTagLabel(group, idx)"
                >
                  {{ val }}
                </el-check-tag>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script setup>
import { getDatasetMetadataList } from '@/api/datasetMetadata/index'
import { onMounted, nextTick, ref, reactive } from 'vue'
import { CountTo } from 'vue3-count-to'

onMounted(() => {
    fetchData();
})

const datasetsList = ref([])
const catelogContentLoading = ref(false)

const filterStages = ref(["SFT", "Pretrain"])
const filterLabelsModalities = ref(["🔤 纯文本", "🏞 单图", "🖼️ 多图", "📰 图文交错", "📣 音频", "🎬 视频", "🔗 CoT", "☀️ unknown", "🌟 ALL"])
const filterLabelsTypes = ref(["Caption", "General VQA", "Mathematics", "Chart", "OCR", "Knowledge", "Document", "Grounding", "Science", "Conversation", "Medical", "GUI", "LLM", "☀️ unknown", "🌟 ALL"])
const filterLabelsLanguages = ref(["ZH", "EN", "多语种", "☀️ unknown", "🌟 ALL"])

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

const fetchData = async () => {
  console.log("过滤条件变更", filterGroup)
  try {
    catelogContentLoading.value = true
    await getDatasetMetadataList(filterGroup).then((response) => {
      datasetsList.value = response.data.result
    })
  } catch (err) {

  } finally {
    nextTick(() => {
      catelogContentLoading.value = false
    })
  }
}

const isLabelChecked = (labelName, val) => {
  // 1. 在 filterGroup.labels 中找到对应 label_name 的那一组
  const targetGroup = filterGroup.labels.find(item => item.label_name === labelName);

  // 2. 如果找到了组，并且该组的 label_values 包含当前的 val，则返回 true
  if (targetGroup && targetGroup.label_values) {
    return targetGroup.label_values.includes(val);
  }

  return false;
};


const handleTagLabel = async (group, val) => {
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
  await fetchData()
}

</script>

<style lang="scss" scoped>
.catalog-container {

}
.catelog-filter-wrapper {
  padding: 20px;
  height: calc(100vh - 85px);
  background-color: #fafbfc;
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
    min-width: 50px;       /* 给数字预留宽度，防止数字跳动时影响布局 */
  }

  :deep(.content-search-input) {
    margin-left: 20px;
    flex: 1;
    max-width: 200px;
    transition: all 0.5s ease; /* 这里的 transition 作用于外层容器 */
    border-radius: 4px;        /* 必须加上圆角，否则外层阴影是直角的，很难看 */
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

:deep(.dataset-card-footer) {
  height: 36px;
  padding: 4px 0 4px 20px;
}

.dataset-footer-author {
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

.dataset-footer-tag {
  font-size: 12px;
  margin-right: 5px;
  margin-bottom: 5px
}

.catelog-content-container {
  margin-top: 20px;

  .el-card {
    margin-bottom: 20px;
  }
}

</style>
