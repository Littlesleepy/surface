import { App } from 'vue'
import ZXIToolTipInfo from './index.vue'

ZXIToolTipInfo.name = 'ZXIToolTipInfo'
ZXIToolTipInfo.install = function (app: App) {
  app.component(ZXIToolTipInfo.name, ZXIToolTipInfo)
}

export type ZXIToolTipInfoType = InstanceType<typeof ZXIToolTipInfo>
export default ZXIToolTipInfo