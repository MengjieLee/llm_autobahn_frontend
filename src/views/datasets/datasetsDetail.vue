<template>
  <div v-if="!datasetName">
    <el-empty description="未指定数据集，请前往<数据集-目录>页查阅 ╰(*°▽°*)╯">
      <el-button type="primary" @click="redirectToDatasetCatalog">前往数据集-目录</el-button>
    </el-empty>
  </div>

  <div v-else v-loading="queryLoading">
    <!-- 数据元数据 -->
    <div class="detail-header-container">
      <el-row>
        <el-col><div class="dataset-meta-name">【Mock 开发中】{{ datasetMeta.name }}</div></el-col>
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
    <!-- 数据可视内容 -->
    <div class="detail-content-container">
      <el-row>
        <el-col class="splits-wrapper">
          <div v-if="datasetSplitLenght > 0" class="splits-label">Splits ({{ datasetSplitLenght }}):</div>
          <el-select v-model="datasetSplit" placeholder="请选择分片" style="width: 240px">
            <el-option
              v-for="(data, key) in datasetMeta.splits"
              :key="key"
              :label="key"
              :value="key"
            />
          </el-select>
        </el-col>
        <el-col>
          <DatasetViewer
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

const route = useRoute()
const router = useRouter()

// --- 状态定义 ---
const datasetName = ref("")
const datasetSplit = ref("")
const datasetSplitLenght = ref(0)
const datasetMeta = ref({ splits: {} })
const queryLoading = ref(false)
const datasetPathLabelMap = ref(["源址：", "媒体：", "索引：", "预览："])

const allTableData = ref([])    // 当前选中 Split 的全量数据

const fetchData = async () => {
  if (!datasetName.value) return

  try {
    queryLoading.value = true
    // 模拟接口请求
    // const res = await api.getDatasetDetail(datasetName.value)
    const res = {
      "name": "VideoChat2-IT",
      "source": "https://huggingface.co/datasets/OpenGVLab/VideoChat2-IT",
      "is_open_source": true,
      "size": "{'train-formatted': 670029}",
      "count": null,
      "src_paths": [
          "/mnt/cfs_bj/dataset/multi_modal/video/VideoChat2-IT"
      ],
      "src_volume_paths": [
          "/Volumes/qianfan_bos_catalog/all_data/VideoChat2-IT"
      ],
      "converted_paths": [
          "bos://llm-data-process/mnt/cfs_bj/dataset/multi_modal/video/VideoChat2-IT-formatted/train-formatted.jsonl"
      ],
      "converted_preview_paths": [
          "/mnt/cfs_bj_mt/datasets/data_platform/preview/sft/VideoChat2_IT/train-formatted_preview.jsonl"
      ],
      "media_root_dir": "bos://llm-data-process/dataset/medias/video",
      "stages": [
          "SFT"
      ],
      "parent_id": null,
      "process_note": "",
      "tags": [
          "InternVL2.5 开源sft数据；多轮对话"
      ],
      "labels": [
          {
              "label_name": "数据模态",
              "label_values": [
                  "🎬 视频"
              ]
          },
          {
              "label_name": "数据细分类型",
              "label_values": [
                  "General VQA"
              ]
          },
          {
              "label_name": "language",
              "label_values": [
                  "EN"
              ]
          }
      ],
      "registrant": "陈捷挺",
      "tables": [
          "videochat2_it_v0"
      ],
      "tokens": null,
      "groups": [
          "official",
          "group_a"
      ],
      "created_at": "2025-06-05T23:16:50.685000",
      "updated_at": "2025-10-10T13:56:57.956000",
      "splits": {
        "train-formatted_preview_2": [
          {"id": "next_qa-3441910437", "video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "relative_video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "conversations": [{"from": "human", "value": "<video>\nKeep in mind the causal and temporal aspects of the actions while watching the video, then determine the most accurate choice."}, {"from": "gpt", "value": "Answer: (D) ducked."}], "absolute_videos": ["/mnt/cfs_bj/dataset/multi_modal/video/Next-QA/NExTVideo/1203/3441910437.mp4"]},
          {"id": "next_qa-3441910437", "video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "relative_video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "conversations": [{"from": "human", "value": "<video>\nKeep in mind the causal and temporal aspects of the actions while watching the video, then determine the most accurate choice."}, {"from": "gpt", "value": "Answer: (D) ducked."}], "absolute_videos": ["/mnt/cfs_bj/dataset/multi_modal/video/Next-QA/NExTVideo/1203/3441910437.mp4"]},
        ],
        "test-formatted_preview_3": [
          {"id": "next_qa-3441910437", "video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "relative_video": ["Next-QA/NExTVideo/1203/3441910437.mp4"], "conversations": [{"from": "human", "value": "<video>\nKeep in mind the causal and temporal aspects of the actions while watching the video, then determine the most accurate choice."}, {"from": "gpt", "value": "Answer: (D) ducked."}], "absolute_videos": ["/mnt/cfs_bj/dataset/multi_modal/video/Next-QA/NExTVideo/1203/3441910437.mp4"]},
        ]
      }
    }
    datasetMeta.value = res
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

// --- 生命周期 ---
onMounted(() => {
  const name = route.query.name
  if (name) {
    datasetName.value = name
    fetchData()
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

.detail-content-container {
  padding: 10px 20px 20px 20px;
  height: calc(75vh);
  overflow: auto;

  .splits-wrapper{
    margin-bottom: 20px;
    .splits-label {
      margin-bottom: 10px;
      color: #99a0ae;
    }
  }
}


</style>
