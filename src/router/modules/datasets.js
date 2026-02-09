import Layout from '@/layout/index.vue'

const datasets = {
  path: '/datasets',
  component: Layout,
  redirect: '/datasets/catalog',
  name: 'datasets',
  meta: {
    title: '数据集',
    icon: 'datasets'
  },
  children: [
    {
      path: 'catalog',
      component: () => import('@/views/datasets/datasetsCatalog.vue'),
      name: 'Catalog',
      meta: {
        title: '目录',
        icon: 'datasets',
      }
    },
    {
      path: 'detail',
      component: () => import('@/views/datasets/datasetsDetail.vue'),
      name: 'Detail',
      meta: {
        title: '可视化',
        icon: 'eye-open',
      }
    },
  ]
}

export default datasets
