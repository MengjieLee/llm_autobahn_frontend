<template>
  <div class="sql-viewer">
    <!-- 中间左右分栏主体区域 -->
    <el-row :gutter="16" class="sql-viewer__body">
      <!-- 左侧：数据预览表格 + 分页 -->
      <el-col
        :xs="24"
        :sm="24"
        :md="14"
        :lg="16"
        class="sql-viewer__left"
      >
        <el-card class="sql-viewer__card" shadow="never">
          <!-- 表格主体区域：占满卡片中间高度，内部滚动 -->
          <div class="sql-viewer__table-wrapper">
            <el-table
              :data="tableData"
              border
              fit
              highlight-current-row
              height="100%"
              size="small"
              style="width:100%"
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
                min-width="160"
                show-overflow-tooltip
              >
                <template #header>
                  <div>
                    <div class="sql-viewer__meta-title">images</div>
                      <div class="sql-viewer__meta-sub">list · lengths</div>
                      <div class="sql-viewer__tokens-bar">
                        <span v-for="n in 4" :key="n" class="tokens-bar__item" />
                      </div>
                  </div>
                </template>
                <template #default="scope">
                  <div class="sql-viewer__image-cell">
                    <div class="image-thumb" />
                    <span class="image-count">
                      {{ scope.row.images.length }} 张
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="textPreview"
                label="texts"
                min-width="260"
                show-overflow-tooltip
              >
                <template #header>
                  <div>
                    <div class="sql-viewer__meta-title">conversations</div>
                      <div class="sql-viewer__meta-sub">list · lengths</div>
                      <div class="sql-viewer__tokens-bar">
                        <span v-for="n in 8" :key="n" class="tokens-bar__item" />
                      </div>
                  </div>
                </template>
                <template #default="scope">
                  <span class="text-preview">
                    {{ scope.row.text.slice(0, 80) }}{{ scope.row.text.length > 80 ? '...' : '' }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>

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
        </el-card>
      </el-col>

      <!-- 右侧：SQL 编辑器 + 模板按钮 + 行详情 -->
      <el-col
        :xs="24"
        :sm="24"
        :md="10"
        :lg="8"
        class="sql-viewer__right"
      >
        <el-card class="sql-viewer__card sql-viewer__right-card" shadow="never">
          <!-- SQL 编辑区域 -->
          <div class="sql-viewer__sql-panel">
            <div class="sql-viewer__sql-toolbar">
              <span class="sql-viewer__sql-label">SQL 查询</span>
              <div class="sql-viewer__sql-actions">
                <el-button size="small" @click="applyTemplate('limit')">
                  limit 查询
                </el-button>
                <el-button size="small" @click="applyTemplate('stat')">
                  统计 Token 数分布
                </el-button>
                <el-button size="small" @click="applyTemplate('tableInfo')">
                  查询 table 结构
                </el-button>
                <el-button size="small" @click="applyTemplate('catalog')">
                  查询 catalog 列表
                </el-button>
              </div>
            </div>

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
                <el-button type="primary" @click="runSql">
                  执行 SQL
                </el-button>
                <el-button @click="exportResult">
                  导出至文件
                </el-button>
                <el-button @click="clearSql">
                  清空
                </el-button>
              </div>
              <span class="sql-viewer__sql-hint">
                当前仅示意布局，后续可接入真实 SQL 执行接口
              </span>
            </div>
          </div>

          <!-- 行详情展示区域：对应左侧表格中选中的记录 -->
          <el-divider content-position="left">当前行详情</el-divider>
          <div class="sql-viewer__detail" v-if="activeRow">
            <div class="detail-section">
              <div class="detail-label">文本内容</div>
              <div class="detail-content detail-content--scroll">
                {{ activeRow.text }}
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-label">图片预览</div>
              <div class="detail-images">
                <div
                  v-for="(img, idx) in activeRow.images"
                  :key="idx"
                  class="detail-image-thumb"
                >
                  <span>IMG {{ idx + 1 }}</span>
                </div>
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Tokens</div>
              <div class="detail-content">
                {{ activeRow.tokens }}
              </div>
            </div>
          </div>
          <div class="sql-viewer__detail sql-viewer__detail--empty" v-else>
            点击左侧表格的行或右侧“+”图标，在此查看完整数据详情
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

// 示例数据，仅用于展示布局效果。后续可替换为真实接口数据。
const tableData = ref([
  {
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },
  {
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },
  {
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },
  {
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },{
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },{
    id: 1,
    images: [{}, {}, {}],
    text: 'What is the purpose of the Confirmation Statement mentioned in the document?',
    tokens: 128
  },
  {
    id: 2,
    images: [{}],
    text: 'What is the summary of the provided text? The extended text is a list of Christian counselors in the Inland Empire area...',
    tokens: 96
  },
  {
    id: 3,
    images: [{}, {}],
    text: 'What is the main topic of the "Cupcakes and Cashmere" book?',
    tokens: 72
  },
])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 12733
})

const activeRow = ref(null)

const sql = ref('select * from qianfan_bos_catalog.all_data.infoqa_v0 limit 10;')

const templates = {
  limit: 'select * from qianfan_bos_catalog.all_data.infoqa_v0 limit 10;',
  stat: 'select bucket, count(*) as cnt from token_stats group by bucket order by bucket;',
  tableInfo: 'describe table qianfan_bos_catalog.all_data.infoqa_v0;',
  catalog: 'show tables from qianfan_bos_catalog;'
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

const applyTemplate = (key) => {
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
</script>

<style scoped>
.sql-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.sql-viewer__meta-block {
  margin-bottom: 8px;
}

.sql-viewer__meta-title {
  font-weight: 700;
  font-size: 16px;
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

.sql-viewer__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sql-viewer__left,
.sql-viewer__right {
  height: 100%;
  display: flex;
}

.sql-viewer__card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sql-viewer__table-wrapper {
  flex: 1;
  min-height: 260px;
  min-width: 0;
  overflow: auto;
}

.sql-viewer__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.sql-viewer__image-cell {
  display: flex;
  align-items: center;
  gap: 6px;
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

.image-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.text-preview {
  font-size: 13px;
}

.sql-viewer__right-card {
  padding-bottom: 8px;
  overflow: hidden;
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

.sql-viewer__sql-label {
  font-weight: 600;
  font-size: 13px;
}

.sql-viewer__sql-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.sql-viewer__sql-input {
  font-family: var(--el-font-family-monospace, SFMono-Regular, Menlo, Monaco,
      Consolas, 'Liberation Mono', 'Courier New', monospace);
}

.sql-viewer__sql-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.sql-viewer__sql-footer-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sql-viewer__table-header {
  padding: 8px 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--el-card-bg-color, #fff);
}

.sql-viewer__sql-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sql-viewer__detail {
  margin-top: 8px;
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

@media (max-width: 768px) {
  .sql-viewer__card {
    margin-bottom: 8px;
  }

  .sql-viewer__detail {
    max-height: none;
  }
}
</style>
