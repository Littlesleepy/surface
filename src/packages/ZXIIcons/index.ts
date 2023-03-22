/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-06 14:37:11
 * @FilePath: \zxi-device\src\packages\ZXIIcons\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIIcons from './index.vue'

ZXIIcons.name = 'ZXIIcons'
ZXIIcons.install = function (app: App) {
  app.component(ZXIIcons.name, ZXIIcons)
}

export type ZXIIconsType = InstanceType<typeof ZXIIcons>
export default ZXIIcons