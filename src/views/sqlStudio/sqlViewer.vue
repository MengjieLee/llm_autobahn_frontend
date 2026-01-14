<template>
  <el-row :gutter="16" class="sql-viewer__body">
    <!-- 左侧：数据预览表格 + 分页 -->
    <el-col :xs="14" :sm="14" :md="16" :lg="18" class="sql-viewer__left">
      <el-card header="SQL Viewer【🚧 TODO 先 mock 实现布局，真实数据需要重写 Doris 服务】" shadow="hover" style="width: 100%" footer-class="sql-viewer-footer">
        <!-- 表格主体区域：占满卡片中间高度，内部滚动 -->
        <div class="sql-viewer__table-wrapper">
          <el-table
            :data="tableData"
            border
            fit
            stripe
            highlight-current-row
            height="100%"
            size="small"
            @row-click="handleRowClick"
          >
            <!-- <el-table-column
              type="index"
              label="#"
              width="60"
              align="center"
            /> -->
            <el-table-column
              prop="imageSummary"
              label="images"
              min-width="120"
              class-name="expand-cell-col"
            >
              <template #header>
              <div class="sql-viewer__meta-title">images</div>
              <div class="sql-viewer__meta-sub">list · lengths</div>
              <div class="sql-viewer__tokens-bar">
                <span v-for="n in 4" :key="n" class="tokens-bar__item" />
              </div>
              </template>
              <template #default="scope">
                <el-row align="middle">
                  <el-col :xs="16" :sm="16" :md="16" :lg="18">
                    <div v-if="scope.row.images && scope.row.images.length" class="expand-cell"
                      :class="{ 'expanded': scope.row.isExpanded }">
                      <!-- 循环渲染最多 3 张图片 -->
                      <el-image
                        v-for="(img, index) in (scope.row.isExpanded ? scope.row.images : scope.row.images.slice(0, 3))"
                        :key="index"
                        style="width: 36px; height: 36px; margin-right: 4px"
                        :src="img"
                        :preview-src-list="scope.row.images"
                        :initial-index="index"
                        fit="fill"
                        show-progress
                        :preview-teleported="true"
                      >
                        <!-- 图片加载失败占位 -->
                        <template #error>
                          <div class="image-thumb">加载失败</div>
                        </template>
                      </el-image>
                    </div>
                    <div v-else class="image-thumb" />
                  </el-col>
                  <el-col :xs="8" :sm="8" :md="8" :lg="6">
                    <!-- 显示剩余额外媒体展开按钮 -->
                    <div v-if="scope.row.images.length > 3 && !scope.row.isExpanded" class="medium-more-trigger" @click="toggleExpand(scope.row)" style="cursor: pointer;">
                      展开<el-icon><View /></el-icon>
                    </div>
                    <div v-else-if="scope.row.images.length > 3" @click="toggleExpand(scope.row)" style="cursor: pointer;">
                      收起<el-icon><Hide /></el-icon>
                    </div>
                  </el-col>
                </el-row>
                  
              </template>
            </el-table-column>
            <el-table-column
              min-width="300"
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
          </el-table>
        </div>
        <template #footer>
          <!-- 底部分页，与 HuggingFace SQLStudio 类似的分页控制条 -->
          <div class="sql-viewer__pagination">
            <el-pagination
              background
              layout="prev, pager, next, total"
              :current-page="pagination.page"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              @current-change="handlePageChange"
            />
          </div>
        </template>
      </el-card>
    </el-col>

    <!-- 右侧：SQL 编辑器 + 模板按钮 -->
    <el-col :xs="10" :sm="10" :md="8" :lg="6" class="sql-viewer__right">
      <el-card header="SQL 查询" shadow="hover" style="width: 100%" footer-class="sql-query-footer">
        <!-- SQL 编辑区域 -->
        <div class="sql-viewer__sql-panel">
          <el-input
            v-model="sql"
            type="textarea"
            class="sql-viewer__sql-input"
            :rows="10"
            resize="none"
            placeholder="在此编写 SQL，例如：SELECT * FROM dataset LIMIT 10;"
          />

          <div class="sql-viewer__sql-footer">
            <div class="sql-viewer__sql-footer-left">
              
            </div>
          </div>
        </div>

        <!-- 行详情展示区域：对应左侧表格中选中的记录 -->
        <el-divider content-position="left">猜你想用</el-divider>
        <div class="sql-viewer__sql-toolbar">
          <div class="sql-query-actions">
            <el-button class="sql-query-action" size="small" @click="applySQLTemplate('limit')">
              limit 查询
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
          <el-button class="sql-query-btn"  type="primary" @click="runSql">
            执行 SQL
          </el-button>
          <el-button class="sql-query-btn" type="success" @click="exportResult">
            导出至文件
          </el-button>
          <el-button class="sql-query-btn" type="danger" @click="clearSql">
            清空
          </el-button>
        </template>
      </el-card>
    </el-col>
  </el-row>

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
          <el-divider content-position="left">媒体视图</el-divider>
          <div class="dialog-media">
            <el-image
              v-for="(img, index) in currentRow.images"
              :key="index"
              class="dialog-left__image"
              :src="img"
              :preview-src-list="currentRow.images"
              :initial-index="index"
              fit="scale-down"
              show-progress
            >
              <template #error>
                <div class="dialog-left__image--fallback">加载失败</div>
              </template>
            </el-image>
          </div>
        </el-col>
        <el-col :xs="dialogMediumShown ? 12:20" :sm="dialogMediumShown ? 12:20" :md="dialogMediumShown ? 12:20" :lg="dialogMediumShown ? 14:20">
          <el-divider content-position="left">JSON 视图</el-divider>
          <vue-json-pretty
            class="dialog-conversations"
            :data="parsedConversations"
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
                图片预览
              </div>
              <div class="detail-images">
                <el-image
                  v-for="(img, index) in (currentRow.images)"
                  :key="index"
                  style="width: 36px; height: 36px; margin-right: 4px"
                  :src="img"
                  :preview-src-list="currentRow.images"
                  :initial-index="index"
                  fit="fill"
                  show-progress
                >
                  <!-- 图片加载失败占位 -->
                  <template #error>
                    <div class="image-thumb">加载失败</div>
                  </template>
                </el-image>
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
            <div class="detail-section">
              <div class="detail-label">Tokens</div>
              <div class="detail-content">
                {{ currentRow.tokens }}
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
import { reactive, ref, computed } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

