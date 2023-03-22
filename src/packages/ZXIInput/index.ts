/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-17 13:28:27
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-21 11:41:41
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXIInput\index.ts
 * @Description: 
 */
import { App } from 'vue'
import c from './index.vue'

c.install = function (app: App) {
  app.component(c.name, c)
}

export default c