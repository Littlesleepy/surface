/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:54
 * @LastEditTime: 2022-07-22 10:17:19
 * @Description: 
 * 
 */

import { App } from 'vue'
import ZXILevel from './index.vue'

ZXILevel.name = 'ZXILevel'
ZXILevel.install = function (app: App) {
  app.component(ZXILevel.name, ZXILevel)
}

export type ZXILevelType = InstanceType<typeof ZXILevel>
export default ZXILevel