/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:28:11
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXINoSampleLines\index.ts
 * @Description: 绘制非抽取类型多线条组合API
 */

import { App } from 'vue'
import ZXINoSampleLines from './index.vue'

ZXINoSampleLines.name = 'ZXINoSampleLines'
ZXINoSampleLines.install = function (app: App) {
  app.component(ZXINoSampleLines.name, ZXINoSampleLines)
}

export type ZXINoSampleLinesType = InstanceType<typeof ZXINoSampleLines>
export default ZXINoSampleLines