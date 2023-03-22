/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:32:11
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIStatisticalY\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIStatisticalY from './index.vue'

ZXIStatisticalY.name = 'ZXIStatisticalY'
ZXIStatisticalY.install = function (app: App) {
  app.component(ZXIStatisticalY.name, ZXIStatisticalY)
}

export type ZXIStatisticalYType = InstanceType<typeof ZXIStatisticalY>
export default ZXIStatisticalY