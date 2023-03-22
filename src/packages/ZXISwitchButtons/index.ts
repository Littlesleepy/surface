/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-01 10:17:04
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-01 10:17:37
 * @FilePath: \zxi-deviced:\Zzy\project\mcharts\packages\ZXISwitchButtons\index.ts
 * @Description: 
 */

import { App } from 'vue'
import c from './index.vue'

c.name = 'ZXISwitchButtons'
c.install = function (app: App) {
  app.component(c.name, c)
}

export type ZXISubaudioDecodingType = InstanceType<typeof c>
export default c
