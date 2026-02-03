<template>
  <div
    ref="chartRef"
    :class="className"
    :style="{ height: height, width: width }"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts';
// @ts-ignore
import 'echarts/theme/macarons';

const props = defineProps({
  className: { type: String, default: 'bar-chart' },
  width: { type: String, default: '100%' },
  height: { type: String, default: '400px' },
  // 数据格式：[{ name: '图像', value: 120 }, { name: '文本', value: 200 }]
  datasetsBarChartData: {
    type: Array,
    required: true,
    default: () => []
  },
  title: { type: String, default: '数据集分布统计' }
});

const chartRef = ref(null);
let chartInstance = null;

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value, 'macarons');
  chartInstance.on('click', (params) => {
    // params 包含了点击柱状体的所有信息
    // params.name 是 X 轴的 label 名称
    // params.value 是对应的数值
    console.log('点击了：', params.name);

    // 调用跳转函数
    handleRouteJump(params.name);
  });
  setOptions(props.datasetsBarChartData);
};

const handleRouteJump = (labelName) => {
  // 示例：根据 label 跳转到不同路由，并携带参数
  // router.push({ path: '/dataset/detail', query: { type: labelName } });
  alert(`即将跳转到 ${labelName} 的详情页`);
};

const setOptions = (data) => {
  const sortedData = data.slice().sort((a, b) => b.value - a.value);

  const xAxisData = sortedData.map(item => item.name);
  const seriesData = sortedData.map(item => item.value);

  chartInstance.setOption({
    title: {
      text: props.title,
      left: 'center',
      textStyle: { fontSize: 18, color: '#333' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' } // 阴影指示器，适合柱状图
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        interval: 0,        // 强制显示所有标签（不论重叠与否）
        rotate: 15,          // 倾斜角度，建议 30-45 度
        fontSize: 12,        // 字体大小
        hideOverlap: false,  // 即使重叠也不隐藏
        // 如果文字实在太长，可以开启自动截断或换行
        overflow: 'breakAll',
        width: 90            // 配合 overflow 使用，限制单行宽度
      }
    },
    yAxis: {
      type: 'value',
      name: '数量 (个)',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
      {
        name: '数据集数量',
        type: 'bar',
        barWidth: '40%', // 柱子宽度
        data: seriesData,
        // 添加美化效果：渐变色
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        },
        // 鼠标悬浮时的样式
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#44ba82' },
              { offset: 0.5, color: '#44ba8299' },
              { offset: 1, color: '#44ba824a' }
            ])
          }
        },
        // 柱状图上直接显示数值
        label: {
          show: true,
          position: 'top',
          color: '#666'
        },
        animationDuration: 1500
      }
    ]
  });
};

watch(() => props.datasetsBarChartData, (newData) => {
  setOptions(newData);
}, { deep: true });

const handleResize = () => chartInstance?.resize();

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style>
.bar-chart {
  background: #fff;
  box-shadow: 4px 4px 40px rgba(0, 0, 0, .15);
  border-color: rgba(0, 0, 0, .05);

  &:hover {
    box-shadow: 8px 8px 20px var(--el-text-color-secondary);
    border: 2px solid #44ba8299;
  }
}
</style>
