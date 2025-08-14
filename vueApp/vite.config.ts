import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // 插件配置
  plugins: [
    vue(),
  ],
  // 路径别名配置
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 开发服务器配置
  server: {
    port: 2929, // 前端开发服务器端口
    open: true, // 自动打开浏览器
    // API代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:9527', // 后端API服务器地址
        changeOrigin: true, // 修改请求头中的Origin
        secure: false // 允许无效证书
      }
    }
  }
})