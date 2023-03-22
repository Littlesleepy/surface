/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-06 15:20:12
 * @FilePath: \zxi-device\src\packages\ZXIIQWave\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIIQWave from './index.vue'

ZXIIQWave.name = 'ZXIIQWave'
ZXIIQWave.install = function (app: App) {
  app.component(ZXIIQWave.name, ZXIIQWave)
}

export type ZXIIQWaveType = InstanceType<typeof ZXIIQWave>
export default ZXIIQWave