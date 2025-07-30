import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: '首页'
    },
    children: [
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/UsersManage.vue')
      },
      {
        path: 'up',
        name: 'up',
        component: () => import('../views/UpManage.vue')
      },
      {
        path: 'clip',
        name: 'clip',
        component: () => import('../views/ClipManage.vue')
      },
      {
        path: 'live',
        name: 'live',
        component: () => import('../views/LiveManage.vue')
      },
      {
        path: 'first',
        name: 'first',
        component: () => import('../views/FirstView.vue')
      }
    ]
  },
  
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 这里可以添加认证逻辑
    // 例如检查用户是否已登录
    const token = localStorage.getItem('token')
    if (!token) {
      next('/')
      return
    }
  }
  
  next()
})

export default router 