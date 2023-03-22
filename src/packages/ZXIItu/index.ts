/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 17:18:01
 * @FilePath: \zxi-device\src\packages\ZXIItu\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIItu from './index.vue'

ZXIItu.name = 'ZXIItu'
ZXIItu.install = function (app: App) {
  app.component(ZXIItu.name, ZXIItu)
}

export type ZXIItuType = InstanceType<typeof ZXIItu>
export default ZXIItu

