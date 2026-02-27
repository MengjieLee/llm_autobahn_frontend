<template>
  <div v-if="!hasData">
    <el-empty>
      <template #description>
        <p style="display: flex; justify-content: center; margin: 10px 0;">
          <span>方式一：未指定数据集，请前往页面</span>
          <el-link type="primary" @click="redirectToDatasetCatalog">数据集-目录</el-link>
          <span>查阅 ╰(*°▽°*)╯"</span>
        </p>
        <el-row justify="space-between" style="display: flex; align-items: center;">
          <el-col :span="21" >
            <el-input type="textarea" placeholder="方式二：快速查阅预览文件 Preview 地址（每行一个）" v-model="previewPaths"></el-input>
          </el-col>
          <el-col :span="2">
            <el-button @click="onlyPreviewHandler" icon="search" type="primary" circle plain />
          </el-col>
        </el-row>
      </template>
    </el-empty>
  </div>

  <div v-else v-loading="queryLoading" element-loading-text="🏃 努力加载中..." >
    <!-- 数据元数据 -->
    <div v-if="!isOnlyPreview" class="detail-header-container">
      <el-row>
        <el-col><div class="dataset-meta-name">{{ datasetMeta.name }}</div></el-col>
        <el-col v-if="datasetMeta.source">
          <div class="dataset-meta-source"><span>来源: </span>{{ datasetMeta.source }}</div>
        </el-col>
        <el-col>
          <el-tag
            v-for="val in [datasetMeta.is_open_source]"
            class="dataset-meta-tag"
            :key="val"
            type="info"
            @click.prevent.stop
          >
            <span>数据协议：</span>{{ isOSSFormat(val) }}
          </el-tag>
          <el-tag
            class="dataset-meta-tag"
            type="info"
            @click.prevent.stop
          >
            <span>Size（rows）：</span>{{ datasetMeta.size }}
          </el-tag>
          <el-tag
            class="dataset-meta-tag"
            :key="datasetMeta.registrant"
            type="info"
            @click.prevent.stop
          >
            <el-icon style="display: inline-block; margin-right: 4px;"><User /></el-icon> {{ datasetMeta.registrant }} 提供
          </el-tag>
          <el-tag
            class="dataset-meta-tag"
            :key="datasetMeta.updated_at"
            type="info"
            @click.prevent.stop
          >
            <span>更新于：</span>{{ formatDate('yyyy-MM-dd hh:mm:ss', datasetMeta.updated_at) }}
          </el-tag>
          <el-divider direction="vertical" />
          <el-popover
            placement="right"
            title="存储信息概览"
            :width="500"
            trigger="hover"
          >
            <template #reference>
              <el-button size="small" @click.prevent.stop class="m-2" type="success" plain><el-icon ><View /></el-icon>查看存储</el-button>
            </template>
            <template #default>
              <el-row justify="space-between" v-for="(datasetPath, idx) in [datasetMeta.src_paths, datasetMeta.media_root_dir, datasetMeta.converted_paths, datasetMeta.converted_preview_paths]">
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
        </el-col>
        <el-col>
          <el-tag
            v-for="stage in datasetMeta.stages"
            class="dataset-meta-click-tag"
            :key="stage"
            type="primary"
            @click.prevent.stop="redirectToDatasetCatalog('stage', [stage])"
          >
            {{ stage }}
          </el-tag>
          <div v-for="(group,idx) in datasetMeta.labels" :key="group.label_name" style="display: inline">
            <el-tag
              class="dataset-meta-click-tag"
              v-for="val in group.label_values"
              :key="val"
              type="primary"
              @click.prevent.stop="redirectToDatasetCatalog('labels', [idx, val])"
            >
              {{ val }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </div>
    <!-- 只查阅 Preview 专用 -->
    <div v-if="isOnlyPreview" style="padding: 0 20px">
      <p>快速查阅预览文件</p>
      <p>
        <el-input type="textarea" placeholder="快速查阅预览文件 Preview 地址（每行一个）" v-model="previewPaths" @change="onlyPreviewHandler"></el-input>
      </p>
    </div>
    <!-- 数据可视内容 -->
    <div>
      <el-row>
        <el-col class="splits-wrapper">
          <div v-if="datasetSplitLenght > 0" class="splits-label">
            <el-popover
              content="预览条目数至多 100 条。"
              placement="top"
              width="200"
            >
              <template #reference>
                <el-icon><InfoFilled /></el-icon>
              </template>
            </el-popover>
            Preview Splits ({{ datasetSplitLenght }}):
          </div>
          <el-select v-model="datasetSplit" placeholder="请选择分片" style="width: 240px">
            <el-option
              v-for="(data, key) in datasetMeta.splits"
              :key="key"
              :label="key"
              :value="key"
            />
          </el-select>
        </el-col>
        <el-col class="detail-content-container">
          <DatasetViewer
            height="56vh"
            :all-table-data="allTableData"
            :query-loading="queryLoading"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DatasetViewer from '@/components/DatasetViewer.vue'
import { formatDate, copyText } from '@/utils'
import { getDatasetDetail, getDatasetPreview } from '@/api/datasetMetadata'

const route = useRoute()
const router = useRouter()

// --- 状态定义 ---
const datasetName = ref("")
const datasetSplit = ref("")
const datasetSplitLenght = ref(0)
const datasetMeta = ref({ splits: {} })
const hasData = ref(false)
const previewPaths = ref("")
const isOnlyPreview = ref(false)
const queryLoading = ref(false)
const datasetPathLabelMap = ref(["源址：", "媒体：", "索引：", "预览："])

const allTableData = ref([])    // 当前选中 Split 的全量数据

const fetchData = async () => {
  if (!datasetName.value) return

  try {
    queryLoading.value = true
    const res = await getDatasetDetail({name: datasetName.value})
    datasetMeta.value = res.data
    ElMessage.success('数据集详情请求成功')
  } catch (err) {
    console.log(err)
    ElMessage.error('获取数据集详情失败')
  } finally {
    queryLoading.value = false
  }
}

const isOSSFormat = (val) => {
  return val ? '开源' : '非开源'
}

watch(() => datasetMeta.value.splits, (newSplits) => {
  const keys = Object.keys(newSplits || {})
  datasetSplitLenght.value = keys.length
  if (datasetSplitLenght.value > 0) {
    datasetSplit.value = keys[0]
  }
}, { deep: true })

watch(datasetSplit, (newSplit) => {
  if (newSplit && datasetMeta.value.splits[newSplit]) {
    allTableData.value = datasetMeta.value.splits[newSplit]
    hasData.value = true
  }
})

const isContentEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (Array.isArray(val)) return val.length === 0;
  return false;
};

