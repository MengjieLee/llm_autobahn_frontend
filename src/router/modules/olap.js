import Layout from '@/layout/index.vue'
import { DataAnalysis, TrendCharts } from '@element-plus/icons-vue'

const olap = {
  path: '/olap',
  component: Layout,
  redirect: '/olap/dashboard',
  name: 'olap',
  meta: {
    title: 'OLAP 分析',
    icon: DataAnalysis,
    alwaysShow: true,
  },
  children: [
    {
      path: 'dashboard',
      component: () => import('@/views/olap/dashboard.vue'),
      name: 'OlapDashboard',
      meta: {
        title: 'Dashboard',
        icon: TrendCharts,
      }
    },
    {
      path: 'discovery',
      component: () => import('@/views/olap/kvAnalysis.vue'),
      name: 'KvDiscovery',
      meta: {
        title: 'Discovery',
        icon: DataAnalysis
      }
    }
  ]
}

export default olap
