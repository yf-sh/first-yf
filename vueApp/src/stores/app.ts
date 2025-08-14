import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 应用store
export const useAppStore = defineStore('app', () => {
  // 状态
  const theme = ref<'light' | 'dark'>('light')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const sidebarCollapsed = ref(false)
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>>([])

  // 计算属性
  const isDarkMode = computed(() => theme.value === 'dark')
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.duration)
  )

  // 方法
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
    
    // 应用主题到body
    document.body.className = theme.value === 'dark' ? 'dark' : ''
  }

  const setLanguage = (lang: 'zh-CN' | 'en-US') => {
    language.value = lang
    localStorage.setItem('language', lang)
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const addNotification = (notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }) => {
    const id = Date.now().toString()
    const newNotification = { id, ...notification }
    
    notifications.value.push(newNotification)
    
    // 如果设置了持续时间，自动移除
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // 初始化
  const init = () => {
    // 从localStorage恢复设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    const savedLanguage = localStorage.getItem('language') as 'zh-CN' | 'en-US'
    
    if (savedTheme) theme.value = savedTheme
    if (savedLanguage) language.value = savedLanguage
    
    // 应用主题
    document.body.className = theme.value === 'dark' ? 'dark' : ''
  }

  return {
    // 状态
    theme,
    language,
    sidebarCollapsed,
    notifications,
    
    // 计算属性
    isDarkMode,
    unreadNotifications,
    
    // 方法
    toggleTheme,
    setLanguage,
    toggleSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    init
  }
}) 