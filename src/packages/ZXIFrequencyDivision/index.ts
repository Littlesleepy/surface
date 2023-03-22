/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-06 14:18:22
 * @FilePath: \zxi-device\src\packages\ZXIFrequencyDivision\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIFrequencyDivision from './index.vue'

ZXIFrequencyDivision.name = 'ZXIFrequencyDivision'
ZXIFrequencyDivision.install = function (app: App) {
  app.component(ZXIFrequencyDivision.name, ZXIFrequencyDivision)
}

export type ZXIFrequencyDivisionType = InstanceType<typeof ZXIFrequencyDivision>
export default ZXIFrequencyDivision