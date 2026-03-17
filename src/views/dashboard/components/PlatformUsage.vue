<template>
  <div class="platform-usage-container">
    <!-- 标题和周期选择 -->
    <div class="usage-header">
      <h3 class="usage-title">(Legacy)平台使用情况</h3>
      <el-radio-group v-model="selectedPeriod" size="small" @change="handlePeriodChange">
        <el-radio-button value="day">日</el-radio-button>
        <el-radio-button value="week">周</el-radio-button>
        <el-radio-button value="month">月</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 统计概览卡片 -->
    <el-row :gutter="16" class="usage-stats-row">
      <el-col :span="8">
        <div v-loading="loading" class="stat-card">
          <div class="stat-icon requests-icon">
            <el-icon :size="24"><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总请求数</div>
            <CountTo
              :start-val="0"
              :end-val="usageData.total_requests || 0"
              :duration="1500"
              class="stat-value"
            />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div v-loading="loading" class="stat-card">
          <div class="stat-icon users-icon">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">活跃用户</div>
            <CountTo
              :start-val="0"
              :end-val="usageData.active_users?.length || 0"
              :duration="1500"
              class="stat-value"
            />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div v-loading="loading" class="stat-card">
          <div class="stat-icon time-icon">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">统计周期</div>
            <div class="stat-period">{{ periodLabel }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="usage-charts-row">
      <!-- 时间趋势图 -->
      <el-col :span="12">
        <div v-loading="loading" class="chart-card">
          <div class="chart-title">请求趋势</div>
          <div ref="timelineChartRef" class="chart-container"></div>
        </div>
      </el-col>

      <!-- 场景分布图 -->
      <el-col :span="12">
        <div v-loading="loading" class="chart-card">
          <div class="chart-title">场景分布</div>
          <div ref="scenarioChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 活跃用户和操作分布 -->
    <el-row :gutter="16" class="usage-details-row">
      <!-- 活跃用户排行 -->
      <el-col :span="12">
        <div v-loading="loading" class="detail-card">
          <div class="detail-title">活跃用户 TOP10</div>
          <div class="user-list">
            <div
              v-for="(user, index) in topActiveUsers"
              :key="user.name"
              class="user-item"
            >
              <span class="user-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="user-name">{{ user.name }}</span>
              <el-progress
                :percentage="getPercentage(user.count, maxUserCount)"
                :stroke-width="8"
                :show-text="false"
                class="user-progress"
              />
              <span class="user-count">{{ user.count }}</span>
            </div>
            <el-empty v-if="topActiveUsers.length === 0" description="暂无数据" :image-size="60" />
          </div>
        </div>
      </el-col>

      <!-- 热门操作 -->
      <el-col :span="12">
        <div v-loading="loading" class="detail-card">
          <div class="detail-title">热门操作 TOP10</div>
          <div ref="actionChartRef" class="chart-container action-chart"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue'
import { CountTo } from 'vue3-count-to'
import * as echarts from 'echarts'
import useChartResize from './mixins/resize'
import 'echarts/theme/macarons'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  usageData: {
    type: Object,
    default: () => ({
      period: 'day',
      total_requests: 0,
      active_users: [],
      scenario_distribution: [],
      action_distribution: [],
      timeline: [],
      start_date: '',
      end_date: ''
    })
  }
})

const emit = defineEmits(['periodChange'])

const selectedPeriod = ref('day')

// 图表实例
const timelineChartRef = ref(null)
const scenarioChartRef = ref(null)
const actionChartRef = ref(null)

const timelineChartInstance = shallowRef(null)
const scenarioChartInstance = shallowRef(null)
const actionChartInstance = shallowRef(null)

// 使用 resize 钩子
useChartResize(timelineChartInstance)
useChartResize(scenarioChartInstance)
useChartResize(actionChartInstance)

// 计算属性
const periodLabel = computed(() => {
  const labels = {
    day: '最近1天',
    week: '最近7天',
    month: '最近30天'
  }
  return labels[selectedPeriod.value] || '最近1天'
})

const topActiveUsers = computed(() => {
  return (props.usageData.active_users || []).slice(0, 10)
})

const maxUserCount = computed(() => {
  if (!topActiveUsers.value.length) return 1
  return Math.max(...topActiveUsers.value.map(u => u.count))
})

// 方法
const handlePeriodChange = (period) => {
  emit('periodChange', period)
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const getPercentage = (value, max) => {
  if (!max) return 0
  return Math.round((value / max) * 100)
}

// 初始化时间趋势图
const initTimelineChart = () => {
  if (!timelineChartRef.value) return

  if (timelineChartInstance.value) {
    timelineChartInstance.value.dispose()
  }

  timelineChartInstance.value = echarts.init(timelineChartRef.value, 'macarons')
  updateTimelineChart()
}

const updateTimelineChart = () => {
  if (!timelineChartInstance.value) return

  const timeline = props.usageData.timeline || []
  const dates = timeline.map(t => t.date)
  const requests = timeline.map(t => t.requests)
  const users = timeline.map(t => t.unique_users)

  timelineChartInstance.value.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['请求数', '活跃用户'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: dates.length > 7 ? 30 : 0,
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '请求数',
        position: 'left',
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      {
        type: 'value',
        name: '用户数',
        position: 'right',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '请求数',
        type: 'bar',
        data: requests,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#79bbff' }
          ])
        }
      },
      {
        name: '活跃用户',
        type: 'line',
        yAxisIndex: 1,
        data: users,
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }, { notMerge: true })
}

