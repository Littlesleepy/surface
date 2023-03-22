/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:27:39
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXILightLines\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXILightLines from './index.vue'

ZXILightLines.name = 'ZXILightLines'
ZXILightLines.install = function (app: App) {
  app.component(ZXILightLines.name, ZXILightLines)
}

export type ZXILightLinesType = InstanceType<typeof ZXILightLines>
export default ZXILightLines
