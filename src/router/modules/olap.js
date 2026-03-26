import Layout from '@/layout/index.vue'
import { DataAnalysis } from '@element-plus/icons-vue'

const olap = {
  path: '/olap',
  component: Layout,
  redirect: '/olap/kv',
  name: 'olap',
  meta: {
    title: 'OLAP 分析',
    icon: DataAnalysis
  },
  children: [
    {
      path: 'kv',
      component: () => import('@/views/olap/kvAnalysis.vue'),
      name: 'KvAnalysis',
      meta: {
        title: 'KV Cache 分析',
        icon: DataAnalysis
      }
    }
  ]
}

export default olap
