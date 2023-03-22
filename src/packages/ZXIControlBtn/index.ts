/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-02 09:16:41
 * @FilePath: \zxi-device\src\packages\ZXIControlBtn\index.ts
 * @Description: 
 */

import { App } from 'vue'
import ZXIControlBtn from './index.vue'

ZXIControlBtn.name = 'ZXIControlBtn'
ZXIControlBtn.install = function (app: App) {
  app.component(ZXIControlBtn.name, ZXIControlBtn)
}

export type ZXIControlBtnType = InstanceType<typeof ZXIControlBtn>
export default ZXIControlBtn