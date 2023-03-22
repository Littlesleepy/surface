/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-01 16:44:30
 * @FilePath: \zxi-device\src\packages\ZXICompassControl\index.ts
 * @Description: 
 */
/*
 * @Author: shiershao
 * @Date: 2022-05-26 14:09:09
 * @LastEditTime: 2022-06-07 10:15:59
 * @Description: 
 * 
 */

import { App } from 'vue'
import ZXICompassControl from './index.vue'

ZXICompassControl.name = 'ZXICompassControl'
ZXICompassControl.install = function (app: App) {
  app.component(ZXICompassControl.name, ZXICompassControl)
}

export type ZXICompassControlType = InstanceType<typeof ZXICompassControl>
export default ZXICompassControl