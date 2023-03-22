/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 14:05:42
 * @FilePath: \zxi-device\src\packages\ZXIModulate\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIModulate from './index.vue'

ZXIModulate.name = 'ZXIModulate'
ZXIModulate.install = function (app: App) {
  app.component(ZXIModulate.name, ZXIModulate)
}

export type ZXIModulateType = InstanceType<typeof ZXIModulate>
export default ZXIModulate