<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-09 16:09:41
 * @Description: 时间流动类型Y轴
 * 
-->

<script setup lang="ts">
import { computed, effectScope, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { UseTheme } from '..'
import { Axis, AxisType, Fence, IAxisOptions, Scene } from '../core'
import * as Helper from '../helper/index'
import { IFallDataBuffer } from '../types'

/** props */
interface ZXIAxisTimeYProps {
  inputDataBuffer: IFallDataBuffer<{ time: number, timeSpan?: number }>
  scene?: Scene
  color?: { width?: string, backgroundColor?: string, open?: boolean }
  fallCeliang: boolean
}

const props = withDefaults(defineProps<ZXIAxisTimeYProps>(), {
  inputDataBuffer: () => {
    return {
      data: [],
      maxRow: 0,
      oneRowLength: 0,
      topRow: 0,
      toltalRow: 0
    }
  },
  color: () => {
    return {
      width: '10px',
      backgroundColor: 'rgb(0, 255, 255)',
      open: true
    }
  },
  fallCeliang: false
})

/** emits */
const emit = defineEmits<{
  (e: 'viewMove', num: { num: number }): void
}>()
    
const root = ref<HTMLDivElement>()

const axisDom = ref<HTMLDivElement>()

const scroll = ref<HTMLSpanElement>()

let touchStartY = 0

let axis: AxisType

const scoped = effectScope()

const scrollStyle = computed(() => {
  return {
    width: props.color.width!,
    backgroundColor: props.color.backgroundColor!
  }
})

const maxRow = computed(() => props.fallCeliang ? Math.ceil(props.inputDataBuffer.maxRow / 11) : props.inputDataBuffer.maxRow)

function handleClick (e: MouseEvent) {
  if (props.inputDataBuffer.data.length > maxRow.value && axisDom.value) {
    // 计算移动行数
    const newTop = e.offsetY / axisDom.value.clientHeight * props.inputDataBuffer.data.length -  maxRow.value / 2
    emit('viewMove', { num: Math.floor(newTop - props.inputDataBuffer.topRow) })
  }
}

const mousewheel = Helper.UI.throttle(function (e: WheelEvent) {
  if (props.inputDataBuffer.data.length > maxRow.value) {
    const dx = Math.floor(maxRow.value / 2)
    const num = e.deltaY < 0 ? -dx : dx
    emit('viewMove', { num })
  }
}, 50)

// 触屏开始
function touchStart (e: TouchEvent): void {
  touchStartY = e.touches[0].clientY
}
// 触屏上下滑动
const touchMove = Helper.UI.throttle(function (e: TouchEvent): void {
  const dx = e.touches[0].clientY - touchStartY
  if (props.inputDataBuffer.data.length > maxRow.value) {
    if (Math.abs(dx) > 10) {
      const d = Math.floor(maxRow.value / 4)
      const num = dx > 0 ? -d : d
      emit('viewMove', { num })
      touchStartY = e.touches[0].clientY
    }
  }
}, 50)

function scrollTouch (e: TouchEvent) {
  if (e.touches.length === 1 && axisDom.value) {
    if (props.inputDataBuffer.data.length > maxRow.value) {
      const domRect = axisDom.value.getBoundingClientRect()
      const offsetY = e.touches[0].clientY - domRect.top
      // 计算移动行数
      const newTop = offsetY / axisDom.value.clientHeight * props.inputDataBuffer.data.length -  maxRow.value / 2
      emit('viewMove', { num: Math.floor(newTop - props.inputDataBuffer.topRow) })
    }
  }
}

watch(() => props.scene, (scene) => {
  if (scene && axisDom.value) {
    const options: IAxisOptions = {
      direction: Fence.VERTICAL,
      scaleNum: {
        width: 70
      }
    }

    axis = Axis.create(scene, axisDom.value, options)

    // 主题切换注册
    themeKey = UseTheme.on(() => {
      axis.options.axisLine.color = UseTheme.theme.rgb.scaleColor
      axis.renderAxisLine()
    })

    scoped.run(() => {
      watchEffect(() => {
        // 滚动柱样式
        let height = '100%'
        let top = '0%'
        const len = props.inputDataBuffer.data.length
        const maxRow = props.fallCeliang ? Math.ceil(props.inputDataBuffer.maxRow / 11) : props.inputDataBuffer.maxRow
        
        if (len !== 0 && len > maxRow) {
          height = maxRow / len * 100 + '%'
          top = props.inputDataBuffer.topRow / len * 100 + '%'
        }

        if (scroll.value) {
          scroll.value.style.height = height
          scroll.value.style.top = top
        }

        // 刻度
        const lists: Array<string> = new Array(axis.scaleNum).fill('')
        if (len === 0) {
          axis.setScaleNumber(lists)
          return
        }
        let value: string = ''
        const dx = Math.floor(maxRow / (axis.scaleNum - 1))
        const itemLast = props.inputDataBuffer.data[0]
        for (let i = 0; i < axis.scaleNum; i++) {
          if (len === (maxRow + props.inputDataBuffer.topRow) && i === axis.scaleNum - 1) {
            const item = props.inputDataBuffer.data[props.inputDataBuffer.topRow + maxRow - 1]
            if (item && item.timeSpan !== undefined && itemLast.timeSpan !== undefined) {
              value = '+' + (itemLast.timeSpan - item.timeSpan).toFixed(3)
            } else {
              const dsTime = itemLast.time - item.time
              const str = dsTime >= 0 ? '+' : '-'
              value = str + Helper.ZDate.msFormat(Math.abs(dsTime), 'ss:mm:MI')
            }
          } else {
            let index = Math.floor(i * dx + props.inputDataBuffer.topRow)
            const item = props.inputDataBuffer.data[index]
            if (item && item.timeSpan !== undefined && itemLast.timeSpan !== undefined) {
              value = '+' + (itemLast.timeSpan - item.timeSpan).toFixed(3)
            } else {
              if (index < len) {
                const dsTime = itemLast.time - item.time
                const str = dsTime >= 0 ? '+' : '-'
                value = str + Helper.ZDate.msFormat(Math.abs(dsTime), 'ss:mm:MI')
              } else {
                value = ''
              }
            }
          }
          lists[i] = value
        }

        axis.setScaleNumber(lists)
      })

      watch(() => props.fallCeliang, (btn) => {
        if (btn) {

        } else {

        }
      })
    })
  }
})

let themeKey

onBeforeUnmount(() => {
  UseTheme.afterSetProperty.delete(themeKey)

  scoped.stop()
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div 
      class="container"
      @wheel.stop="mousewheel"
      @touchstart="touchStart"
      @touchmove.stop="touchMove">
      <div ref="axisDom" />
      <div
        class="scroll"
        v-if="color.open"
        :style="{ width: scrollStyle.width }"
        @click="handleClick"
        @touchstart="scrollTouch">
        <span ref="scroll" :style="{ backgroundColor: scrollStyle.backgroundColor }" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container{
  height: 100%;
  display: flex;
  cursor: pointer;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .scroll{
    position: relative;
    border-top: 1px solid v-bind('UseTheme.theme.var.color');
    border-right: 1px solid v-bind('UseTheme.theme.var.color');
    border-bottom: 1px solid v-bind('UseTheme.theme.var.color');
    box-sizing: border-box;
    overflow: hidden;
    span{
      pointer-events: none;
      position: absolute;
      display: block;
      top: 0%;
      height: 100%;
      width: 100%;
    }
  }
}
</style>