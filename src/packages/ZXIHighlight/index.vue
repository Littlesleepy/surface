<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 13:47:32
 * @Description: 信号高亮显示组件
 * 
-->

<script setup lang="ts">
import { PropType, computed, CSSProperties, ref } from 'vue'
import { isLayersFenceType, Scene } from '../core'
import { IAxisXValue } from '../types'
import { IHighlightItem } from './type'
import { UseTheme } from '../styles'

const props = defineProps({
  axisXValue: {
    type: Object as PropType<IAxisXValue>,
    default: () => { return { min: 0, max: 1000 } }
  },
  step: { type: Number, default: 0 },
  items: {
    type: Array as PropType<Array<IHighlightItem>>, default: () => []
  },
  scene: {
    type: Object as PropType<Scene>
  }
})

const root = ref<HTMLDivElement>()

const rangeX = computed(() => {
  if (props.axisXValue) {
    return props.axisXValue.max - props.axisXValue.min
  }
  return 0
})

const lists = computed(() => {
  const arr: Array<{
    width: string,
    left: string,
    title?: {
      content: string
      style?: CSSProperties
    },
    html?: string,
    style: CSSProperties
  }> = []
  if (props.axisXValue && props.scene) {
    let result, item: IHighlightItem, width, left, count: number,
      startFrequency: number, endFrequency: number
    const fence = props.scene.fence

    for (let i = 0, len = props.items.length; i < len; i++) {
      result = {}
      item = props.items[i]
      result.style = item.style ? item.style : {}

      if (props.step > 0) {
        count = Math.floor(item.bandwidth / props.step)
        if (item.startFrequency !== undefined) {
          startFrequency = item.startFrequency
          endFrequency = item.startFrequency + item.bandwidth
        } else {
          if (count % 2 === 0) { // 偶数个默认向频率起始边多一个
            startFrequency = item.centerFrequency! - count / 2 * props.step
            endFrequency = item.centerFrequency! + (count / 2 - 1) * props.step
          } else { // 奇数个
            startFrequency = item.centerFrequency! - (count - 1) / 2 * props.step
            endFrequency = item.centerFrequency! + (count - 1) / 2 * props.step
          }
        }
        startFrequency = parseFloat(startFrequency.toFixed(6))
        endFrequency = parseFloat(endFrequency.toFixed(6))

        // 过滤
        if (startFrequency > props.axisXValue.max || endFrequency < props.axisXValue.min) continue

        // 计算起始位置
        if (fence === undefined || (fence && isLayersFenceType(fence) && fence.sampling) || fence.baseFence.count === 0) {
          width = item.bandwidth / rangeX.value
          left = (startFrequency - props.axisXValue.min) / rangeX.value
        } else {
          let startFenceIndex, endFenceIndex
          const dsIndex = Math.round((startFrequency - props.axisXValue.min) / props.step)
          if (dsIndex >= 0) {
            startFenceIndex = dsIndex + fence.baseFence.visibleIndex.min
            endFenceIndex = startFenceIndex + count - 1
          } else {
            startFenceIndex = fence.baseFence.visibleIndex.min
            endFenceIndex = startFenceIndex + count - 1 + dsIndex
          }
          if (endFenceIndex > fence.baseFence.visibleIndex.max) endFenceIndex = fence.baseFence.visibleIndex.max

          left = fence.baseFence.fencePositionTrans(fence.baseFence.pieces[startFenceIndex] - fence.baseFence.eachPieceWidth)
          width = fence.baseFence.fencePositionTrans((fence.baseFence.pieces[endFenceIndex] + fence.baseFence.eachPieceWidth)) - left
        }
      } else {
        width = item.bandwidth / rangeX.value
        if (item.centerFrequency) {
          left = (item.centerFrequency - item.bandwidth / 2 - props.axisXValue.min) / rangeX.value
        } else {
          left = (item.startFrequency! - props.axisXValue.min) / rangeX.value
        }
      }

      result.style.width = width * 100 + '%'
      result.style.left = left * 100 + '%'
      // title
      if (item.title) result.title = item.title
      if (item.html) result.html = item.html
      arr.push(result)
    }
  }
  return arr
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <ul class="highlight-container">
      <li v-for="(item, index) in lists" :key="index" :style="item.style !== undefined ? item.style : {}">
        <div class="wrapper">
          <p
            class="title"
            v-if="item.title"
            :style="item.title && item.title.style ? item.title.style : {}">
              {{item.title ? item.title.content : ''}}
            </p>
          <div class="icon" v-if="item.html" v-html="item.html !== undefined ? item.html : ''" />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
.highlight-container{
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  li{
    position: absolute;
    height: 100%;
    background-color: v-bind('UseTheme.theme.Highlight.markerColor');
    display: flex;
    justify-content: space-around;
    .wrapper{
      display: flex;
      flex-direction: column;
      .title{
        color: v-bind('UseTheme.theme.var.color');
        font-size: 12px;
        text-align: center;
        max-height: 12px;
      }
      .icon{
        margin: auto;
      }
    }
  }
}
</style>