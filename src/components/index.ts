/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 17:06:21
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-16 13:36:51
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\index.ts
 * @Description: 
 */
import { App } from 'vue'
import BaseMonitorFrame from './BaseMonitorFrame/BaseMonitorFrame.vue'
import BaseFrame from './BaseFrame/BaseFrame.vue'
import BaseTopFrame from './BaseTopFrame/BaseTopFrame.vue'
import BaseParams from './BaseParams/BaseParams.vue'
import BaseDialog from './BaseDialog/BaseDialog.vue'
import BaseParamsBranch from './BaseParamsBranch/BaseParamsBranch.vue'

const components = [
  BaseMonitorFrame,
  BaseFrame,
  BaseTopFrame,
  BaseParams,
  BaseDialog,
  BaseParamsBranch
]

export * from './BaseParams/type'
export * from './BaseServerData'
export * from './BaseParamsBranch/type'
export * from './BaseMonitorFrame/type'
export * from './BaseLink/type'

export default {
  install: (app: App) => {
    components.forEach(component => {
      if (app.component(component.name) === undefined) {
        app.component(component.name, component)
      }
    })
  }
}