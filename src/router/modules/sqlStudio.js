import Layout from '@/layout/index.vue'

const sqlStudio = {
  path: '/sqlStudio',
  component: Layout,
  redirect: '/sqlStudio/sqlViewer',
  name: 'SQLStudio',
  meta: {
    title: 'SQL Studio',
    icon: 'test'
  },
  children: [
    
    // {
    //   path: 'menu1',
    //   component: () => import('@/views/sqlStudio/menu1/index.vue'), // Parent router-view
    //   name: 'Menu1',
    //   meta: {
    //     title: 'Menu1',
    //   },
    //   children: [{
    //       path: 'menu1-1',
    //       component: () => import('@/views/sqlStudio/menu1/menu1-1.vue'),
    //       name: 'Menu1-1',
    //       meta: {
    //         title: 'Menu1-1'
    //       }
    //     },
    //     {
    //       path: 'menu1-2',
    //       component: () => import('@/views/sqlStudio/menu1/menu1-2/index.vue'),
    //       name: 'Menu1-2',
    //       meta: {
    //         title: 'Menu1-2'
    //       },
    //       children: [{
    //           path: 'menu1-2-1',
    //           component: () => import('@/views/sqlStudio/menu1/menu1-2/menu1-2-1.vue'),
    //           name: 'Menu1-2-1',
    //           meta: {
    //             title: 'Menu1-2-1'
    //           }
    //         },
    //         {
    //           path: 'menu1-2-2',
    //           component: () => import('@/views/sqlStudio/menu1/menu1-2/menu1-2-2.vue'),
    //           name: 'Menu1-2-2',
    //           meta: {
    //             title: 'Menu1-2-2'
    //           }
    //         }
    //       ]
    //     },
    //   ]
    // },
    {
      path: 'sqlViewer',
      component: () => import('@/views/sqlStudio/sqlViewer.vue'),
      name: 'SQL Viewer',
      meta: {
        title: 'SQL Viewer',
        icon: 'form',
      }
    },
    {
      path: 'sqlExporter',
      component: () => import('@/views/sqlStudio/sqlExporter.vue'),
      name: 'SQLxxExporter',
      meta: {
        title: 'SQL Exporter',
        icon: 'link',
      }
    }
  ]
}

export default sqlStudio
