import {
  createRouter,
  createWebHistory
  // createWebHashHistory
} from 'vue-router'

import datasets from './modules/datasets'
import sqlStudio from './modules/sqlStudio'

import Layout from '@/layout/index.vue'
import {
  Document,
  ChatRound,
} from '@element-plus/icons-vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/account/login',
      name: 'login',
      hidden: true,
      component: () => import('@/views/account/login.vue'),
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [{
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '首页',
          icon: 'home',
          keepAlive: true,
          affix: true
        }
      }, ]
    },
    datasets,
    sqlStudio,
    {
      path: '/about',
      component: Layout,
      redirect: '/about/readme',
      meta: {
        alwaysShow: true,
        title: 'About',
        icon: 'about'
      },
      children: [{
        path: 'readme',
        name: 'Readme',
        component: () => import('@/views/about/readme.vue'),
        meta: {
          title: 'Readme',
          icon: Document
        }
      }, {
        path: 'changelog',
        name: 'Changelog',
        component: () => import('@/views/about/changelog.vue'),
        meta: {
          title: 'Changelog',
          icon: ChatRound
        }
      }]
    },
    {
      path: '/404',
      component: () => import('@/views/error-page/404.vue'),
      hidden: true
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
      hidden: true
    },
  ],
})

export const resetRouter = () => {
  // console.log(router)
}

export default router
