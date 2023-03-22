/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:30:37
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISpectrumLines\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXISpectrumLines from './index.vue'

ZXISpectrumLines.name = 'ZXISpectrumLines'
ZXISpectrumLines.install = function (app: App) {
  app.component(ZXISpectrumLines.name, ZXISpectrumLines)
}

export type ZXISpectrumLinesType = InstanceType<typeof ZXISpectrumLines>
export default ZXISpectrumLines
