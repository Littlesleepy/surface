<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-03 09:33:30
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 16:32:36
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISampleTimeLines\index.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'ZXISampleTimeLines'
}
</script>
<script setup lang="ts">
import { computed, effectScope, onBeforeUnmount, PropType, ref, watchEffect } from 'vue'
import { LayersFenceType, Scene, Shader } from '..';
import { EAxisXType, ESwitchState, IAxisXValue, ILineData, ISampleLinesPool, IUnit } from '../types'
import ZXISampleLines from '../ZXISampleLines'

const props = defineProps({
  inputData: {
    type: Map as PropType<Map<string, ILineData>>,
    default: () => new Map()
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
        unit: 'ms',
        parse: (v: number) => {
          return `时间：${parseFloat(v.toFixed(9))}ms`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(9))
        }
      }
    }
  },
  scaleY: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: '',
        parse: (v: number) => {
          return `值：${v.toFixed(1)}`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(1))
        }
      }
    }
  },
  controlBtnY: { type: Boolean, default: false },
  xScaleType: {
    type: Number as PropType<EAxisXType>,
    default: EAxisXType.symmetry
  },
  defaultValueY: {
    type: Object as PropType<IAxisXValue>,
    default: () => {
      return { max: 90, min: -10 }
    }
  },
  defaultValueX: {
    type: Object as PropType<IAxisXValue>,
    default: () => {
      return { max: 0, min: 0 }
    }
  },
  name: { type: String, default: '' },
  capacity: { default: 0.1 },
  scaleNumWidthY: {
    default: 50
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
   * @description: 刷新
   */    
  refresh: { default: false },
  biaozhu: { default: false }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<any>): void
  (e: 'update:biaozhu', result: boolean): void
}>()

const biaozhuModle = computed({
  get: () => props.biaozhu,
  set: (v) => {
    emit('update:biaozhu', v)
  }
})

const root = ref<HTMLDivElement>()

const scoped = effectScope()

function getScene (scene: Scene<ISampleLinesPool>) {
  const pool = scene.pool!

  watchEffect(() => {
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

        // 值
        const range = item.data[dataIndex]
        if (range !== Shader.BACKGROUND_COLOR) {
          // 时间
          const time = props.defaultValueX.min + dataIndex * pool.step
          const name = props.inputData.size === 1 ? '' : key

          result.set(key + '0', {
            info: `${name}${props.scaleX.parse(time)}` ,
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
  scoped.stop()
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <ZXISampleLines
      class="container"
      v-model:biaozhu="biaozhuModle"
      :inputData="inputData"
      :switchLever="switchLever"
      :scaleX="scaleX"
      :scaleY="scaleY"
      :controlBtnY="controlBtnY"
      :xScaleType="EAxisXType.range"
      :defaultValueY="defaultValueY"
      :defaultValueX="defaultValueX"
      :scaleNumWidthY="scaleNumWidthY"
      :name="name"
      :capacity="capacity"
      :toolTip="toolTip"
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