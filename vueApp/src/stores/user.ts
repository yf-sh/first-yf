import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户信息接口
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  role: string
}

// 用户store
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || 'guest')

  // 方法
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const login = async (credentials: { username: string; password: string }) => {
    isLoading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟登录成功
      const mockUser: User = {
        id: 1,
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        role: 'user'
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      setUser(mockUser)
      setToken(mockToken)
      
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
    localStorage.removeItem('token')
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

  return {
    // 状态
    user,
    token,
    isLoading,
    
    // 计算属性
    isLoggedIn,
    userRole,
    
    // 方法
    setUser,
    setToken,
    login,
    logout,
    updateProfile
  }
}) 