<template>
  <div class="test-login-container">
    <div class="test-header">
      <h1>角色权限测试页面</h1>
      <p>点击下方按钮快速登录不同角色进行测试</p>
    </div>
    
    <div class="role-buttons">
      <div class="role-card">
        <h3>超级管理员</h3>
        <p>拥有所有权限，可以访问所有页面</p>
        <el-button type="primary" @click="loginAsRole('超级管理员', 'admin001')">
          登录超级管理员
        </el-button>
      </div>
      
      <div class="role-card">
        <h3>视频审核员</h3>
        <p>只能访问：首页概况 + 内容管理(视频管理)</p>
        <el-button type="success" @click="loginAsRole('视频审核员', 'shipin001')">
          登录视频审核员
        </el-button>
      </div>
      
      <div class="role-card">
        <h3>运营维护员</h3>
        <p>可以访问：首页概况 + 用户管理(普通用户管理) + 内容管理(视频管理)</p>
        <el-button type="warning" @click="loginAsRole('运营维护员', 'yunying001')">
          登录运营维护员
        </el-button>
      </div>
    </div>
    
    <div class="current-user" v-if="currentUser">
      <h3>当前登录用户</h3>
      <p><strong>用户名：</strong>{{ currentUser.username }}</p>
      <p><strong>角色：</strong>{{ currentUser.role }}</p>
      <el-button type="danger" @click="logout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const currentUser = computed(() => userStore.user)

const loginAsRole = async (role: string, username: string) => {
  try {
    const result = await userStore.login({
      username: username,
      password: '123456'
    })
    
    if (result.success) {
      ElMessage.success(`登录成功！当前角色：${role}`)
      router.push('/')
    } else {
      ElMessage.error('登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error('登录失败')
  }
}

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.test-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.test-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.test-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.test-header p {
  font-size: 16px;
  opacity: 0.9;
}

.role-buttons {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.role-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 250px;
  transition: transform 0.3s ease;
}

.role-card:hover {
  transform: translateY(-5px);
}

.role-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 20px;
}

.role-card p {
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}

.current-user {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 300px;
}

.current-user h3 {
  color: #333;
  margin-bottom: 15px;
}

.current-user p {
  color: #666;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .role-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .role-card {
    min-width: 280px;
  }
}
</style> 