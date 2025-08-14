import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户信息接口
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  role: string
  permissions?: string[]
}

// 角色权限配置
export const ROLE_PERMISSIONS = {
  '超级管理员': {
    name: '超级管理员',
    permissions: ['all'], // 所有权限
    menuItems: [
      { path: '/', title: '首页概括', icon: 'location' },
      { 
        path: '/users', 
        title: '用户管理', 
        icon: 'user',
        children: [
          { path: '/users', title: '普通用户管理' },
          { path: '/up', title: '后台管理' },
          { path: '/role', title: '角色管理' },
          { path: '/permission', title: '权限管理' }
        ]
      },
      { 
        path: '/clip', 
        title: '内容管理', 
        icon: 'document',
        children: [
          { path: '/clip', title: '视频管理' }
        ]
      }
    ]
  },
  '视频审核员': {
    name: '视频审核员',
    permissions: ['content', 'video'],
    menuItems: [
      { path: '/', title: '数据概览', icon: 'location' },
      { path: '/first', title: '首页概况', icon: 'location' },
      { 
        path: '/clip', 
        title: '内容管理', 
        icon: 'document',
        children: [
          { path: '/clip', title: '视频管理' }
        ]
      }
    ]
  },
  '运营维护员': {
    name: '运营维护员',
    permissions: ['user', 'content', 'video'],
    menuItems: [
      { path: '/', title: '数据概览', icon: 'location' },
      { path: '/first', title: '首页概况', icon: 'location' },
      { 
        path: '/users', 
        title: '用户管理', 
        icon: 'user',
        children: [
          { path: '/users', title: '普通用户管理' }
        ]
      },
      { 
        path: '/clip', 
        title: '内容管理', 
        icon: 'document',
        children: [
          { path: '/clip', title: '视频管理' }
        ]
      }
    ]
  }
}

// 用户store
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const tokenExpiry = ref<number | null>(null)
  
  // 从localStorage初始化token和过期时间
  const initTokenFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedExpiry = localStorage.getItem('tokenExpiry')
    
    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry)
      const now = Date.now()
      
      // 检查token是否过期
      if (now < expiryTime) {
        token.value = storedToken
        tokenExpiry.value = expiryTime
      } else {
        // token已过期，清除存储
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiry')
        localStorage.removeItem('userInfo')
      }
    }
  }

  // 计算属性
  const isLoggedIn = computed(() => {
    if (!token.value || !user.value) return false
    
    // 检查token是否过期
    if (tokenExpiry.value && Date.now() >= tokenExpiry.value) {
      // token已过期，自动登出
      logout()
      return false
    }
    
    return true
  })
  
  const userRole = computed(() => user.value?.role || 'guest')
  
  // 检查token是否即将过期（提前5分钟提醒）
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiry.value) return false
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() >= (tokenExpiry.value - fiveMinutes)
  })
  
  // 获取剩余时间（分钟）
  const getRemainingTime = computed(() => {
    if (!tokenExpiry.value) return 0
    const remaining = tokenExpiry.value - Date.now()
    return Math.max(0, Math.floor(remaining / (60 * 1000)))
  })
  
  // 获取用户菜单权限
  const userMenuItems = computed(() => {
    const role = user.value?.role
    if (!role || !ROLE_PERMISSIONS[role]) {
      return []
    }
    return ROLE_PERMISSIONS[role].menuItems
  })

  // 检查用户是否有特定权限
  const hasPermission = (permission: string) => {
    const role = user.value?.role
    if (!role || !ROLE_PERMISSIONS[role]) {
      return false
    }
    const permissions = ROLE_PERMISSIONS[role].permissions
    return permissions.includes('all') || permissions.includes(permission)
  }

  // 检查用户是否可以访问特定路由
  const canAccessRoute = (routePath: string) => {
    const role = user.value?.role
    if (!role || !ROLE_PERMISSIONS[role]) {
      return false
    }
    
    // 超级管理员可以访问所有路由
    if (role === '超级管理员') {
      return true
    }
    
    // 其他角色根据菜单项判断
    const menuItems = ROLE_PERMISSIONS[role].menuItems
    const allPaths = menuItems.flatMap(item => {
      const paths = [item.path]
      if (item.children) {
        paths.push(...item.children.map(child => child.path))
      }
      return paths
    })
    
    return allPaths.includes(routePath)
  }

  // 方法
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    // 设置12小时过期时间
    const expiryTime = Date.now() + (12 * 60 * 60 * 1000)
    tokenExpiry.value = expiryTime
    
    localStorage.setItem('token', newToken)
    localStorage.setItem('tokenExpiry', expiryTime.toString())
  }

  // 从localStorage初始化用户信息
  const initUserFromStorage = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        const userData = JSON.parse(storedUserInfo)
        // 创建用户对象
        const userObj: User = {
          id: 1,
          username: userData.username || 'admin',
          email: `${userData.username || 'admin'}@example.com`,
          role: userData.role || '超级管理员'
        }
        user.value = userObj
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
  }
  
  // 初始化时从localStorage加载token和用户信息
  const initFromStorage = () => {
    initTokenFromStorage()
    initUserFromStorage()
  }

  const login = async (credentials: { username: string; password: string }) => {
    isLoading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 根据用户名判断角色（实际项目中应该从后端获取）
      let role = '超级管理员'
      if (credentials.username.includes('shipin')) {
        role = '视频审核员'
      } else if (credentials.username.includes('yunying')) {
        role = '运营维护员'
      }
      
      // 模拟登录成功
      const mockUser: User = {
        id: 1,
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        role: role
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      setUser(mockUser)
      setToken(mockToken)
      
      // 保存用户信息到localStorage
      localStorage.setItem('userInfo', JSON.stringify(mockUser))
      
      return { success: true, user: mockUser }
    } catch (error) {
      return { success: false, error: '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    tokenExpiry.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpiry')
    localStorage.removeItem('userInfo')
  }

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user.value) return { success: false, error: '用户未登录' }
    
    isLoading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新用户信息
      user.value = { ...user.value, ...profileData }
      
      return { success: true, user: user.value }
    } catch (error) {
      return { success: false, error: '更新失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 初始化时从localStorage加载token和用户信息
  initFromStorage()

  return {
    // 状态
    user,
    token,
    isLoading,
    tokenExpiry,
    
    // 计算属性
    isLoggedIn,
    userRole,
    userMenuItems,
    isTokenExpiringSoon,
    getRemainingTime,
    
    // 方法
    setUser,
    setToken,
    login,
    logout,
    updateProfile,
    initFromStorage,
    hasPermission,
    canAccessRoute
  }
}) 