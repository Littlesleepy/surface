<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-09 09:05:08
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXITimeDomainLines\index.vue
 * @Description: 时域物抽取多线图
 -->

<script setup lang="ts">
import { effectScope, onBeforeUnmount, PropType, ref, watchEffect } from 'vue'
import { EAxisXType, ESwitchState, IAxisXValue, IAxisYValue, INoSampleLinesPool, IUnit, ILineData } from '../types'
import ZXINoSampleLines from '../ZXINoSampleLines'
import { ITimeDomainParams } from './type'
import * as Helper from '../helper'
import { LayerFenceType, Scene, Shader } from '../core'

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
  params: {
    type: Object as PropType<ITimeDomainParams>
  },
  scaleX: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: 'ms',
        parse: (v: number) => {
          return `时间：${parseFloat(v.toFixed(6))}ms`
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
  controlBtnY: { default: false },
  defaultValueY: {
    type: Object as PropType<IAxisYValue>,
    default: () => {
      return { max: 90, min: -10 }
    }
  },
  defaultValueX: {
    type: Object as PropType<IAxisXValue>
  },
  name: { type: String, default: '' },
  /**
   * @description: 上下预留空间比例
   */    
  capacity: { default: 0.1 },
  scaleNumWidthY: {
    default: 50
  },
  toolTip: {
    default: () => {
      return {
        width: 150,
        height: 56
      }
    }
  }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<INoSampleLinesPool>): void
}>()

const root = ref<HTMLDivElement>()

const spectrumValueX = ref({ min: 0, max: 0 })

const scoped = effectScope()

function getScene (scene: Scene<INoSampleLinesPool>) {
  const pool = scene.pool!

  scoped.run(() => {
    watchEffect(() => {
      if (props.params) {
        const realWidth = Helper.Device.getSamplingRateByBandwidth(props.params.bandwidth * 1000)

        let max = 0
        if (realWidth > 0 && pool.inputDataLength > 0) max = (pool.inputDataLength - 1) / realWidth

        spectrumValueX.value = { min: 0, max }
      } else {
        if (props.defaultValueX !== undefined) {
          spectrumValueX.value = props.defaultValueX
        } else {
          console.warn('请配置props.params.bandwidth或者props.defaultValueX')
        }
      }
    })

    watchEffect(() => {
      if (!pool.disableToolTipInfo && pool.toolTipPosition !== undefined) {
        const result: Map<string, { info: string, color?: string }> = new Map()
        const tags = new Map<string, {
          value: number
          backgroundColor: string
        }>()

        const fence = scene.fence as LayerFenceType
        const dataIndex = fence.getDataIndexByDistance(pool.toolTipPosition)
        const rangeY = pool.spectrumYvalue.max - pool.spectrumYvalue.min

        // 时间
        const time = spectrumValueX.value.min + dataIndex * pool.step 
        result.set('时间', {
          info: `${props.scaleX.parse(time)}`
        })

        // 值
        for (const [key, item] of pool.inputData) {
          const range = item.data[dataIndex]
          if (range !== Shader.BACKGROUND_COLOR) {
            const name = props.inputData.size === 1 ? '' : key
            result.set(key, {
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
    <ZXINoSampleLines
      class="container"
      :inputData="inputData"
      :switchLever="switchLever"
      :scaleX="scaleX"
      :scaleY="scaleY"
      :controlBtnY="controlBtnY"
      :xScaleType="EAxisXType.range"
      :defaultValueY="defaultValueY"
      :defaultValueX="spectrumValueX"
      :scaleNumWidthY="scaleNumWidthY"
      :name="name"
      :capacity="capacity"
      :toolTip="toolTip"
      @scene="getScene">
      <slot></slot>
    </ZXINoSampleLines>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 100%;
}
</style>