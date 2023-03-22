<!--
 * @Author: shiershao
 * @Date: 2022-06-02 10:03:35
 * @LastEditTime: 2023-02-08 13:52:25
 * @Description: 同时绘制多条带抽取频谱
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, PropType, ref, watchEffect, WatchStopHandle } from 'vue'
import { LayersFenceType, Scene, Shader } from '../core'
import { EAxisXType, ESwitchState, IAxisYValue, ILineData, ISampleLinesPool, ISpectrumParams, ITargetIcon } from '../types'
import ZXISampleLines from '../ZXISampleLines'
import { IUnit } from './type'

const props = defineProps({
  inputData: {
    type: Map as PropType<Map<string, ILineData>>,
    default: () => new Map()
  },
  params: {
    type: Object as PropType<ISpectrumParams>,
    required: true,
    default: () => {
      return {
        begin: 0,
        end: 0
      }
    }
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  scaleX: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: 'MHz',
        parse: (v: number) => {
          return `频率：${parseFloat(v.toFixed(6))}MHz|${parseFloat((v * 1000).toFixed(3))}kHz`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(6))
        }
      }
    }
  },
  scaleY: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: 'dBuV',
        parse: (v: number) => {
          return `幅度：${v.toFixed(1)} dBuV|${(v - 107).toFixed(1)} dBm`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(1))
        }
      }
    }
  },
  controlBtnY: { default: true },
  xScaleType: {
    type: Number as PropType<EAxisXType>,
    default: EAxisXType.symmetry
  },
  defaultValueY: {
    type: Object as PropType<IAxisYValue>,
    default: () => {
      return { max: 90, min: -10 }
    }
  },
  name: { type: String, default: '' },
  capacity: { default: 0.1 },
  scaleNumWidthY: {
    default: 30
  },
  toolTip: {
    default: () => {
      return {
        width: 300,
        height: 56
      }
    }
  },
  /**
   * @description: 信号标记
   */    
  tags: { type: Array as PropType<Array<ITargetIcon>>, default: () => [] },
  /** 
   * @description: 刷新
   */    
  refresh: { default: false }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<ISampleLinesPool>): void
}>()

const root = ref<HTMLDivElement>()

const defaultValueX = computed(() => {
  return { max: props.params.end, min: props.params.begin }
})

let stopWatch: WatchStopHandle

function getScene (scene: Scene<ISampleLinesPool>) {
  const pool = scene.pool!

  stopWatch = watchEffect(() => {
    if (!pool.disableToolTipInfo && pool.toolTipPosition !== undefined) {
      const result: Map<string, { info: string, color: string }> = new Map()
      const tags = new Map<string, {
        value: number
        backgroundColor: string
      }>()

      const fence = scene.fence as LayersFenceType
      const fenceIndex = fence.baseFence.getFenceIndexByDistance(pool.toolTipPosition)
      const rangeY = pool.spectrumYvalue.max - pool.spectrumYvalue.min

      for (const [key, item] of pool.inputData) {
        const cutDataIndexArr = pool.cutDataIndexArrMap.get(key)!
        const dataIndex = cutDataIndexArr[fenceIndex]

        // 幅度
        const range = item.data[dataIndex]
        if (range !== Shader.BACKGROUND_COLOR) {
          // 频率
          const frequency = defaultValueX.value.min + dataIndex * pool.step
          const name = props.inputData.size === 1 ? '' : key

          result.set(key + '0', {
            info: `${name}${props.scaleX.parse(frequency)}` ,
            color: item.color
          })
          result.set(key + '1', {
            info: `${name}${props.scaleY.parse(range)}`,
            color: item.color
          })
          
          tags.set(key, {
            value: 1 - (range - pool.spectrumYvalue.min) / rangeY,
            backgroundColor: item.color
          })
        }
      }

      pool.toolTip.setValueTags(tags)

      pool.toolTip.setContent(result)
    }
  })

  emit('scene', scene)
}

onBeforeUnmount(() => {
  if (stopWatch) stopWatch()
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <ZXISampleLines
      class="container"
      :inputData="inputData"
      :switchLever="switchLever"
      :scaleX="scaleX"
      :scaleY="scaleY"
      :controlBtnY="controlBtnY"
      :xScaleType="xScaleType"
      :defaultValueY="defaultValueY"
      :defaultValueX="defaultValueX"
      :scaleNumWidthY="scaleNumWidthY"
      :name="name"
      :capacity="capacity"
      :toolTip="toolTip"
      :tags="tags"
      :refresh="refresh"
      @scene="getScene">
      <slot></slot>
    </ZXISampleLines>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 100%;
}
</style>