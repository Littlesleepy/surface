import { App } from 'vue'
import ZXIScroll from './index.vue'

ZXIScroll.name = 'ZXIScroll'
ZXIScroll.install = function (app: App) {
  app.component(ZXIScroll.name, ZXIScroll)
}

export type ZXIScrollType = InstanceType<typeof ZXIScroll>
export default ZXIScroll