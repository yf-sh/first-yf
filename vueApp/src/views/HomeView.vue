<template>
    <div class="home_layout">
        <!-- 顶部导航栏 -->
        <header class="header">
            <div class="header-left">
                <h1>XX视频 | 后台管理系统</h1>
                <p class="header-subtitle">background management system</p>
            </div>
            <div class="header-right">
                <el-dropdown @command="handleCommand" trigger="click">
                    <div class="user-info">
                        <el-avatar :size="32" :src="userAvatar">
                            {{ userInitials }}
                        </el-avatar>
                        <span class="username">{{ username }}</span>
                        <span class="user-role">({{ userRole }})</span>
                        <el-icon class="dropdown-icon">
                            <arrow-down />
                        </el-icon>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="switchAccount">
                                <el-icon><switch-button /></el-icon>
                                切换账号
                            </el-dropdown-item>
                            <el-dropdown-item command="logout" divided>
                                <el-icon><switch-button /></el-icon>
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </header>
        
        <!-- Token过期提醒 -->
        <el-alert
            v-if="isTokenExpiringSoon"
            title="登录即将过期"
            :description="`您的登录将在 ${remainingTime} 分钟后过期，请及时保存工作并重新登录`"
            type="warning"
            :closable="false"
            show-icon
            class="token-expiry-alert"
        >
            <template #default>
                <el-button size="small" type="primary" @click="refreshToken">
                    刷新登录
                </el-button>
            </template>
        </el-alert>
        
        <div class="home_content">
            <!-- 左侧边栏 -->
            <div class="home_menu">
                <!-- 时间显示区域 -->
                <div class="time-section">
                    <div class="time-display">
                        <div class="weekday">{{ currentWeekday }}</div>
                        <div class="time">{{ currentTime }}</div>
                        <div class="date">{{ currentDate }}</div>
                    </div>
                </div>
                
                <!-- 导航菜单 -->
                <el-menu 
                    default-active="/" 
                    class="el-menu-vertical-demo" 
                    :collapse="isCollapse" 
                    @open="handleOpen"
                    @close="handleClose"
                    router="true"
                    background-color="#2c3e50"
                    text-color="#ecf0f1"
                    active-text-color="#3498db"
                >
                    <!-- 动态生成菜单项 -->
                    <template v-for="menuItem in userMenuItems">
                        <!-- 有子菜单的情况 -->
                        <el-sub-menu v-if="menuItem.children && menuItem.children.length > 0" :index="menuItem.path" :key="'sub-' + menuItem.path">
                            <template #title>
                                <el-icon>
                                    <component :is="getIcon(menuItem.icon)" />
                                </el-icon>
                                <span>{{ menuItem.title }}</span>
                            </template>
                            <el-menu-item 
                                v-for="child in menuItem.children" 
                                :key="child.path"
                                :index="child.path"
                            >
                                {{ child.title }}
                            </el-menu-item>
                        </el-sub-menu>
                        
                        <!-- 没有子菜单的情况 -->
                        <el-menu-item v-else :index="menuItem.path" :key="'item-' + menuItem.path">
                            <template #title>
                                <el-icon>
                                    <component :is="getIcon(menuItem.icon)" />
                                </el-icon>
                                <span>{{ menuItem.title }}</span>
                            </template>
                        </el-menu-item>
                    </template>
                </el-menu>
            </div>
            
            <!-- 主内容区域 -->
            <div class="main-content">
                <router-view></router-view>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'

import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
    ArrowDown,
    SwitchButton,
    User,
} from '@element-plus/icons-vue'

const isCollapse = ref(false)
const router = useRouter()
const userStore = useUserStore()

// 时间相关
const currentTime = ref('')
const currentDate = ref('')
const currentWeekday = ref('')

// 用户信息
const username = computed(() => userStore.user?.username || '用户')
const userRole = computed(() => userStore.userRole)
const userAvatar = ref('')

// 获取用户菜单项
const userMenuItems = computed(() => userStore.userMenuItems)

// 计算用户头像的初始字母
const userInitials = computed(() => {
    if (username.value) {
        return username.value.charAt(0).toUpperCase()
    }
    return 'U'
})

// 获取图标组件
const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
        'location': Location,
        'user': User,
        'document': Document,
        'setting': Setting,
        'menu': IconMenu
    }
    return iconMap[iconName] || Location
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
    switch (command) {
        case 'switchAccount':
            await handleSwitchAccount()
            break
        case 'logout':
            await handleLogout()
            break
    }
}

// 切换账号
const handleSwitchAccount = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要切换账号吗？当前账号将退出登录。',
            '切换账号',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 清除用户信息
        userStore.logout()
        
        ElMessage.success('已退出当前账号')
        
        // 跳转到登录页面
        router.push('/login')
    } catch {
        // 用户取消操作
    }
}

// 退出登录
const handleLogout = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要退出登录吗？',
            '退出登录',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        // 调用退出登录API
        try {
            // 这里可以调用后端的退出登录API
            // await authApi.logout()
        } catch (error) {
            console.error('退出登录API调用失败:', error)
        }
        
        // 清除用户信息
        userStore.logout()
        
        ElMessage.success('已退出登录')
        
        // 跳转到登录页面
        router.push('/login')
    } catch {
        // 用户取消操作
    }
}

