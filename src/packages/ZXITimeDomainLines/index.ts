/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:32:32
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXITimeDomainLines\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXITimeDomainLines from './index.vue'

ZXITimeDomainLines.name = 'ZXITimeDomainLines'
ZXITimeDomainLines.install = function (app: App) {
  app.component(ZXITimeDomainLines.name, ZXITimeDomainLines)
}

export type ZXITimeDomainLinesType = InstanceType<typeof ZXITimeDomainLines>
export default ZXITimeDomainLines

