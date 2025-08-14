<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="stars"></div>
    <div class="planet"></div>
    <div class="landscape"></div>
    
    <!-- 头部标题 -->
    <div class="header">
      <h1 class="system-title">XX视频后台管理系统</h1>
    </div>
    
    <!-- 登录表单 -->
    <div class="login-form">
      <h2 class="login-title">登录</h2>
      <p class="welcome-text">欢迎回来!</p>
      
      <form @submit.prevent="handleLogin" class="form">
        <!-- 账号输入框 -->
        <div class="input-group">
          <input
            v-model="formData.username"
            type="text"
            placeholder="账号"
            class="input-field"
            required
          />
        </div>
        
        <!-- 密码输入框 -->
        <div class="input-group">
          <input
            v-model="formData.password"
            type="password"
            placeholder="密码"
            class="input-field"
            required
          />
        </div>
        
        <!-- 图片验证码 -->
        <div class="input-group captcha-group">
          <input
            v-model="formData.captcha"
            type="text"
            placeholder="图片验证码"
            class="input-field captcha-input"
            required
          />
          <div class="captcha-image" @click="refreshCaptcha">
            <span class="captcha-text">{{ captchaText }}</span>
          </div>
        </div>
        
        <!-- 链接区域 -->
        <div class="links">
          <a href="#" class="link">忘记密码</a>
        </div>
        
        <!-- 登录按钮 -->
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive<{
  username: string
  password: string
  captcha: string
}>({
  username: '',
  password: '',
  captcha: ''
})

// 加载状态
const loading = ref<boolean>(false)

// 验证码
const captchaText = ref<string>('X NE')

// 处理登录
const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    ElMessage.error('请输入账号和密码')
    return
  }

  if (!formData.captcha) {
    ElMessage.error('请输入验证码')
    return
  }

  // 验证验证码
  if (formData.captcha.toUpperCase() !== captchaText.value) {
    ElMessage.error('验证码错误')
    return
  }

  loading.value = true

  try {
    const result = await userStore.login({
      username: formData.username,
      password: formData.password
    })
    
    if (result.success) {
      ElMessage.success('登录成功！')
      
      // 跳转到首页
      router.push('/')
    } else {
      ElMessage.error(result.error || '登录失败')
    }
  } catch (error: any) {
    console.error('登录错误:', error)
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  // 生成随机验证码（4位字母数字组合）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = result
  
  // 清空验证码输入框
  formData.captcha = ''
}

// 页面加载时生成初始验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 背景装饰 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
    radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
  background-repeat: repeat;
  background-size: 200px 100px;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.planet {
  position: absolute;
  bottom: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle at 30% 30%, #2c3e50, #34495e, #2c3e50);
  border-radius: 50%;
  box-shadow: 
    inset -20px -20px 40px rgba(0,0,0,0.5),
    0 0 50px rgba(52, 73, 94, 0.3);
}

.landscape {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to top, #1a1a2e, transparent);
  clip-path: polygon(0 100%, 100% 100%, 100% 60%, 80% 40%, 60% 60%, 40% 40%, 20% 60%, 0 40%);
}

/* 头部标题 */
.header {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 10;
}

.system-title {
  color: white;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

/* 登录表单 */
.login-form {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 600px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 5;
  position: relative;
}

.login-title {
  color: white;
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(255,255,255,0.3);
}

.welcome-text {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0 0 30px 0;
  font-size: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.input-field::placeholder {
  color: #999;
}

/* 验证码样式 */
.captcha-group {
  display: flex;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 80px;
  height: 50px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.captcha-image:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.captcha-text {
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}

/* 链接样式 */
.links {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.link:hover {
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-form {
    width: 90%;
    padding: 30px 20px;
  }
  
  .login-title {
    font-size: 28px;
  }
  
  .planet {
    width: 200px;
    height: 200px;
    bottom: -50px;
    right: -50px;
  }
}
</style> 