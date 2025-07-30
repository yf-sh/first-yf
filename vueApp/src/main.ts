import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'


const app = createApp(App)


// 导入
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 注册 element-plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(createPinia())
app.use(ElementPlus)
app.use(router)

app.mount('#app')