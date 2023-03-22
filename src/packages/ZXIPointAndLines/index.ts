/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:28:21
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIPointAndLines\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIPointAndLines from './index.vue'

ZXIPointAndLines.name = 'ZXIPointAndLines'
ZXIPointAndLines.install = function (app: App) {
  app.component(ZXIPointAndLines.name, ZXIPointAndLines)
}

export type ZXIPointAndLinesType = InstanceType<typeof ZXIPointAndLines>
export default ZXIPointAndLines