// 示例数据，仅用于展示布局效果。后续可替换为真实接口数据。
const tableData = ref([
  {
    id: 1,
    images: [
      'https://dummyimage.com/600x400/17deaa/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/44ff44/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/17deaa/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/44ff44/ffffff.png&text=Data+Autobahn',
    ],
    conversations: "[{'from': 'human', 'value': '<image>\\nWhat is the specialty featured on the Homemade Crab Ramekin menu item?'}, {'from': 'gpt', 'value': 'The Homemade Crab Ramekin is fresh crab bound in a secret cheesy herby sauce, and is ready or customers to bake in the oven.'}, {'from': 'human', 'value': 'How does the Beach Hut Seafood Platter benefit from seasonal availability?'}, {'from': 'gpt', 'value': 'The Shell on Prawns in the Beach Hut Seafood Platter changes to Bembridge prawns if they are in season.'}, {'from': 'human', 'value': 'What are the key components of the Lobster Beach Hut Platter?'}, {'from': 'gpt', 'value': 'valortance of nutrition education.'}, {'from': 'human', 'value': 'According[0/1803]text, what role does nutrition play in critical care?'}, {'from': 'gpt', 'value': 'According to the text, nutrition plays a significant role in critical care by improving clinical outcomes such as reducing infectious complications and hospital length of stay. It is also mentioned that malnutrition in all its forms during crises and among adolescents is a critical issue that needs attention.'}, {'from': 'human', 'value': 'What is one recommended dietary practice for adults age 50 or older mentioned in the text?'}, {'from': 'gpt', 'value': 'One recommended dietary practice for adults age 50 or older is to eat foods fortified with vitamin B12, such as fortified cereals or to take a multivitamin that contains B12 or a separate B12 supplement.'}, {'from': 'human', 'value': 'What issue related to nutritional science is addressed in the text?'}, {'from': 'gpt', 'value': 'The text addresses the issue that not all nutrition research is reliable and highlights the importance of being critical of nutrition science.'}, {'from': 'human', 'value': 'What is the potential benefit of early parenteral nutrition for critically ill patients mentioned in the text?'}, {'from': 'gpt', 'value': 'The potential benefit of early parenteral nutrition for critically ill patients mentioned in the text is reducing infectious complications and hospital length of stay.'}]",
    tokens: 128
  },
  {
    id: 2,
    images: [
      'https://dummyimage.com/600x400/fffeca/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/cc3ee3/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/fge434/ffffff.png&text=Data+Autobahn',
    ],
    conversations: "[{'from': 'human', 'value': '<image>\\nWhat is the specialty featured on the Homemade Crab Ramekin menu item?'}, {'from': 'gpt', 'value': 'The Homemade Crab Ramekin is fresh crab bound in a secret cheesy herby sauce, and is ready or customers to bake in the oven.'}]",
    tokens: 128
  },
  {
    id: 3,
    images: [
    'https://dummyimage.com/600x400/fffeca/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/44ff44/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/17deaa/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/fffeca/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/44ff44/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/17deaa/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/333333/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/cc3ee3/ffffff.png&text=Data+Autobahn',
      'https://dummyimage.com/600x400/fge434/ffffff.png&text=Data+Autobahn',
    ],
    conversations: "[{'from': 'human', 'value': '<image>\\nWhat is the specialty featured on the Homemade Crab Ramekin menu item?'}, {'from': 'gpt', 'value': 'The Homemade Crab Ramekin is fresh crab bound in a secret cheesy herby sauce, and is ready or customers to bake in the oven.'}]",
    tokens: 128
  }
])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 12733
})

