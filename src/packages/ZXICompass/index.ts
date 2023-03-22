import { App } from 'vue'
import ZXICompass from './index.vue'

ZXICompass.name = 'ZXICompass'
ZXICompass.install = function (app: App) {
  app.component(ZXICompass.name, ZXICompass)
}

export type ZXICompassType = InstanceType<typeof ZXICompass>
export default ZXICompass