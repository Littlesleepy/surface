/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-03 15:46:43
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 15:47:24
 * @FilePath: \zxi-device\src\packages\ZXICountLines\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXICountLines from './index.vue'

ZXICountLines.name = 'ZXICountLines'
ZXICountLines.install = function (app: App) {
  app.component(ZXICountLines.name, ZXICountLines)
}

export type ZXICountLinesType = InstanceType<typeof ZXICountLines>
export default ZXICountLines