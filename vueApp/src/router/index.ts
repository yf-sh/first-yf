import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('../views/TestLogin.vue'),
    meta: {
      title: '登录测试'
    }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: '首页',
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/UsersManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员', '运营维护员']
        }
      },
      {
        path: 'up',
        name: 'up',
        component: () => import('../views/UpManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员']
        }
      },
      {
        path: 'role',
        name: 'role',
        component: () => import('../views/RoleManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员']
        }
      },
      {
        path: 'permission',
        name: 'permission',
        component: () => import('../views/PermissionManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员']
        }
      },
      {
        path: 'clip',
        name: 'clip',
        component: () => import('../views/ClipManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员', '视频审核员', '运营维护员']
        }
      },
      {
        path: 'live',
        name: 'live',
        component: () => import('../views/LiveManage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员']
        }
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['超级管理员', '视频审核员', '运营维护员']
        }
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
    const userStore = useUserStore()
    
    // 检查用户是否已登录（包括token过期检查）
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }

    // 检查角色权限
    const userRole = userStore.userRole
    
    // 如果路由有角色限制
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const allowedRoles = to.meta.roles as string[]
      if (!allowedRoles.includes(userRole)) {
        // 用户没有权限访问此页面，重定向到首页
        next('/')
        return
      }
    }
  }
  
  next()
})

export default router 