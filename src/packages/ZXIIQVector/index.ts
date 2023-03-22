import { App } from 'vue'
import ZXIIQVector from './index.vue'

ZXIIQVector.name = 'ZXIIQVector'
ZXIIQVector.install = function (app: App) {
  app.component(ZXIIQVector.name, ZXIIQVector)
}

export type ZXIIQVectorType = InstanceType<typeof ZXIIQVector>
export default ZXIIQVector