<template>
  <div class="app-container">
    <el-table :data="table.list" max-height="820" border fit highlight-current-row v-loading="table.listLoading" :row-click="handleTableRowClick">
      <el-table-column align="center" label="ID" width="60">
        <template v-slot="scope">{{ scope.$index+1 }}</template>
      </el-table-column>
      <el-table-column align="center" class-name="status-col" label="Status" width="120">
        <template v-slot="scope">
          <el-tag :type="statusFilter(scope.row.status) || 'info'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="SQL 详情" show-overflow-tooltip min-width="280">
        <template v-slot="scope">{{ scope.row.parameters.sql }}</template>
      </el-table-column>
      <el-table-column label="导出至" show-overflow-tooltip min-width="280">
        <template v-slot="scope">
          <el-button text @click.prevent="handleOutputCopy(scope.row.parameters.output)">
            <el-icon ><CopyDocument /></el-icon>
          </el-button>
          {{ scope.row.parameters.output }}
        </template>
      </el-table-column>
      <el-table-column label="用户" prop="user" show-overflow-tooltip min-width="80" />
      <el-table-column min-width="120">
        <template #header>
          <span><el-icon><timer /></el-icon> 时间线</span>
        </template>
        <template v-slot="scope">
          <div><span>创建于: </span>{{ formattedCNTime(scope.row.created_at)}}</div>
          <div><span>开始于: </span>{{ formattedCNTime(scope.row.started_at) }}</div>
          <div><span>结束于: </span>{{ formattedCNTime(scope.row.finished_at) }}</div>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" min-width="50">
        <template #default="scope">
          <el-popconfirm v-if="!isDisabledDelete(scope.row)"  :title="getPauseTitle(scope.$index+1, scope.row)" @confirm.prevent="pauseRow(scope.$index)">
            <template #reference>
              <el-button
                link
                icon="Delete"
                type="danger"
                size="small"
              >
                暂停
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { onMounted, reactive } from 'vue'
import { getProcessSchedulerList } from '@/api/processScheduler/table'

const formattedCNTime = inject('$formattedCNTime')
 
const isDisabledDelete = (row) => {
  // 用 Set 存储禁用状态，扩展更方便（后续加状态只需改 Set）
  const disabledStatus = new Set(['SUCCESSED', 'FAILED', 'STOPPED']);
  return disabledStatus.has(row.status);
};

const table = reactive({
    list: null,
    listLoading: true,
})

const statusFilter = (status) => {
    const statusMap = {
        SUCCESSED: 'success',
        RUNNING: 'primary',
        STOPPED: 'warning',
        FAILED: 'danger',
        // ["primary", "success", "info", "warning", "danger"]
    }
    return statusMap[status]
}

onMounted(() => {
    fetchData()
})

const fetchData = () => {
    table.listLoading = true
    getProcessSchedulerList().then((response) => {
        table.list = response.body.data
        table.listLoading = false
    })
}

const handleOutputCopy = async (outputPath) => {
  try {
    // 1. 统一格式化复制文本（对象转格式化JSON，其他转字符串）
    const copyText = typeof outputPath === 'object' 
      ? JSON.stringify(outputPath, null, 2)
      : String(outputPath);

    let copySuccess = false;
    // 2. 优先使用 原生Clipboard API（安全上下文专用）
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(copyText);
      copySuccess = true;
    } else {
      // 3. 降级方案：创建临时文本框 + 原生选中复制（兼容HTTP/非安全上下文）
      const tempInput = document.createElement('input');
      // 隐藏临时输入框（不影响页面布局）
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      tempInput.style.top = '-9999px';
      // 赋值并选中文本
      tempInput.value = copyText;
      document.body.appendChild(tempInput);
      tempInput.select();
      // 执行复制（原生document.execCommand）
      copySuccess = document.execCommand('copy');
      // 移除临时节点
      document.body.removeChild(tempInput);
    }

    // 4. 复制结果反馈
    if (copySuccess) {
      ElMessage?.success(`导出路径 ${outputPath} 复制成功！`) || alert(`导出路径 ${outputPath} 复制成功！`);
      console.log('导出路径复制内容：', copyText);
    } else {
      throw new Error('剪贴板操作失败');
    }
  } catch (err) {
    ElMessage?.error('导出路径复制失败，请手动复制！') || alert('导出路径复制失败，请手动复制！');
    console.error('导出路径复制失败：', err);
  }
};

const handleTableRowClick = () => {
  
}

const getPauseTitle = (scopeIdx, row) => {
  // 兜底处理：防止 row.user 为空时显示“确定删除undefined?”
  const userName = row.user || '该用户';
  const recordIdx = scopeIdx || '_';
  return `确定暂停第 ${recordIdx} 行 ${userName} 的记录吗？`;
};

const pauseRow = (index) => {
  table.list[index].status = 'STOPPED'
  // TODO 真实暂停 rpc
}

</script>
