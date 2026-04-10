<template>
  <div class="dashboard-container">
    <!-- 场景网格 -->
    <div class="scenario-list">
      <div v-for="scenario in scenarios" :key="scenario" class="scenario-row" :class="{ 'is-wide': scenario === '全场景_各模型' }">
        <!-- 卡片 Header：场景名 + 时间选择器 + 刷新时间 -->
        <div class="scenario-header">
          <div class="scenario-header-left">
            <span class="scenario-name">
              {{ scenario }}
              <el-tag
                v-if="scenario === '全场景_各模型' && getScenarioStatus(scenario)"
                :type="getScenarioStatus(scenario)?.alive ? 'success' : 'danger'"
                size="small"
                effect="plain"
                class="realtime-tag"
              >
                {{ getScenarioStatus(scenario)?.alive ? '实时' : '离线' }}
              </el-tag>
            </span>
            <span v-if="getLastRefresh(scenario)" class="refresh-time">
              更新: {{ getLastRefresh(scenario) }}
            </span>
          </div>
          <div class="scenario-header-right">
            <!-- 实时场景支持更多时间范围 -->
            <el-radio-group
              v-if="scenario === '全场景_各模型'"
              v-model="scenarioTimeRanges[scenario]"
              size="small"
              class="scenario-time-selector"
              @change="(val) => onScenarioTimeRangeChange(scenario, val)"
            >
              <el-radio-button value="1h">1小时</el-radio-button>
              <el-radio-button value="6h">6小时</el-radio-button>
              <el-radio-button value="1d">1天</el-radio-button>
              <el-radio-button value="7d">7天</el-radio-button>
              <el-radio-button value="30d">1个月</el-radio-button>
            </el-radio-group>
            <!-- 非实时场景 -->
            <el-radio-group
              v-else
              v-model="scenarioTimeRanges[scenario]"
              size="small"
              class="scenario-time-selector"
              @change="(val) => onScenarioTimeRangeChange(scenario, val)"
            >
              <el-radio-button value="1d">1天</el-radio-button>
              <el-radio-button value="7d">1周</el-radio-button>
            </el-radio-group>
            <el-icon class="fullscreen-btn" @click="openFullscreen(scenario)"><FullScreen /></el-icon>
          </div>
        </div>

        <!-- 图表区域 -->
        <div v-loading="isScenarioLoading(scenario)" class="scenario-content">
          <div :ref="setChartRef[scenario]" class="scenario-chart"></div>
          <!-- Grafana 风格图例 -->
          <div v-if="getLegendRows(scenario).length" class="trend-legend-table">
            <div class="trend-legend-header">
              <span class="tl-name"></span>
              <span class="tl-stat">Mean</span>
              <span class="tl-stat">Max</span>
              <span class="tl-stat">Min</span>
            </div>
            <div
              v-for="row in getLegendRows(scenario)"
              :key="row.name"
              class="trend-legend-row"
              :class="{ 'is-overall': row.name === '整体', 'is-hidden': hiddenSeries[`${scenario}::${row.name}`] }"
              @click="toggleSeries(scenario, row.name)"
              @mouseenter="highlightSeries(scenario, row.name)"
              @mouseleave="downplaySeries(scenario, row.name)"
            >
              <span class="tl-name">
                <span class="tl-color-dot" :style="{ background: row.color }"></span>
                {{ row.name }}
              </span>
              <span class="tl-stat">{{ row.stats.mean }}%</span>
              <span class="tl-stat">{{ row.stats.max }}%</span>
              <span class="tl-stat">{{ row.stats.min }}%</span>
            </div>
          </div>
          <div v-else-if="!isScenarioLoading(scenario)" class="no-data">
            <el-empty description="暂无数据" :image-size="80" />
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏弹窗 -->
    <el-dialog v-model="fullscreenVisible" :title="fullscreenScenario" fullscreen class="fullscreen-dialog">
      <div ref="fullscreenChartRef" class="fullscreen-chart"></div>
      <div v-if="getLegendRows(fullscreenScenario).length" class="trend-legend-table">
        <div class="trend-legend-header">
          <span class="tl-name"></span>
          <span class="tl-stat">Mean</span>
          <span class="tl-stat">Max</span>
          <span class="tl-stat">Min</span>
        </div>
        <div
          v-for="row in getLegendRows(fullscreenScenario)"
          :key="row.name"
          class="trend-legend-row"
          :class="{ 'is-overall': row.name === '整体', 'is-hidden': hiddenSeries[`${fullscreenScenario}::${row.name}`] }"
          @click="toggleSeries(fullscreenScenario, row.name)"
          @mouseenter="highlightSeries(fullscreenScenario, row.name)"
          @mouseleave="downplaySeries(fullscreenScenario, row.name)"
        >
          <span class="tl-name">
            <span class="tl-color-dot" :style="{ background: row.color }"></span>
            {{ row.name }}
          </span>
          <span class="tl-stat">{{ row.stats.mean }}%</span>
          <span class="tl-stat">{{ row.stats.max }}%</span>
          <span class="tl-stat">{{ row.stats.min }}%</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { FullScreen } from '@element-plus/icons-vue'
