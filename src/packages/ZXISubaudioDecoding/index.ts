/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:32:18
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISubaudioDecoding\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXISubaudioDecoding from './index.vue'

ZXISubaudioDecoding.name = 'ZXISubaudioDecoding'
ZXISubaudioDecoding.install = function (app: App) {
  app.component(ZXISubaudioDecoding.name, ZXISubaudioDecoding)
}

export type ZXISubaudioDecodingType = InstanceType<typeof ZXISubaudioDecoding>
export default ZXISubaudioDecoding
