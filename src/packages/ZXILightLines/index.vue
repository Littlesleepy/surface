<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-09 09:05:54
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXILightLines\index.vue
 * @Description: 轻量多线频谱图
 -->


<script setup lang="ts">
import { PropType, ref, watch, computed, onBeforeUnmount, onMounted, watchEffect, reactive } from 'vue'
import { ESwitchState, IAxisXValue, IAxisYValue, ISpectrumParams, IUnit, SampleLines, ILineData } from '../types'
import { ILightLinesPool } from './type'
import { LayersFenceType, Scene, Shader } from '../core'
import { Sundry } from '..'
import { UseTheme } from '../styles'

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
    type: Object as PropType<ISpectrumParams>,
    default: () => {
      return {
        begin: 0,
        end: 0
      }
    }
  },
  /**
   * @description: Y轴坐标单位
   */    
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
  /**
   * @description: X轴坐标单位
   */    
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
  /**
   * @description: 上下预留空间比例
   */    
  capacity: { default: 0.1 },
  /** 
   * @description: 刷新
   */    
  refresh: { default: false }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<ILightLinesPool>): void
}>()

const root = ref<HTMLDivElement>()

const inputDataLength = ref(0)

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

const defaultValueX = computed<IAxisXValue>(() => {
  return { max: props.params.end, min: props.params.begin }
})

const sceneDom = ref<HTMLDivElement>()

const inputData = computed(() => props.inputData)

const switchLever = computed(() => props.switchLever)

/**
 * @description: 频率步进MHz
 */    
const step = computed(() => {
  if (props.params.step !== undefined) {
    return props.params.step
  } else {
    if (inputDataLength.value > 0) {
      return (props.params.end - props.params.begin) / (inputDataLength.value - 1)
    }
  }
  return 0
})

// 数据抽取和绘图数据构造
function watchInputData (data: Map<string, ILineData>) {
  // 计算出Y轴最大值和最小值
  if (props.inputData.size) {
    const maxArr: number[] = []
    const minArr: number[] = []
    for (const [, value] of props.inputData) {
      maxArr.push(Sundry.max(value.data))
      minArr.push(Sundry.min(value.data))
    }
    const max = Math.max(...maxArr)
    const min = Math.min(...minArr)
    const dy = (max - min) * props.capacity
    spectrumYvalue.value.max = max + dy
    spectrumYvalue.value.min = min - dy
  }
}

watch(() => props.inputData, (data) => {
  watchInputData(data)
})

onMounted(() => {
  if (sceneDom.value) {
    const {
      scene,
      cutDataIndexArrMap,
      toolTip,
      toolTipPosition,
      disableToolTipInfo
    } = SampleLines.create(props, sceneDom.value, inputDataLength, inputData, switchLever, spectrumYvalue)

    // 游离信息显示
    const stopWatch = watchEffect(() => {
      if (!disableToolTipInfo.value && toolTipPosition.value !== undefined && scene.value) {
        const result: Map<string, { info: string, color: string }> = new Map()
        const tags = new Map<string, {
          value: number
          backgroundColor: string
        }>()

        const fence = scene.value.fence as LayersFenceType
        const fenceIndex = fence.baseFence.getFenceIndexByDistance(toolTipPosition.value)

        for (const [key, item] of inputData.value) {
          const cutDataIndexArr = cutDataIndexArrMap.value.get(key)!
          const dataIndex = cutDataIndexArr[fenceIndex]

          // 幅度
          const range = item.data[dataIndex]
          if (range !== Shader.BACKGROUND_COLOR) {
            // 频率
            const frequency = defaultValueX.value.min + dataIndex * step.value
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
              value: 1 - (range - spectrumYvalue.value.min) / (spectrumYvalue.value.max - spectrumYvalue.value.min),
              backgroundColor: item.color
            })
          }
        }

        toolTip.setValueTags(tags)

        toolTip.setContent(result)
      }
    })

    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      toolTip,
      toolTipPosition,
      spectrumYvalue,
      cutDataIndexArrMap
    })

    emit('scene', scene.value!)

    onBeforeUnmount(() => {
      if (scene.value) scene.value.dispose()
      stopWatch()
    })
  }
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="ZXIightLines-container">
      <div class="mount" ref="sceneDom" />
    </div>
  </div>
</template>

<style scoped lang="less">
.ZXIightLines-container{
  width: 100%;
  height: 100%;
  border: 1px solid v-bind('UseTheme.theme.var.borderColor');
  box-sizing: border-box;
  touch-action: none;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .mount{
    width: 100%;
    height: 100%;
  }
}
</style>