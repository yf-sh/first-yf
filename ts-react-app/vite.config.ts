import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    proxy:{
      '/api':{
        target:'http://localhost:9527',
        changeOrigin:true,
        // 不重写路径，保持/api前缀
      }
    },
    open:true,
    host:true,
    
  }
})