// 初始化场景分布图
const initScenarioChart = () => {
  if (!scenarioChartRef.value) return

  if (scenarioChartInstance.value) {
    scenarioChartInstance.value.dispose()
  }

  scenarioChartInstance.value = echarts.init(scenarioChartRef.value, 'macarons')
  updateScenarioChart()
}

const updateScenarioChart = () => {
  if (!scenarioChartInstance.value) return

  const data = props.usageData.scenario_distribution || []

  scenarioChartInstance.value.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][index % 5]
          }
        }))
      }
    ]
  }, { notMerge: true })
}

// 初始化操作分布图
const initActionChart = () => {
  if (!actionChartRef.value) return

  if (actionChartInstance.value) {
    actionChartInstance.value.dispose()
  }

  actionChartInstance.value = echarts.init(actionChartRef.value, 'macarons')
  updateActionChart()
}

const updateActionChart = () => {
  if (!actionChartInstance.value) return

  const data = (props.usageData.action_distribution || []).slice(0, 10)
  const names = data.map(d => d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name)
  const values = data.map(d => d.value)

  actionChartInstance.value.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const dataIndex = params[0].dataIndex
        const original = (props.usageData.action_distribution || [])[dataIndex]
        return `${original?.name || ''}<br/>次数: ${params[0].value}`
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: {
        fontSize: 11,
        width: 100,
        overflow: 'truncate'
      }
    },
    series: [
      {
        type: 'bar',
        data: values.reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#36a3f7' },
            { offset: 1, color: '#83bff6' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 11
        }
      }
    ]
  }, { notMerge: true })
}

// 监听数据变化
watch(
  () => props.usageData,
  () => {
    nextTick(() => {
      updateTimelineChart()
      updateScenarioChart()
      updateActionChart()
    })
  },
  { deep: true }
)

// 同步外部 period 到内部状态
watch(
  () => props.usageData.period,
  (newPeriod) => {
    if (newPeriod && newPeriod !== selectedPeriod.value) {
      selectedPeriod.value = newPeriod
    }
  }
)

onMounted(() => {
  nextTick(() => {
    initTimelineChart()
    initScenarioChart()
    initActionChart()
  })
})

onBeforeUnmount(() => {
  timelineChartInstance.value?.dispose()
  scenarioChartInstance.value?.dispose()
  actionChartInstance.value?.dispose()
})
</script>

<style lang="scss" scoped>
.platform-usage-container {
  margin-top: 24px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 14px 4px var(--el-border-color);

  &:hover {
    box-shadow: 5px 5px 18px 2px var(--el-color-primary-light-5);
  }
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;

  .usage-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.usage-stats-row {
  margin-bottom: 20px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
    border-radius: 8px;
    border: 1px solid #ebeef5;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: #fff;

      &.requests-icon {
        background: linear-gradient(135deg, #409EFF 0%, #79bbff 100%);
      }

      &.users-icon {
        background: linear-gradient(135deg, #67C23A 0%, #95d475 100%);
      }

      &.time-icon {
        background: linear-gradient(135deg, #E6A23C 0%, #eebe77 100%);
      }
    }

    .stat-info {
      flex: 1;

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .stat-period {
        font-size: 16px;
        font-weight: 500;
        color: #606266;
      }
    }
  }
}

.usage-charts-row,
.usage-details-row {
  margin-bottom: 20px;

  .chart-card,
  .detail-card {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    padding: 16px;
    height: 280px;

    .chart-title,
    .detail-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }

    .chart-container {
      height: 220px;
    }

    .action-chart {
      height: 220px;
    }
  }
}

.user-list {
  max-height: 220px;
  overflow-y: auto;

  .user-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .user-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #f0f0f0;
      color: #909399;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;

      &.rank-gold {
        background: linear-gradient(135deg, #ffd700 0%, #ffec8b 100%);
        color: #fff;
      }

      &.rank-silver {
        background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
        color: #fff;
      }

      &.rank-bronze {
        background: linear-gradient(135deg, #cd7f32 0%, #daa06d 100%);
        color: #fff;
      }
    }

    .user-name {
      flex: 0 0 80px;
      font-size: 13px;
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-progress {
      flex: 1;
      margin: 0 12px;
    }

    .user-count {
      flex: 0 0 40px;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #409EFF;
    }
  }
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #409EFF 0%, #79bbff 100%);
}
</style>