import { kvDashboard, kvRealtime, kvRealtimeStatus } from '@/api/olap'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const TREND_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63',
  '#00BCD4', '#FF5722', '#8BC34A', '#795548',
]
const OVERALL_COLOR = '#16a34a'

const SCENARIOS = [
  '全场景_各模型',
  'coding_plan_各模型',
  '讯飞_全场景_glm-5',
  '无问芯穹_全场景_glm-5',
  '得物_全场景_glm-5',
  '金山_全场景_glm-5',
  '腾讯_全场景_glm-5',
  '智谱_全场景_glm-5',
]

// 每个场景的状态
const scenarioStates = reactive({})
SCENARIOS.forEach(s => {
  scenarioStates[s] = {
    loading: false,
    data: null,
    lastRefresh: '',
  }
})

// 实时场景状态
const realtimeStatus = ref(null)

// 各场景时间范围
const scenarioTimeRanges = reactive({
  '全场景_各模型': '7d',
  'coding_plan_各模型': '7d',
  '讯飞_全场景_glm-5': '7d',
  '无问芯穹_全场景_glm-5': '7d',
  '得物_全场景_glm-5': '7d',
  '金山_全场景_glm-5': '7d',
  '腾讯_全场景_glm-5': '7d',
  '智谱_全场景_glm-5': '7d',
})

const chartRefs = {}
const chartInstances = {}
const setChartRef = {}
SCENARIOS.forEach(s => {
  setChartRef[s] = (el) => {
    chartRefs[s] = el
  }
})
const hiddenSeries = reactive({})
let refreshTimer = null

const scenarios = SCENARIOS

// 全屏相关
const fullscreenVisible = ref(false)
const fullscreenScenario = ref('')
const fullscreenChartRef = ref(null)
let fullscreenChartInstance = null

function isScenarioLoading(scenario) {
  return scenarioStates[scenario]?.loading || false
}

function getScenarioData(scenario) {
  return scenarioStates[scenario]?.data
}

function getLastRefresh(scenario) {
  return scenarioStates[scenario]?.lastRefresh || ''
}

function getScenarioStatus(scenario) {
  if (scenario === '全场景_各模型') {
    return realtimeStatus.value
  }
  return null
}

/** 构建图例行数据 */
function getLegendRows(scenario) {
  const sData = getScenarioData(scenario)
  if (!sData?.points?.length) return []
  const rows = []
  if (sData.stats) {
    rows.push({
      name: '整体',
      color: OVERALL_COLOR,
      stats: sData.stats,
    })
  }
  const modelData = sData.models || {}
  let colorIdx = 0
  for (const model of Object.keys(modelData)) {
    const mStats = modelData[model]?.stats
    if (!mStats) continue
    rows.push({
      name: model,
      color: TREND_COLORS[colorIdx++ % TREND_COLORS.length],
      stats: mStats,
    })
  }
  return rows
}

function toggleSeries(scenario, name) {
  const key = `${scenario}::${name}`
  const isHidden = !hiddenSeries[key]
  hiddenSeries[key] = isHidden
  const doToggle = (inst) => {
    if (!inst) return
    inst.setOption({
      legend: { selected: { [name]: !isHidden } }
    })
  }
  doToggle(chartInstances[scenario])
  if (fullscreenChartInstance && fullscreenScenario.value === scenario) {
    doToggle(fullscreenChartInstance)
  }
}

function highlightSeries(scenario, name) {
  const doHighlight = (inst) => {
    if (!inst) return
    inst.dispatchAction({ type: 'highlight', seriesName: name })
  }
  doHighlight(chartInstances[scenario])
  if (fullscreenChartInstance && fullscreenScenario.value === scenario) {
    doHighlight(fullscreenChartInstance)
  }
}

