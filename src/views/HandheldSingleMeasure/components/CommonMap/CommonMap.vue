<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-12 15:00:08
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-14 15:05:53
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\components\CommonMap\CommonMap.vue
 * @Description: 
 -->

<script setup lang='ts'>
import { nextTick, onMounted, ref } from 'vue';
import * as Server from '@/server/index'
import { useServerStore } from 'store/index'
import { IServerStateInfo } from '@/types'
import { onBeforeUnmount } from 'vue';
import maplibreGl, { GeoJSONSource } from 'maplibre-gl';
import { mapStyle } from '@/helper';
import lightStyle from '@/assets/mapStyle/light.json'
import { MeasureControl, setDeviceMarker } from './Control';
import 'maplibre-gl/dist/maplibre-gl.css'


const serverStore = useServerStore()
// 长连接获取gps信息
const connection = Server.SignalR({ hub: Server.Hub.taskStatusHub })
connection.start().then(() => {
  console.log('连接' + connection.connectionId + '成功')
})
connection.on('hostInfo', (data: IServerStateInfo) => { // 服务器信息-地图
  serverStore.m_serverStateInfo(data)
})

const mapDom = ref<HTMLDivElement>()
let map: maplibregl.Map
const observer = new ResizeObserver(() => {
  // 当地图容器发生变化时
  // 确保地图更新是再dom变化后 
  // 否则可能会出现 如: 点击全屏控件后 画布在全屏之前就确定了大小 导致全屏后的地图虽然全屏了但是没有全屏:(
  map.resize()
})
onMounted(() => {
  nextTick(() => {
    map = new maplibreGl.Map({
      container: mapDom.value!,
      style: mapStyle(lightStyle)
    })
    observer.observe(mapDom.value!)
    // GABUG 全屏bug
    map
      .addControl(new maplibreGl.FullscreenControl({ container:mapDom.value  }))
      .addControl(new maplibreGl.NavigationControl({ visualizePitch: true }))
      .addControl(new MeasureControl({}, mapDom.value!))
      .addControl(setDeviceMarker(map).locationControl)
  })
})

onBeforeUnmount(() => {
  if (connection) connection.stop()
  observer.unobserve(mapDom.value!)
})

</script>

<template>
  <div>
    <div ref="mapDom" class="mapDom" />
  </div>
</template>

<style scoped lang="less">
.mapDom {
  height: 100%;
  width: 100%;
}
</style>