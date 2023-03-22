/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 13:45:05
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISpectrumScanAndFall\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXISpectrumScanAndFall from './index.vue'

ZXISpectrumScanAndFall.name = 'ZXISpectrumScanAndFall'
ZXISpectrumScanAndFall.install = function (app: App) {
  app.component(ZXISpectrumScanAndFall.name, ZXISpectrumScanAndFall)
}

export type ZXISpectrumScanAndFallType = InstanceType<typeof ZXISpectrumScanAndFall>
export default ZXISpectrumScanAndFall