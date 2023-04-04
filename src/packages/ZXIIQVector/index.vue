<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-07 14:37:50
 * @Description: IQ星座图
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, ref, reactive, watch, watchEffect } from 'vue'
import { ElTooltip, ElSelect, ElOption, Effect } from 'element-plus'
import { IAxisYValue, EAxisXType, ESwitchState } from '../types'
import { IIQData, IIQVectorPool } from './type'
import { Canvas, Engine, IPositionResult, Scene, ToolTip } from '../core'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import { Sundry } from '../helper/index'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Object as PropType<IIQData>,
    default: () => { 
      return { iData: new Float32Array(), qData: new Float32Array() }
    }
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  name: { type: String, default: '' },
  pointRadius: { default: 4 },
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
  (e: 'scene', result: Scene<IIQVectorPool>): void
}>()

const root = ref<HTMLDivElement>()

const scaleX = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(3))
  }
}

const scaleY = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(3))
  }
}

const dataPoint = ref(256)

const scale = ref<IAxisYValue>({ max: 0, min: 0 })

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<IIQVectorPool>>()

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<IPositionResult>()

const dataPointSelect = ref([
  { value: 32, label: '32' },
  { value: 64, label: '64' },
  { value: 128, label: '128' },
  { value: 256, label: '256' },
  { value: 512, label: '512' },
  { value: 1024, label: '1024' },
  { value: 2048, label: '2048' }
])


const IQVectorImageData = computed(() => {
  if (props.inputData.iData.length > 0) {
    return [{
      data: new Float32Array(props.inputData.iData.subarray(0, dataPoint.value)),
      color: UseTheme.theme.IQVector.lineColor
    }, {
      data: new Float32Array(props.inputData.qData.subarray(0, dataPoint.value)),
      color: UseTheme.theme.IQVector.pointColor
    }]
  }
  return []
})

function watchData () {
  if (IQVectorImageData.value.length > 0) {
    // 找出最大值和最小值
    const max = new Array(IQVectorImageData.value.length)
    for (let j = 0; j < IQVectorImageData.value.length; j++) {
      max[j] = Sundry.max(IQVectorImageData.value[j].data)
    }
    scale.value.max = Math.max(...max)
    scale.value.min = -scale.value.max
  }
}

function render () {
  if (scene.value && IQVectorImageData.value.length > 0) {
    const idata = IQVectorImageData.value[0]
    const qdata = IQVectorImageData.value[1]

    const rangeScale = scale.value.max - scale.value.min,
      width = scene.value.canvas.clientWidth, height = scene.value.canvas.clientHeight

    // 横坐标集合
    const vertex = new Float32Array(dataPoint.value)
    for (let i = 0; i < dataPoint.value; i++) {
      vertex[i] = (qdata.data[i] - scale.value.min) / rangeScale * width
    }

    // 纵坐标集合
    const verteY = new Float32Array(dataPoint.value)
    for (let i = 0; i < dataPoint.value; i++) {
      verteY[i] = (idata.data[i] - scale.value.min) / rangeScale * height
    }

    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx
    renderCtx.clearScreen()
    // 线条
    ctx.strokeStyle = idata.color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(vertex[0], verteY[0])
    for (let i = 1; i < dataPoint.value; i++) {
      ctx.lineTo(vertex[i], verteY[i])
    }
    ctx.stroke()
    // 点
    ctx.fillStyle = qdata.color
    const pointRadius = props.pointRadius
    for (let i = 0; i < dataPoint.value; i++) {
      ctx.beginPath()
      ctx.arc(vertex[i], verteY[i], pointRadius, 0, 360)
      ctx.fill()
    }

    scene.value.render2D()
  }
}

watch(IQVectorImageData, () => {
  watchData()
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

watch(() => props.inputData, () => {
  if (toolTip.options.lock) toolTip.options.lock = false
})

// 游离信息显示
watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value && IQVectorImageData.value.length > 0) {
    const result: Map<string, { info: string, color?: string }> = new Map()

    const rangeScale = scale.value.max - scale.value.min
    const p = toolTipPosition.value

    result.set('0', { info: 'x:' + (p.offsetMiddlePCTX * rangeScale + scale.value.min).toFixed(3) })
    result.set('1', { info: 'y:' + ((1 - p.offsetMiddlePCTY) * rangeScale + scale.value.min).toFixed(3) })

    toolTip.setContent(result)
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
      ctx.clearScreen()

      if (IQVectorImageData.value.length > 0) {

        IQVectorImageData.value[0].color = UseTheme.theme.IQVector.lineColor
        IQVectorImageData.value[1].color = UseTheme.theme.IQVector.pointColor
      }

      render()
    })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.CROSS,
      infoTag: props.toolTip
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

    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      toolTip,
      toolTipPosition,
      scale
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  if (scene.value) scene.value.dispose()

  UseTheme.off(themKey)
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="iq-vector-image-container">
      <div class="header">
        <span>{{name}}</span>
        <ZXISelect style="width: 200px;" name="绘制点数" v-model="dataPoint">
          <el-option v-for="item in dataPointSelect" :key="item.value" :label="item.label" :value="item.value" />
        </ZXISelect>
        <div class="slot">
          <slot />
        </div>
      </div>
      <div class="second-row">
        <ZXIAxisY
          class="axis-y"
          :color="{ open: false }"
          :controlBtn="false"
          :defaultValue="scale"
          :scale="scaleY"
          :scene="scene"
          :scaleNumWidth="50" />
        <div class="second-column">
          <div class="canvas-father">
            <div class="mount" ref="sceneDom"></div>
          </div>
          <ZXIAxisX
            class="axis-x"
            :xScaleType="EAxisXType.range"
            :scene="scene"
            :scale="scaleX"
            :defaultValue="scale" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme.less');
.iq-vector-image-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-sizing: border-box;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    display: flex;
    align-items: center;
    padding-bottom: 5px;
    box-sizing: border-box;
    color: v-bind('UseTheme.theme.var.color');
    span{
      padding: 0 10px;
      font-size: @font20;
    }
    .slot{
      height: 100%;
      flex: auto;
    }
  }
  .second-row{
    flex: auto;
    display: flex;
    .axis-y{
      padding-top: 1px;
      box-sizing: border-box;
      padding-bottom: 33px;
    }
    .second-column{
      flex: auto;
      display: flex;
      flex-direction: column;
      .canvas-father{
        flex: auto;
        position: relative;
        box-sizing: border-box;
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        .mount{
          width: 100%;
          height: 100%;
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
  }
}
</style>