const redirectToDatasetCatalog = (field, vals) => {
  let queryParams = {};
  if (field === 'stage') {
    queryParams = { stage: vals[0] };
  } else if (field === 'labels') {
    if (Array.isArray(vals) && vals.length >= 2) {
      const fieldMap = ["modality", "type", "language"];
      const targetKey = fieldMap[vals[0]];
      if (targetKey) {
        queryParams = { [targetKey]: vals[1] };
      }
    }
  }
  router.push({
    path: '/datasets/catalog',
    query: queryParams
  });
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

const onlyPreviewHandler = async () => {
  if (!previewPaths.value) return

  const pathList = previewPaths.value
    .split('\n') // 按换行符分割成数组
    .map(path => path.trim()) // 去除每个元素的首尾空格
    .filter(path => path) // 过滤掉空字符串（空行）

  // 如果分割后没有有效路径，直接提示并返回
  if (pathList.length === 0) {
    ElMessage.warning('请输入有效的预览文件地址')
    return
  }

  isOnlyPreview.value = true
  hasData.value = true
  queryLoading.value = true
  try {
    const res = await getDatasetPreview({paths: pathList})
    datasetMeta.value = res.data
    ElMessage.success('数据可视化请求成功')
  } catch (err) {
    console.log(err)
    ElMessage.error('数据可视化请求失败')
  } finally {
    queryLoading.value = false
  }
}

// --- 生命周期 ---
onMounted(() => {
  const name = route.query.name
  if (name) {
    datasetName.value = name
    hasData.value = true
    fetchData()
    router.replace({
      path: route.path,
      query: {} // 清空 URL 中的筛选参数，避免刷新重复解析
    });
  }
})
</script>

<style lang="scss" scoped>

.detail-header-container {
  height: calc(15vh);
  background-color: var(--el-fill-color-extra-light);
  padding: 20px;
  overflow: auto;

  .dataset-meta-source {
    color: #99a0ae;
    margin-bottom: 5px;
  }

  .dataset-meta-name {
    font-weight: 700;
    margin-bottom: 10px;
  }

  .dataset-meta-tag {
    color: #000;
    border: 0;
    background-color: #fff;
    margin: 0 10px 5px 0;
  }

  .dataset-meta-click-tag {
    margin: 0 10px 5px 0;
    border: 0;
    &:hover {
      cursor: pointer;
    }
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
}

.splits-wrapper{
  padding: 10px 20px 0px 20px;
  margin-bottom: 20px;
  .splits-label {
    margin-bottom: 10px;
    color: #99a0ae;
  }
}

.detail-content-container {
  height: calc(65vh);
  overflow: auto;
}

</style>
