/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-01 14:29:35
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-01 14:33:12
 * @FilePath: \zxi-device\src\packages\ZXIAxisTimeY\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXIAxisTimeY from './index.vue'

ZXIAxisTimeY.name = 'ZXIAxisTimeY'
ZXIAxisTimeY.install = function (app: App) {
  app.component(ZXIAxisTimeY.name, ZXIAxisTimeY)
}

export type ZXIAxisTimeYType = InstanceType<typeof ZXIAxisTimeY>
export default ZXIAxisTimeY