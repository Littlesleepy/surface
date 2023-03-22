<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-03-02 11:22:32
 * @Description: 多用途X轴
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, ref, watchEffect, watch, effectScope, computed } from 'vue'
import { UseTheme } from '../styles'
import { EAxisXType, IAxisXValue, IUnitAxis } from './type'
import { Axis, Scene, isLayersFenceType, AxisType, isLayerFenceType } from '../core'

/** props */
interface ZXIAxisXProps {
  xScaleType?: EAxisXType
  defaultValue?: IAxisXValue
  step?: number
  scale?: IUnitAxis
  scene?: Scene
}

const props = withDefaults(defineProps<ZXIAxisXProps>(), {
  xScaleType: EAxisXType.symmetry,
  defaultValue: () => { return { max: 0, min: 0 } },
  step: 0,
  scale: () => {
    return {
      unit: 'MHz',
      transform: (v: number) => {
        return parseFloat(v.toFixed(6))
      }
    }
  }
})

/** emits */
const emit = defineEmits<{
  (e: 'change', result: { min: number, max: number }): void
}>()

const root = ref<HTMLDivElement>()

const axisDom = ref<HTMLDivElement>()

const cutMarker = ref<HTMLSpanElement>()

const scoped = effectScope()

let axis = ref<AxisType>()

const left = computed(() => props.defaultValue.min)

const right = computed(() => props.defaultValue.max)

const needScroll = computed(() => {
  if (props.scene && props.scene.fence) {
    return true
  }
  return false
})

function getScaleplate (num: number, begin: number, end: number): Array<number> {
  const list: Array<number> = []
  const dx = (end - begin) / (num - 1)
  let value
  for (let i = 0; i < num; i++) {
    value = begin + dx * i
    
    list[i] = value
  }

  return list
}

watch(() => props.scene, (scene) => {
  if (scene && axisDom.value) {
    axis.value = Axis.create(scene, axisDom.value)

    // 主题切换注册
    themeKey = UseTheme.on(() => {
      axis.value!.options.axisLine.color = UseTheme.theme.rgb.scaleColor
      axis.value!.renderAxisLine()
    })

    const fence = scene.fence
    
    scoped.run(() => {
      watchEffect(() => {
        if (cutMarker.value) {
          if (fence) {
            const cutWidth = fence.cutDataLength * 100 / fence.practicalCount
            cutMarker.value.style.width = cutWidth + '%'
          } else {
            cutMarker.value.style.width = '100%'
          }
        }
      })

      watchEffect(() => {
        if (cutMarker.value) {
          if (fence) { 
            const cutLeft = fence.cutDataStartIndex * 100 / fence.practicalCount
            cutMarker.value.style.left = cutLeft + '%'
          } else {
            cutMarker.value.style.left = '0%'
          }
        }
      })

      watchEffect(() => {
        let lists: Array<number> = []
        const result: Array<string> = []

        if (axis.value && axis.value.scaleNum > 0) {
          // fence.cutDataStartIndex >= 0激活响应系统追踪fence.cutDataStartIndex
          if (fence && isLayersFenceType(fence) && fence.practicalCount > 0 && fence.cutDataStartIndex >= 0) {
            if (!fence.sampling && fence.cutDataIndexArrSet) {                 
              const ds = 1 / (axis.value.scaleNum - 1)
              for (let j = 0; j < axis.value.scaleNum; j++) {
                const dataIndex = fence.getDataIndexByDistance(j * ds)
                const value = left.value + dataIndex * props.step
                lists.push(value)
              }
            } else {
              const range = right.value - left.value
              const begin = left.value + fence.cutDataStartIndex * range / fence.practicalCount
              const ds = fence.cutDataLength * range / fence.practicalCount / (axis.value.scaleNum - 1)
              for (let j = 0; j < axis.value.scaleNum; j++) {
                const value = begin + ds * j
                lists.push(value)
              }
            }
          } else if (fence && isLayerFenceType(fence) && fence.practicalCount > 0) {
            const ds = 1 / (axis.value.scaleNum - 1)
            let dataIndex
            for (let j = 0; j < axis.value.scaleNum; j++) {
              dataIndex = fence.getDataIndexByDistance(j * ds)
              const value = left.value + dataIndex * props.step
              lists.push(value)
            }
          } else {
            lists = getScaleplate(axis.value.scaleNum, left.value, right.value)
          }

          lists.forEach((item, i) => {
            lists[i] = props.scale.transform(item)
          })

          emit('change', { min: lists[0], max: lists[axis.value.scaleNum - 1] }) // 抛出起始点

          if (props.xScaleType === EAxisXType.symmetry) { // 对称类坐标轴计算
            const center = lists[(axis.value.scaleNum - 1) / 2]
            result[(axis.value.scaleNum - 1) / 2] = center + props.scale.unit
            for (let i = 0; i < axis.value.scaleNum; i++) {
              if (i !== (axis.value.scaleNum - 1) / 2) {
                const num = lists[i] - center
                result[i] = num > 0 ? '+' + props.scale.transform(num) + props.scale.unit : props.scale.transform(num) + props.scale.unit
              }
            }
          } else {
            for (let l = 0; l < lists.length; l++) {
              result[l] = lists[l] + props.scale.unit
            }
          }

          axis.value.setScaleNumber(result)
        }
      })

      watch(() => axis.value?.scaleNum, (v) => {
        if (v !== undefined) {
          for (const [, fun] of afterChange) {
            fun(v)
          }
        }
      })
    })
  }
})

let themeKey

const afterChange = new Map<string, (num: number) => void>()

onBeforeUnmount(() => {
  UseTheme.afterSetProperty.delete(themeKey)
  
  scoped.stop()

  axis.value!.dispose()
})

defineExpose({
  root,
  axis,
  afterChange
})
</script>

<template>
  <div ref="root">
    <div class="container">
      <div ref="axisDom" />
      <div class="cut-marker" v-if="needScroll">
        <span ref="cutMarker" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
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
      height: 25px;
      bottom: 0;
      background-color: v-bind('UseTheme.theme.var.color');
      opacity: 0.25;
      pointer-events: none;
    }
  }
}
</style>