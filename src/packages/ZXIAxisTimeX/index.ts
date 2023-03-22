import { App } from 'vue'
import ZXIAxisTimeX from './index.vue'

ZXIAxisTimeX.name = 'ZXIAxisTimeX'
ZXIAxisTimeX.install = function (app: App) {
  app.component(ZXIAxisTimeX.name, ZXIAxisTimeX)
}

export type ZXIAxisTimeXType = InstanceType<typeof ZXIAxisTimeX>
export default ZXIAxisTimeX