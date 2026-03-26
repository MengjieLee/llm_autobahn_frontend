<template>
  <div class="dashboard-container">
    <PlatformUsage
      :loading="usageLoading"
      :usageData="platformUsageData"
      @periodChange="handleUsagePeriodChange"
    />
    <PanelGroup :loading="fetchDataLoading" @directToDomain="directToDomain" :domainMatrix="domainMatrix" />
    <DatasetBarChart :loading="fetchDataLoading" :datasetsBarChartData="datasetsBarChartData"/>
  </div>
</template>

<script setup>
import DatasetBarChart from '@/views/dashboard/components/DatasetBarChart.vue'
import PanelGroup from '@/views/dashboard/components/PanelGroup.vue'
import PlatformUsage from '@/views/dashboard/components/PlatformUsage.vue'
import { useRouter } from 'vue-router'
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getDatasetsMetrics, getUserMetrics, getPlatformUsageMetrics } from '@/api/dashboard/index'
import { ElMessage } from 'element-plus'

const router = useRouter()
const domainMatrix = reactive({
  datasetsAmount: 0,
  pipelineAmount: 0,
  usersAmount: 0,
})

const fetchDataLoading = ref(true)
const usageLoading = ref(true)

const datasetsBarChartData = ref([])
const platformUsageData = ref({
  period: 'week',
  total_requests: 0,
  active_users: [],
  scenario_distribution: [],
  action_distribution: [],
  timeline: [],
  start_date: '',
  end_date: ''
})

onMounted(() => {
  fetchData()
  fetchUsageData({ period: 'week' })
})

const fetchData = async () => {
  fetchDataLoading.value = true
  try {
    await getDatasetsMetrics().then((response) => {
      domainMatrix.datasetsAmount = response.data.datasets_amount
      datasetsBarChartData.value = response.data.datasets_distribution
    })
    await getUserMetrics().then((response) => {
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

const fetchUsageData = async (params) => {
  usageLoading.value = true
  try {
    const response = await getPlatformUsageMetrics(params)
    platformUsageData.value = response.data
  } catch (err) {
    console.error('平台使用情况请求失败：', err)
  } finally {
    nextTick(() => {
      usageLoading.value = false
    })
  }
}

const handleUsagePeriodChange = (params) => {
  fetchUsageData(params)
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
