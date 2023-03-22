<!--
 * @Author: shiershao
 * @Date: 2022-06-06 09:55:03
 * @LastEditTime: 2023-02-09 09:04:31
 * @Description: X轴为点数的多线条无抽取绘制
 * 
-->

<script setup lang="ts">
import { effectScope, onBeforeUnmount, ref, watchEffect } from 'vue'
import { EAxisXType, ESwitchState, IAxisYValue, INoSampleLinesPool, IUnit, ILineData } from '../types'
import ZXINoSampleLines from '../ZXINoSampleLines'
import { LayerFenceType, Scene, Shader } from '../core'

interface IZXICountLinesProps {
  inputData: Map<string, ILineData>
  switchLever: ESwitchState
  scaleX?: IUnit
  scaleY?: IUnit
  controlBtnY?: boolean
  defaultValueY?: IAxisYValue
  name?: string
  capacity?: number
  scaleNumWidthY?: number
  toolTip?: { width: number, height: number  }
}


const props = withDefaults(defineProps<IZXICountLinesProps>(), {
  inputData: () => new Map(),
  switchLever: ESwitchState.off,
  scaleX: () => {
    return {
      unit: '',
      parse: (v: number) => {
        return `第：${v}个`
      },
      transform: (v: number) => {
        return parseFloat(v.toFixed(0))
      }
    }
  },
  scaleY: () => {
    return {
      unit: '',
      parse: (v: number) => {
        return `值：${v.toFixed(1)}`
      },
      transform: (v: number) => {
        return parseFloat(v.toFixed(1))
      }
    }
  },
  controlBtnY: false,
  defaultValueY: () => {
    return { max: 90, min: -10 }
  },
  name: '',
  capacity: 0,
  scaleNumWidthY: 50,
  toolTip: () => {
    return {
      width: 200,
      height: 56
    }
  }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<INoSampleLinesPool>): void
}>()

const root = ref<HTMLDivElement>()

const defaultValueX = ref({ min: 0, max: 0 })

const scoped = effectScope()

function getScene (scene: Scene<INoSampleLinesPool>) {
  const pool = scene.pool!

  emit('scene', scene)

  scoped.run(() => {
    watchEffect(() => {
      let max = 0
      if (pool.inputDataLength > 0) max = (pool.inputDataLength - 1)
      defaultValueX.value = { min: 0, max }
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

        // 点数
        const count = defaultValueX.value.min + dataIndex * pool.step 
        result.set('点数', {
          info: `${props.scaleX.parse(count)}`
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
      :defaultValueX="defaultValueX"
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
