/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:25:15
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIEye\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIEye from './index.vue'

ZXIEye.name = 'ZXIEye'
ZXIEye.install = function (app: App) {
  app.component(ZXIEye.name, ZXIEye)
}

export type ZXIEyeType = InstanceType<typeof ZXIEye>
export default ZXIEye