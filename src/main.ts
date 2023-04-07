/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-02 14:40:33
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 10:50:52
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\main.ts
 * @Description: 
 */
import { createApp } from "vue"
import "./assets/styles/reset.css"
import components from '@/components'
import { createPinia } from 'pinia'
import App from "./App.vue"
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import  "./assets/styles/Elstyle/globl.less";
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import UI from './packages'
import './assets/styles/customElement.less'

window.electronAPI.readConfig().then(configStr => {
  window.Config = JSON.parse(configStr)

  createApp(App)
    .use(createPinia())
    .use(router)
    .use(UI)
    .use(components)
    .use(ElementPlus, { locale: zhCn, size: 'large' })
    .mount("#app")
})

// 监听F12切换调试工具
window.addEventListener('keyup', (e) => {
  if (e.key === 'F12' || e.key === 'PageDown') {
    window.electronAPI.toggleDevTools()
  }
})
