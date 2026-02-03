<template>
  <div class="dashboard-container">
    <PanelGroup :loading="fetchDataLoading" @directToDomain="directToDomain" :domainMatrix="domainMatrix" />
    <DatasetBarChart :loading="fetchDataLoading" :datasetsBarChartData="datasetsBarChartData"/>
  </div>

</template>

<script setup>
import DatasetBarChart from '@/views/dashboard/components/DatasetBarChart.vue'
import PanelGroup from '@/views/dashboard/components/PanelGroup.vue'
import { useRouter } from 'vue-router'
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getDatasetsMetrics, getUserMetrics } from '@/api/dashboard/index'
import { ElMessage } from 'element-plus'

const router = useRouter()
const domainMatrix = reactive({
  datasetsAmount: 0,
  pipelineAmount: 0,
  usersAmount: 0,
})

const fetchDataLoading = ref(true)

const datasetsBarChartData = ref([])

onMounted(() => {
    fetchData()
})

const fetchData = async () => {
  fetchDataLoading.value = true
  try {
    getDatasetsMetrics().then((response) => {
      domainMatrix.datasetsAmount = response.data.datasets_amount
      datasetsBarChartData.value = response.data.datasets_distribution
    })
    getUserMetrics().then((response) => {
      domainMatrix.usersAmount = response.data.users_amount
    })
    ElMessage({
      message: "数据总览请求成功",
      type: 'success',
      duration: 3 * 1000
    })
  } catch (err) {
    console.error('数据总览请求失败：', err)
    ElNotification({
      title: '执行失败',
      message: `失败原因：${err.message || '网络异常或接口错误'}`,
      type: 'error',
      duration: 0,
    })
  } finally {
    nextTick(() => {
      fetchDataLoading.value = false
    })
  }

}

const directToDomain = (domain) => {
  const routeMap = {
    'dataset': '/datasets',
    'pipeline': '/sqlStudio/sqlExporter',
  };

  const targetPath = routeMap[domain];

  if (targetPath) {
    router.push(targetPath);
  } else {
    console.warn(`未知的 domain: ${domain}`);
  }
}

</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 32px;
  background-color: rgb(240, 242, 245, 0.45);
  position: relative;
}
</style>
