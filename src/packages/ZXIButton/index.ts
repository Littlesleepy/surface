import { App } from 'vue'
import c from './index.vue'
c.install = function (app: App) {
  app.component(c.name, c)
}

export type ZXICompassType = InstanceType<typeof c>
export default c