const activeRow = ref(null)

const sql = ref('select * from qianfan_bos_catalog.all_data.infoqa_v0 limit 10;')

const templates = {
  limit: 'SELECT * FROM qianfan_bos_catalog.all_data.infovqa_v1 LIMIT 10;',
  stat: `SELECT 
      CONCAT(FLOOR(conversations_tokens / 5) * 5, '-', FLOOR(conversations_tokens / 5) * 5 + 4) AS token_range,
      COUNT(*) AS cnt
    FROM qianfan_bos_catalog.all_data.infovqa_v1
    GROUP BY FLOOR(conversations_tokens / 5)
    ORDER BY FLOOR(conversations_tokens / 5)
  `,
  tableInfo: 'SHOW COLUMNS FROM qianfan_bos_catalog.all_data.infovqa_v1;',
  catalog: 'SHOW DATABASES;'
}

const handleRowClick = (row) => {
  activeRow.value = row
}

const handleExpandClick = (row) => {
  activeRow.value = row
}

const handlePageChange = (page) => {
  pagination.page = page
  // 预留：此处可以根据 page 去请求新的分页数据
}

const applySQLTemplate = (key) => {
  if (templates[key]) {
    sql.value = templates[key]
  }
}

const runSql = () => {
  // 仅占位：后续接入实际的 SQL 执行接口
  console.log('执行 SQL：', sql.value)
}

const exportResult = () => {
  // 仅占位：后续接入实际导出逻辑
  console.log('导出 SQL 结果')
}

const clearSql = () => {
  sql.value = ''
}

const toggleExpand = (row) => {
  row.isExpanded = !row.isExpanded
}

const isDialogOpen = ref(false);
// 当前选中的行数据
const currentRow = ref(null);
// 纯文本默认为 false
const dialogMediumShown = ref(false);

// 点击后打开弹窗的方法
const toggleConversationsExpand = (idx, row) => {
  currentRow.value = row; // 把当前行数据传入弹窗
  currentRow.value.idx = idx;
  isDialogOpen.value = true; // 打开弹窗
  dialogMediumShown.value = row?.images?.length > 0; // 默认显示图片预览
};

const changeDialogMediumShown = (value) => {
  dialogMediumShown.value = value;
};

const parsedConversations = computed(() => {
  // 兜底1：currentRow为null/undefined，直接返回友好提示
  if (!currentRow.value || !currentRow.value.conversations) {
    return '暂无有效对话数据'
  }

  const rawStr = currentRow.value.conversations

  try {
    // 步骤1：安全替换单引号（仅替换对象键名的单引号，避免破坏字符串值）
    // 简单场景：全局替换（若无需兼容字符串内的单引号，可保留此方式）
    const validJsonStr = rawStr.replace(/'/g, '"')
    // 步骤2：解析JSON数据
    const parsedData = JSON.parse(validJsonStr)
    // 步骤3：返回解析后的有效数据
    return parsedData
  } catch (error) {
    // 兜底2：解析失败（格式错误），返回错误提示+打印日志
    console.error('对话数据解析失败：', error)
    return '数据格式异常，无法解析'
  }
})

const toggleCurrentRow = (idx) => {
  console.log(idx)
  currentRow.value = tableData.value[idx]
  currentRow.value.idx = idx
}

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

.sql-viewer__pagination {
  overflow: auto;
}

.image-thumb {
  width: 32px;
  height: 24px;
  border-radius: 4px;
  background: repeating-linear-gradient(
    45deg,
    var(--el-border-color-lighter),
    var(--el-border-color-lighter) 4px,
    var(--el-fill-color-light) 4px,
    var(--el-fill-color-light) 8px
  );
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
  font-weight: 500;
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

.detail-image-thumb {
  width: 64px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
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

/* 让该列的 cell 允许多行换行（覆盖 el-table 的单行省略样式） */
.expand-cell-col .cell {
  white-space: normal !important;
  overflow: visible;
  text-overflow: initial;
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
  padding-top: 16px;
  height: calc(100vh - 120px);
}


</style>
