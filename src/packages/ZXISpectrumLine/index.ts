/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 15:52:48
 * @FilePath: \zxi-device\src\packages\ZXISpectrumLine\index.ts
 * @Description: 多频谱线
 */

import { App } from 'vue'
import ZXISpectrumLine from './index.vue'

ZXISpectrumLine.name = 'ZXISpectrumLine'
ZXISpectrumLine.install = function (app: App) {
  app.component(ZXISpectrumLine.name, ZXISpectrumLine)
}

export type ZXISpectrumLineType = InstanceType<typeof ZXISpectrumLine>
export default ZXISpectrumLine