/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:28:45
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISampleLines\index.ts
 * @Description: 绘制抽取类型多线条组合API
 */

import { App } from 'vue'
import ZXISampleLines from './index.vue'

ZXISampleLines.name = 'ZXISampleLines'
ZXISampleLines.install = function (app: App) {
  app.component(ZXISampleLines.name, ZXISampleLines)
}

export type ZXISampleLinesType = InstanceType<typeof ZXISampleLines>
export default ZXISampleLines