function downplaySeries(scenario, name) {
  const doDownplay = (inst) => {
    if (!inst) return
    inst.dispatchAction({ type: 'downplay', seriesName: name })
  }
  doDownplay(chartInstances[scenario])
  if (fullscreenChartInstance && fullscreenScenario.value === scenario) {
    doDownplay(fullscreenChartInstance)
  }
}

// 获取实时状态
async function fetchRealtimeStatus() {
  try {
    const status = await kvRealtimeStatus()
    realtimeStatus.value = status ? { ...status, alive: status.alive } : { alive: false }
  } catch (e) {
    realtimeStatus.value = { alive: false }
  }
}

// 获取单个场景数据
async function fetchScenarioData(scenario, timeRange) {
  scenarioStates[scenario].loading = true
  try {
    let data = null

    if (scenario === '全场景_各模型') {
      // 实时场景优先使用 realtime 接口
      if (realtimeStatus.value?.alive) {
        try {
          const rtRes = await kvRealtime(timeRange)
          data = rtRes?.scenarios?.['全场景_各模型'] || null
        } catch (e) {
          console.warn('Realtime fetch failed, fallback to dashboard:', e)
        }
      }
      // fallback 到 dashboard
      if (!data) {
        const res = await kvDashboard(timeRange)
        data = res?.scenarios?.[scenario] || null
      }
    } else {
      // 非实时场景使用 dashboard
      const res = await kvDashboard(timeRange)
      data = res?.scenarios?.[scenario] || null
    }

    scenarioStates[scenario].data = data
    const now = new Date()
    scenarioStates[scenario].lastRefresh = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    await nextTick()
    renderScenarioChart(scenario)
  } catch (e) {
    console.error(`Failed to fetch data for ${scenario}:`, e)
    scenarioStates[scenario].data = null
  } finally {
    scenarioStates[scenario].loading = false
  }
}

// 初始化加载所有场景数据
async function fetchAllData() {
  // 先获取实时状态
  await fetchRealtimeStatus()

  // 并行加载所有场景
  const promises = SCENARIOS.map(s => fetchScenarioData(s, scenarioTimeRanges[s]))
  await Promise.all(promises)
}

// 单个场景时间范围变化
async function onScenarioTimeRangeChange(scenario, timeRange) {
  scenarioTimeRanges[scenario] = timeRange
  await fetchScenarioData(scenario, timeRange)
}

function renderScenarioChart(scenario) {
  const el = chartRefs[scenario]
  if (!el) return

  let instance = chartInstances[scenario]
  if (instance && instance.getDom() !== el) {
    instance.dispose()
    instance = null
  }
  if (!instance) {
    instance = echarts.init(el)
    chartInstances[scenario] = instance
  }

  const sData = getScenarioData(scenario)
  const points = sData?.points || []
  const modelData = sData?.models || {}

  if (!points.length) {
    instance.clear()
    return
  }

  const times = points.map(p => p.time)
  const values = points.map(p => p.hit_rate)

  const formatTooltipTime = (rawTime) => {
    if (!rawTime) return ''
    if (rawTime.includes(' ') && rawTime.includes('-')) {
      return rawTime
    }
    const refPt = points.find(p => p.time && p.time.includes(' ') && p.time.includes('-'))
    if (refPt) {
      const datePart = refPt.time.split(' ')[0]
      return `${datePart} ${rawTime}`
    }
    return rawTime
  }

  const allNames = ['整体']
  const seriesList = [
    {
      name: '整体',
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: OVERALL_COLOR },
      itemStyle: { color: OVERALL_COLOR },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: hexToRgba(OVERALL_COLOR, 0.22) },
          { offset: 1, color: hexToRgba(OVERALL_COLOR, 0.01) },
        ]),
      },
      z: 0,
    },
  ]

  let modelColorIdx = 0
  const modelNames = Object.keys(modelData)
  modelNames.forEach((model) => {
    const mPoints = modelData[model]?.points || []
    if (!mPoints.length) return
    const color = TREND_COLORS[modelColorIdx++ % TREND_COLORS.length]
    allNames.push(model)

    const timeMap = Object.fromEntries(mPoints.map(p => [p.time, p.hit_rate]))
    const aligned = times.map(t => timeMap[t] ?? null)
    seriesList.push({
      name: model,
      type: 'line',
      data: aligned,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1, color },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: hexToRgba(color, 0.12) },
          { offset: 1, color: hexToRgba(color, 0.01) },
        ]),
      },
      z: 2,
      connectNulls: true,
    })
  })

  const legendSelected = {}
  allNames.forEach(name => {
    const key = `${scenario}::${name}`
    legendSelected[name] = !hiddenSeries[key]
  })

  instance.setOption({
    animation: true,
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter(params) {
        const idx = params[0]?.dataIndex
        if (idx == null) return ''
        let html = `<div style="font-weight:600;margin-bottom:4px">${formatTooltipTime(times[idx])}</div>`
        params.forEach(p => {
          if (p.value != null) {
            html += `<div>${p.marker} ${p.seriesName}: <b>${p.value}%</b></div>`
          }
        })
        return html
      },
    },
    legend: { show: false, data: allNames, selected: legendSelected },
    grid: { left: 46, right: 12, top: 8, bottom: 24 },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        fontSize: 10,
        interval: 'auto',
        rotate: points.length > 60 ? 45 : 0,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.2 } },
    },
    series: seriesList,
  }, true)
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function openFullscreen(scenario) {
  fullscreenScenario.value = scenario
  fullscreenVisible.value = true
}

