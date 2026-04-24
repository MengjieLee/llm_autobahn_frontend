import Layout from '@/layout/index.vue'
import { DataAnalysis, TrendCharts } from '@element-plus/icons-vue'

const mtp = {
  path: '/mtp',
  component: Layout,
  redirect: '/mtp/evaluate',
  name: 'MTP',
  meta: {
    title: 'MTP 实验室',
    icon: DataAnalysis,
    alwaysShow: true,
  },
  children: [
    {
      path: 'dashboard',
      component: () => import('@/views/mtp/dashboard.vue'),
      name: 'MtpDashboard',
      meta: {
        title: 'Dashboard',
        icon: TrendCharts,
      }
    },
    {
      path: 'evaluate',
      component: () => import('@/views/mtp/evaluate.vue'),
      name: 'Evaluate',
      meta: {
        title: 'Evaluate',
        icon: DataAnalysis
      }
    },
    {
      path: 'evaluate/:taskId',
      component: () => import('@/views/mtp/evaluate.vue'),
      name: 'EvaluateDetail',
      meta: {
        title: 'Evaluate',
        icon: DataAnalysis,
        hidden: true,
        activeMenu: '/mtp/evaluate'
      }
    }
  ]
}

export default mtp
