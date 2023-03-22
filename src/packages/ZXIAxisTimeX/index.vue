<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-01 15:13:20
 * @Description: 时间流动类型X轴
 * 
-->

<script setup lang="ts">
import { effectScope, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { Axis, AxisType, FluidFenceType, Scene } from '../core'
import { UseTheme } from '../styles'
import * as Helper from '../helper'

interface ZXIAxisTimeXProps {
  timeBuffer: Map<string, Array<{ time: Date }>>
  scene?: Scene
}

const props = withDefaults(defineProps<ZXIAxisTimeXProps>(), {
  timeBuffer: () => new Map<string, Array<{ time: Date }>>()
})

const root = ref<HTMLDivElement>()

const axisDom = ref<HTMLDivElement>()

const cutMarker = ref<HTMLSpanElement>()

const scoped = effectScope()

let axis: AxisType

watch(() => props.scene, (scene) => {
  if (scene && axisDom.value) {
    axis = Axis.create(scene, axisDom.value)

    // 主题切换注册
    themeKey = UseTheme.on(() => {
      axis.options.axisLine.color = UseTheme.theme.rgb.scaleColor
      axis.renderAxisLine()
    })

    const fence = scene.fence as FluidFenceType
    
    scoped.run(() => {
      watchEffect(() => {
        if (cutMarker.value) {
          if (fence && fence.practicalCount) {
            const cutWidth = fence.cutDataLength * 100 / fence.practicalCount
            cutMarker.value.style.width = cutWidth + '%'
          } else {
            cutMarker.value.style.width = '100%'
          }
        }
      })

      watchEffect(() => {
        if (cutMarker.value) {
          if (fence && fence.practicalCount) { 
            const cutLeft = fence.cutDataStartIndex * 100 / fence.practicalCount
            cutMarker.value.style.left = cutLeft + '%'
          } else {
            cutMarker.value.style.left = '0%'
          }
        }
      })

      watchEffect(() => {
        const result = new Array(axis.scaleNum).fill('')

        if (axis.scaleNum > 0 && axisDom.value && fence && props.timeBuffer.size > 0) {
          // 取一行数据
          let times: Array<{ time: Date }> = []
          for (const [, item] of props.timeBuffer) {
            times = item
            break
          }

          const ds = 1 / (axis.scaleNum - 1)
          let dataIndex
          for (let j = 0; j < axis.scaleNum; j++) {
            dataIndex = fence.getDataIndexByDistance(j * ds)
            const value = times[dataIndex]

            if (value) {
              result[j] = (Helper.ZDate.dateFormat(value.time, 'ss:mm:MI'))
            }
          }
        }
        axis.setScaleNumber(result)
      })
    })   
  }
})


let themeKey

onBeforeUnmount(() => {
  UseTheme.afterSetProperty.delete(themeKey)

  scoped.stop()

  axis.dispose()
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div
      class="container">
      <div ref="axisDom" />
      <div class="cut-marker">
        <span ref="cutMarker" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 28px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .cut-marker{
    position: relative;
    height: 3px;
    padding-bottom: 2px;
    border-bottom: 1px solid v-bind('UseTheme.theme.var.color');
    box-sizing: border-box;
    span{
      display: block;
      position: absolute;
      height: 100%;
      background-color: v-bind('UseTheme.theme.var.color');
    }
  }
}
</style>