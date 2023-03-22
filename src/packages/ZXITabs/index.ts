import { App } from 'vue'
import ZXITabs from './index.vue'

ZXITabs.name = 'ZXITabs'
ZXITabs.install = function (app: App) {
  app.component(ZXITabs.name, ZXITabs)
}

export type ZXITabsType = InstanceType<typeof ZXITabs>
export default ZXITabs