// 更新时间显示
const updateTime = () => {
    const now = new Date()
    
    // 更新星期
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    currentWeekday.value = weekdays[now.getDay()]
    
    // 更新时间
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    currentTime.value = `${hours}:${minutes}:${seconds}`
    
    // 更新日期
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    currentDate.value = `${year}-${month}-${day}`
}

// 获取用户信息
const getUserInfo = () => {
    // 从store获取用户信息，如果store中没有则从localStorage初始化
    if (!userStore.user) {
        userStore.initFromStorage()
    }
}

// Token过期检查相关
const isTokenExpiringSoon = computed(() => userStore.isTokenExpiringSoon)
const remainingTime = computed(() => userStore.getRemainingTime)

// 刷新token（重新登录）
const refreshToken = () => {
    ElMessageBox.confirm(
        '登录即将过期，需要重新登录。确定要跳转到登录页面吗？',
        '登录过期提醒',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        userStore.logout()
        router.push('/login')
    }).catch(() => {
        // 用户取消操作
    })
}

const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

// 页面加载时获取用户信息
onMounted(() => {
    getUserInfo()
    updateTime()
    // 每秒更新时间
    setInterval(updateTime, 1000)
})
</script>

<style>
* {
    margin: 0;
    padding: 0;
}

.home_layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Token过期提醒样式 */
.token-expiry-alert {
    margin: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
}

/* 顶部导航栏样式 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 60px;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-bottom: 1px solid #34495e;
}

.header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.header-left h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #ecf0f1;
}

.header-subtitle {
    font-size: 12px;
    color: #bdc3c7;
    margin: 0;
    margin-top: 2px;
}

.header-right {
    display: flex;
    align-items: center;
}

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    transition: background-color 0.3s;
    gap: 8px;
}

.user-info:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.username {
    font-size: 14px;
    font-weight: 500;
    color: #ecf0f1;
}

.user-role {
    font-size: 12px;
    color: #bdc3c7;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.dropdown-icon {
    font-size: 12px;
    color: #bdc3c7;
    transition: transform 0.3s;
}

.user-info:hover .dropdown-icon {
    transform: rotate(180deg);
}

/* 主内容区域布局 */
.home_content {
    display: flex;
    height: calc(100vh - 60px);
    background: #f5f5f5;
}

/* 左侧边栏样式 */
.home_menu {
    width: 240px;
    height: 100%;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-right: 1px solid #34495e;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 4px rgba(0,0,0,0.1);
}

/* 时间显示区域 */
.time-section {
    padding: 20px;
    border-bottom: 1px solid #34495e;
    background: rgba(52, 73, 94, 0.8);
}

.time-display {
    text-align: center;
}

.weekday {
    font-size: 16px;
    font-weight: 600;
    color: #ecf0f1;
    margin-bottom: 8px;
}

.time {
    font-size: 24px;
    font-weight: 700;
    color: #3498db;
    margin-bottom: 4px;
    font-family: 'Courier New', monospace;
}

.date {
    font-size: 14px;
    color: #bdc3c7;
    font-family: 'Courier New', monospace;
}

/* 菜单样式 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 240px;
    min-height: 400px;
    border-right: none;
}

.el-menu-vertical-demo {
    flex: 1;
    border-right: none;
}

.el-menu-vertical-demo .el-menu-item {
    height: 50px;
    line-height: 50px;
    border-bottom: 1px solid #34495e;
    margin: 0;
    padding: 0 20px;
}

.el-menu-vertical-demo .el-sub-menu__title {
    height: 50px;
    line-height: 50px;
    border-bottom: 1px solid #34495e;
    margin: 0;
    padding: 0 20px;
}

.el-menu-vertical-demo .el-menu-item:hover,
.el-menu-vertical-demo .el-sub-menu__title:hover {
    background-color: #34495e;
    color: #3498db;
}

.el-menu-vertical-demo .el-menu-item.is-active {
    background-color: #3498db;
    color: #ffffff;
    border-right: 3px solid #2980b9;
}

/* 主内容区域 */
.main-content {
    flex: 1;
    background: #f5f5f5;
    overflow: auto;
    padding: 20px;
}

/* 下拉菜单样式 */
.el-dropdown-menu {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.el-dropdown-menu__item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
}

.el-dropdown-menu__item .el-icon {
    margin-right: 8px;
    font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .home_menu {
        width: 200px;
    }
    
    .el-menu-vertical-demo:not(.el-menu--collapse) {
        width: 200px;
    }
}

@media (max-width: 768px) {
    .header {
        padding: 0 16px;
    }
    
    .header-left h1 {
        font-size: 16px;
    }
    
    .header-subtitle {
        font-size: 11px;
    }
    
    .home_menu {
        width: 180px;
    }
    
    .el-menu-vertical-demo:not(.el-menu--collapse) {
        width: 180px;
    }
    
    .main-content {
        padding: 16px;
    }
    
    .user-info {
        padding: 6px 8px;
        gap: 6px;
    }
    
    .username {
        font-size: 13px;
    }
    
    .user-role {
        font-size: 11px;
        padding: 1px 4px;
    }
}
</style>