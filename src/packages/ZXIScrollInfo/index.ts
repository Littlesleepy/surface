/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-07 15:37:38
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 15:37:59
 * @FilePath: \zxi-device\src\packages\ZXIScrollInfo\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXIScrollInfo from './index.vue'

ZXIScrollInfo.name = 'ZXIScrollInfo'
ZXIScrollInfo.install = function (app: App) {
  app.component(ZXIScrollInfo.name, ZXIScrollInfo)
}

export type ZXIScrollInfoType = InstanceType<typeof ZXIScrollInfo>
export default ZXIScrollInfo