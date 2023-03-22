import { App } from 'vue'
import c from './index.vue'

c.name = 'ZXISwitchButton'
c.install = function (app: App) {
  app.component(c.name, c)
}

export type ZXISubaudioDecodingType = InstanceType<typeof c>
export default c
