/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:32:41
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXITv\index.ts
 * @Description: 模拟电视
 */

import { App } from 'vue'
import ZXITv from './index.vue'

ZXITv.name = 'ZXITv'
ZXITv.install = function (app: App) {
  app.component(ZXITv.name, ZXITv)
}

export type ZXITvType = InstanceType<typeof ZXITv>
export default ZXITv


