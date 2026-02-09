import Layout from '@/layout/index.vue'

const sqlStudio = {
  path: '/sqlStudio',
  component: Layout,
  redirect: '/sqlStudio/sqlViewer',
  name: 'SQLStudio',
  meta: {
    title: 'SQL 工具台',
    icon: 'sql'
  },
  children: [
    {
      path: 'sqlViewer',
      component: () => import('@/views/sqlStudio/sqlViewer.vue'),
      name: 'SQL Viewer',
      meta: {
        title: 'SQL 透视',
        icon: 'sql',
      }
    },
    {
      path: 'sqlExporter',
      component: () => import('@/views/sqlStudio/sqlExporter.vue'),
      name: 'SQLxxExporter',
      meta: {
        title: '导出队列',
        icon: 'link',
      }
    }
  ]
}

export default sqlStudio
