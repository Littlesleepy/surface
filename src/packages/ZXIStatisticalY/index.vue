<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 13:53:11
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIStatisticalY\index.vue
 * @Description: 
 -->

<script setup lang="ts">
import * as Helper from '../helper/index'
import { computed, onBeforeUnmount, onMounted, PropType, reactive, ref, watch, watchEffect } from 'vue'
import ZXIAxisX from '../ZXIAxisX'
import { EAxisXType, ESwitchState } from '../types'
import { Scene, Canvas, Engine, IPositionResult, ToolTip } from '../core'
import { IStatisticalYPool } from './type'
import { Sundry } from '../helper/index'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: { type: Float32Array, required: true },
  /**
   * @description: 是否统计
   */    
  calculate: { default: true },
  lineColor: { type: String },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  showArea: {
    type: Object as PropType<{ min: number, max: number }>,
    default: () => { return { min: -1, max: -1 } }
  }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IStatisticalYPool>): void
}>()

const root = ref<HTMLDivElement>()

const scale = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(0))
  }
}

const sceneDom = ref<HTMLDivElement>()

let scene = ref<Scene<IStatisticalYPool>>()

const maxCount = ref(0)

const spectrumXvalue = computed(() => {
  return { min: 0, max: maxCount.value }
})

let dataTrans = ref(new Float32Array())

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<IPositionResult>()

function statistical (data: Float32Array): Float32Array {
  if (scene.value) {
    const canvas = scene.value.canvas
    const len = canvas.clientHeight
    
    const arr = new Float32Array(len)
    const max = Sundry.max(data)
    const min = Sundry.min(data)
    const rangeY = max - min
    // 获取除数
    const ds = rangeY / len
    for (let i = 0, len = data.length; i < len; i++) {
      const index = Math.floor((data[i] - min) / ds)
      arr[index]++
    }
    return arr
  }

  return new Float32Array()
}

function render () {
  if (scene.value && props.inputData.length > 0) {
    
    if (props.calculate) {
      dataTrans.value = statistical(props.inputData)
    } else {
      dataTrans.value = props.inputData
    }

    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx

    maxCount.value =  dataTrans.value.length > 0 ? Sundry.max(dataTrans.value) : 0

    const canvas = scene.value.canvas
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // 绘制，由下往上依次绘制
    renderCtx.clearScreen()
    ctx.strokeStyle = props.lineColor ?? UseTheme.theme.StatisticalY.lineColor
    ctx.beginPath()
    // 确定绘制起始数据索引
    const start = props.showArea.min >= 0 ? props.showArea.min : 0
    let end = props.showArea.max >= 0 ? props.showArea.max : height
    if (end > height) end = height

    for (let i = start; i < end;) {
      const x = dataTrans.value[i] / maxCount.value * width
      const y = height - ++i
      ctx.moveTo(0, y)
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

watch(() => props.inputData, () => {
  if (toolTip.options.lock) toolTip.options.lock = false

  render()
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  }
})

watch(() => props.showArea, () => {
  render()
})

watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value) {
    const height = scene.value.canvas.clientHeight
    let dataIndex = height - Math.floor(toolTipPosition.value.offsetY)

    const start = props.showArea.min >= 0 ? props.showArea.min : 0
    let end = props.showArea.max >= 0 ? props.showArea.max : height - 1
    if (end >= height) end = height - 1

    const result = new Map()
    const tags = new Map()

    if (dataIndex >= start && dataIndex <= end) {

      const count = dataTrans.value[dataIndex]

      result.set('0', { info: `次数：${count}` })

      tags.set('0',
        {
          value: count / maxCount.value,
          backgroundColor: Helper.Echart.PURPLE_S
        }
      )
    }

    toolTip.setContent(result)

    toolTip.setValueTags(tags)
  }
})

let themKey
onMounted(() => {
  if (sceneDom.value) {
    const engine = new Engine(sceneDom.value)

    const ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })

    scene.value = new Scene(engine, ctx)

    themKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.rgb.backgroundColor

      render()
    })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.TRANSVERSE,
      infoTag: {
        width: 120,
        height: 36
      }
    })

    toolTip.afterTrigger.set('spectrum', (p) => {
      toolTipPosition.value = p
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('spectrum', () => {
      disableToolTipInfo = true
    })

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      render()
    })
    
    // @ts-ignore
    scene.value.pool = reactive({
      toolTip,
      toolTipPosition,
      spectrumXvalue
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  if (scene.value) scene.value.dispose()
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="StatisticalY-container">
      <div class="canvas-wrapper">
        <div class="mount" ref="sceneDom" />
      </div>
      <ZXIAxisX
        :defaultValue="spectrumXvalue"
        :scale="scale"
        :xScaleType="EAxisXType.range"
        :scene="scene" />
    </div>
  </div>
</template>

<style scoped lang="less">
.StatisticalY-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .canvas-wrapper{
    flex: auto;
    position: relative;
    border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
    border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
    border-left: 1px solid v-bind('UseTheme.theme.var.borderColor');
    box-sizing: border-box;
    .mount{
      width: 100%;
      height: 100%;
    }
  }
}
</style>