/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 17:20:46
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIAxisX\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXIAxisX from './index.vue'

ZXIAxisX.name = 'ZXIAxisX'
ZXIAxisX.install = function (app: App) {
  app.component(ZXIAxisX.name, ZXIAxisX)
}

export type ZXIAxisXType = InstanceType<typeof ZXIAxisX>
export default ZXIAxisX