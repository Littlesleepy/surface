/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:28:38
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIRaindrop\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXIRaindrop from './index.vue'

ZXIRaindrop.name = 'ZXIRaindrop'
ZXIRaindrop.install = function (app: App) {
  app.component(ZXIRaindrop.name, ZXIRaindrop)
}

export type ZXIRaindropType = InstanceType<typeof ZXIRaindrop>
export default ZXIRaindrop