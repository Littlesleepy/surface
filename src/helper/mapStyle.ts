/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-24 16:49:37
 * @FilePath: \zxi-device\src\helper\mapStyle.ts
 * @Description: 
 */

import { useServerStore } from '@/store'
import { StyleSpecification, VectorSourceSpecification } from 'maplibre-gl'
import { computed } from 'vue'

function mapStyle (stlye: any, options?: {
  zoom?: number,
  center?: number[]
}) {
  const serverStore = useServerStore()
  const devicePosition = computed(() => serverStore.s_serverStateInfo.gpsLocation)
  
  const changeStyle = stlye as StyleSpecification

  if (!changeStyle.sprite!.includes('http')) changeStyle.sprite! = location.origin + '/' + changeStyle.sprite!

  const openmaptiles = changeStyle.sources.openmaptiles as VectorSourceSpecification

  const mapConfig = Config.map

  changeStyle.center = mapConfig.center
  changeStyle.zoom = mapConfig.zoom

  if (devicePosition.value.latitude !== 0 && devicePosition.value.longitude !== 0) {
    changeStyle.center = [devicePosition.value.longitude, devicePosition.value.latitude]
  }

  if (options) {
    if (options.zoom) changeStyle.zoom = options.zoom
    if (options.center) changeStyle.center = options.center
  }

  if (mapConfig.sourceUrl) {
    openmaptiles.url = mapConfig.sourceUrl
  } else {
    openmaptiles.url = location.origin + '/api/Map/json'
  }

  return changeStyle
}

export { mapStyle }
