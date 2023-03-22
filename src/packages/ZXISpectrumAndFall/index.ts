/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:30:19
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISpectrumAndFall\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXISpectrumAndFall from './index.vue'

ZXISpectrumAndFall.name = 'ZXISpectrumAndFall'
ZXISpectrumAndFall.install = function (app: App) {
  app.component(ZXISpectrumAndFall.name, ZXISpectrumAndFall)
}

export type ZXISpectrumAndFallType = InstanceType<typeof ZXISpectrumAndFall>
export default ZXISpectrumAndFall