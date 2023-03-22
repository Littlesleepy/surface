import { App } from 'vue'
import ZXILevelPillar from './index.vue'

ZXILevelPillar.name = 'ZXILevelPillar'
ZXILevelPillar.install = function (app: App) {
  app.component(ZXILevelPillar.name, ZXILevelPillar)
}

export type ZXILevelPillarType = InstanceType<typeof ZXILevelPillar>
export default ZXILevelPillar