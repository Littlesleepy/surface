/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:27:47
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIMenu\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIMenu from './index.vue'

ZXIMenu.name = 'ZXIMenu'
ZXIMenu.install = function (app: App) {
  app.component(ZXIMenu.name, ZXIMenu)
}

export type ZXIMenuType = InstanceType<typeof ZXIMenu>
export default ZXIMenu