/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-09 08:51:58
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXIAxisY\index.ts
 * @Description: 
 */
import { App } from 'vue'
import ZXIAxisY from './index.vue'

ZXIAxisY.name = 'ZXIAxisY'
ZXIAxisY.install = function (app: App) {
  app.component(ZXIAxisY.name, ZXIAxisY)
}

export type ZXIAxisYType = InstanceType<typeof ZXIAxisY>
export default ZXIAxisY