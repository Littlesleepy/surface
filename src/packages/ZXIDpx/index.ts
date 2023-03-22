/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 16:15:45
 * @FilePath: \zxi-device\src\packages\ZXIDpx\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIDpx from './index.vue'

ZXIDpx.name = 'ZXIDpx'
ZXIDpx.install = function (app: App) {
  app.component(ZXIDpx.name, ZXIDpx)
}

export type ZXIDpxType = InstanceType<typeof ZXIDpx>
export default ZXIDpx