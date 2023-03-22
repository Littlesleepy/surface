/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-06 14:24:44
 * @FilePath: \zxi-device\src\packages\ZXIHighlight\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIHighlight from './index.vue'

ZXIHighlight.name = 'ZXIHighlight'
ZXIHighlight.install = function (app: App) {
  app.component(ZXIHighlight.name, ZXIHighlight)
}

export type ZXIHighlightType = InstanceType<typeof ZXIHighlight>
export default ZXIHighlight
