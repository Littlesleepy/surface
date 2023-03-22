/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 09:40:46
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 16:32:11
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\store\index.ts
 * @Description: 
 */
import { defineStore } from 'pinia'
import { useFrameStore } from './modules/frame'
import { useServerStore } from './modules/server'

export * from './modules/frame'
export * from './modules/server'

export const useMainStore = defineStore('main', {
  actions: {
    rootDispose () {
      const frame = useFrameStore()
      frame.reset()

      const server = useServerStore()
      server.reset()
    }
  }
})