/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:29:00
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIShortMessage\index.ts
 * @Description: 
 */
/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:13:21
 * @LastEditTime: 2022-06-08 09:13:22
 * @Description: 
 * 
 */

import { App } from 'vue'
import ZXIShortMessage from './index.vue'

ZXIShortMessage.name = 'ZXIShortMessage'
ZXIShortMessage.install = function (app: App) {
  app.component(ZXIShortMessage.name, ZXIShortMessage)
}

export type ZXIShortMessageType = InstanceType<typeof ZXIShortMessage>
export default ZXIShortMessage

