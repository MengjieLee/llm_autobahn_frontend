import Layout from '@/layout/index.vue'

const datasets = {
  path: '/datasets',
  component: Layout,
  redirect: '/datasets/catalog',
  name: 'datasets',
  meta: {
    title: '数据集',
    icon: 'test'
  },
  children: [
    {
      path: 'catalog',
      component: () => import('@/views/datasets/datasetsCatalog.vue'),
      name: 'Catalog',
      meta: {
        title: '数据集-概览',
        icon: 'form',
      }
    },
    {
      path: 'detail',
      component: () => import('@/views/datasets/datasetsDetail.vue'),
      name: 'Detail',
      meta: {
        title: '数据集-明细',
        icon: 'form',
      }
    },
  ]
}

export default datasets