watch(fullscreenVisible, async (val) => {
  if (val) {
    await nextTick()
    const el = fullscreenChartRef.value
    if (!el) return
    fullscreenChartInstance = echarts.init(el)
    // 复制图表配置到全屏
    const sourceInstance = chartInstances[fullscreenScenario.value]
    if (sourceInstance) {
      const option = sourceInstance.getOption()
      fullscreenChartInstance.setOption(option)
    }
  } else {
    if (fullscreenChartInstance) {
      fullscreenChartInstance.dispose()
      fullscreenChartInstance = null
    }
  }
})

function handleResize() {
  Object.values(chartInstances).forEach(c => c?.resize())
  fullscreenChartInstance?.resize()
}

onMounted(() => {
  fetchAllData()
  refreshTimer = setInterval(() => {
    // 每分钟刷新实时场景
    fetchScenarioData('全场景_各模型', scenarioTimeRanges['全场景_各模型'])
    // 同时刷新实时状态
    fetchRealtimeStatus()
  }, 60000)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances).forEach(c => c?.dispose())
  if (fullscreenChartInstance) {
    fullscreenChartInstance.dispose()
    fullscreenChartInstance = null
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 0;
}

.scenario-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-items: start;
}

.scenario-row {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  overflow: visible;

  &.is-wide {
    grid-column: 1 / -1;
  }
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  background: var(--el-fill-color-lighter);
  gap: 12px;
}

.scenario-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.scenario-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.scenario-name {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.refresh-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

.realtime-tag {
  font-size: 10px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  border-radius: 3px;
}

.scenario-time-selector {
  flex-shrink: 0;
  :deep(.el-radio-button__inner) {
    padding: 2px 8px;
    font-size: 11px;
  }
}

.scenario-content {
  display: flex;
  flex-direction: column;
}

.scenario-chart {
  width: 100%;
  height: 200px;
  flex-shrink: 0;
}

.no-data {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-btn {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  flex-shrink: 0;
  &:hover {
    color: var(--el-color-primary);
  }
}

/* 全屏弹窗 */
:deep(.el-dialog__body) {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 32px;
  overflow-y: auto;
}

.fullscreen-chart {
  width: 100%;
  height: calc(100vh - 280px);
}

/* Grafana 风格统计图例 */
.trend-legend-table {
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  line-height: 1;
}
.trend-legend-header,
.trend-legend-row {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-bottom: 1px solid #f0f1f3;
}
.trend-legend-header {
  color: #909399;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  background: #fafafa;
}
.trend-legend-row:hover {
  background: #f5f7fa;
}
.trend-legend-row {
  cursor: pointer;
  user-select: none;
}
.trend-legend-row.is-hidden {
  opacity: 0.38;
}
.trend-legend-row.is-hidden .tl-color-dot {
  background: #c0c4cc !important;
}
.trend-legend-row.is-overall {
  font-weight: 600;
  background: #e8f5e9;
}
.trend-legend-row.is-overall:hover {
  background: #c8e6c9;
}
.tl-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tl-color-dot {
  display: inline-block;
  width: 10px;
  height: 3px;
  border-radius: 1px;
  flex-shrink: 0;
}
.trend-legend-row.is-overall .tl-color-dot {
  height: 4px;
}
.tl-stat {
  width: 80px;
  text-align: right;
  flex-shrink: 0;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

@media (max-width: 1200px) {
  .scenario-list {
    grid-template-columns: 1fr;
  }
  .scenario-row.is-wide {
    grid-column: 1;
  }
}
</style>
