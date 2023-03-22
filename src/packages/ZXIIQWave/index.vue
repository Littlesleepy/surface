<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 09:33:19
 * @Description: IQ时域波形图
 * 
-->

<script setup lang="ts">
import { computed, ref, PropType, watch, onBeforeUnmount, onMounted, reactive, watchEffect } from 'vue'
import { ElTooltip, ElSelect, ElOption, Effect } from 'element-plus'
import { ESwitchState, IAxisYValue, IIQData, EAxisXType, IAxisXValue } from '../types'
import { Canvas, Engine, IPositionResult, LayerFence, LayerFenceType, Scene, ToolTip, ZoomTrans } from '../core'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import { IIQWavePool } from './type'
import { Sundry } from '../helper'
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
  name: { type: String, default: '' }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IIQWavePool>): void
}>()

const root = ref<HTMLDivElement>()

const scale = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(0))
  }
}

const dataPoint = ref(256)

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<IIQWavePool>>()

let zoomTrans: ZoomTrans

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<number>()

const inputDataLength = computed(() => {
  return dataPoint.value > props.inputData.iData.length ? props.inputData.iData.length : dataPoint.value
})

const defaultValueX = ref<IAxisXValue>({ max: 0, min: 0 })

const spectrumXvalue = ref<IAxisXValue>({ max: 0, min: 0 })

const dataPointSelect = ref([
  { value: 32, label: '32' },
  { value: 64, label: '64' },
  { value: 128, label: '128' },
  { value: 256, label: '256' },
  { value: 512, label: '512' },
  { value: 1024, label: '1024' },
  { value: 2048, label: '2048' }
])

const IQWaveImageData = computed(() => {
  if (props.inputData.iData.length > 0) {
    return [{
      data: new Float32Array(props.inputData.iData.subarray(0, inputDataLength.value)),
      color: UseTheme.theme.IQVector.lineColor
    }, {
      data: new Float32Array(props.inputData.qData.subarray(0, inputDataLength.value)),
      color: UseTheme.theme.IQVector.pointColor
    }]
  }
  return []
})

function watchData () {
  if (props.inputData.iData.length > 0) {
    // 找出最大值和最小值
    const max = new Array(IQWaveImageData.value.length)
    for (let j = 0; j < IQWaveImageData.value.length; j++) {
      max[j] = Sundry.max(IQWaveImageData.value[j].data)
    }
    spectrumYvalue.value.max = Math.max(...max)
    spectrumYvalue.value.min = -spectrumYvalue.value.max
  }
}

function render () {
  if (scene.value) {
    const fence = scene.value.fence! as LayerFenceType
    const baseFence = fence.baseFence

    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx, end = baseFence.visibleIndex.max + 1,
      minValue = spectrumYvalue.value.min, rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min,
      height = scene.value.canvas.clientHeight, lineXvalues = baseFence.piecesTrans

    let fenceIndex
    renderCtx.clearScreen()
    for (let j = 0; j < IQWaveImageData.value.length; j++) {
      const item = IQWaveImageData.value[j]
      // 线条
      fenceIndex = baseFence.visibleIndex.min
      ctx.strokeStyle = item.color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(lineXvalues[fenceIndex], (1 - (item.data[fenceIndex] - minValue) / rangeY) * height)
      fenceIndex++
      for (; fenceIndex < end; fenceIndex++) {
        ctx.lineTo(lineXvalues[fenceIndex], (1 - (item.data[fenceIndex] - minValue) / rangeY) * height)
      }
      ctx.stroke()
    }

    scene.value.render2D()
  }
}

function axisXchange (obj: IAxisXValue) {
  spectrumXvalue.value = obj
}

watch(IQWaveImageData, () => {
  watchData()

  render()
})

watch(inputDataLength, (len) => {
  if (scene.value) {
    const fence = scene.value.fence! as LayerFenceType
    defaultValueX.value.max = len - 1
    
    fence.refresh(scene.value.canvas.clientWidth, len)
  }
})

watch(() => props.inputData, () => {
  if (zoomTrans.options.lock) zoomTrans.options.lock = false
  if (toolTip.options.lock) toolTip.options.lock = false
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true
    zoomTrans.options.lock = true

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  }
})

watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value && IQWaveImageData.value.length > 0) {
    const result: Map<string, { info: string, color?: string }> = new Map()
    const fence = scene.value.fence as LayerFenceType
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value)

    result.set('0', { info: `第：${dataIndex}个` })

    const iData = IQWaveImageData.value[0]
    const iValue = iData.data[dataIndex]

    const qData = IQWaveImageData.value[1]
    const qValue = qData.data[dataIndex]

    result.set('i', { info: `I：${iValue}`, color: iData.color })
    result.set('q', { info: `Q：${qValue}`, color: qData.color })
    
    const tags = new Map()

    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min

    tags.set('i', {
      value: 1 - (iValue - spectrumYvalue.value.min) / rangeY,
      backgroundColor: iData.color
    })

    tags.set('q', {
      value: 1 - (qValue - spectrumYvalue.value.min) / rangeY,
      backgroundColor: qData.color
    })

    toolTip.setValueTags(tags)

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
      if (IQWaveImageData.value.length > 0) {
        IQWaveImageData.value[0].color = UseTheme.theme.IQVector.lineColor
        IQWaveImageData.value[1].color = UseTheme.theme.IQVector.pointColor
      }

      render()
    })

    const fence = LayerFence.create(scene.value, { coordinateTrans: scene.value.canvas })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.VERTICAL,
      infoTag: {
        width: 100,
        height: 76
      }
    })

    toolTip.afterTrigger.set('spectrum', (p: IPositionResult) => {
      toolTipPosition.value = p.offsetMiddlePCTX
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('spectrum', () => {
      disableToolTipInfo = true
    })

    fence.afterZoomOrTrans.add(() => {
      render()
    })

    zoomTrans = new ZoomTrans(scene.value)

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (scene.value && scene.value.canvas.clientWidth !== scene.value!.fence!.expectCount) {
        // 刷新
        if (scene.value.canvas.clientWidth === 0) return
        const fence = scene.value.fence! as LayerFenceType
  
        fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
      }

      render()
    })

    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      toolTip,
      toolTipPosition,
      spectrumYvalue,
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
    <div class="iq-wave-image-container">
      <div class="header">
        <span>IQ时域波形图</span>
        <el-tooltip content="绘制点数" :effect="Effect.LIGHT" placement="bottom">
          <el-select size="small" style="width:80px;" v-model="dataPoint">
            <el-option v-for="item in dataPointSelect" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-tooltip>
      </div>
      <div class="second-row">
        <ZXIAxisY
          class="axis-y"
          :color="{ open: false }"
          :controlBtn="false"
          :defaultValue="spectrumYvalue"
          :toFixed="1"
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
            :step="1"
            :defaultValue="defaultValueX"
            :scale="scale"
            @change="axisXchange" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.iq-wave-image-container{
  width: 100%;
  height: 100%;
  display: flex;
  padding: 5px 5px 5px 0;
  box-sizing: border-box;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    height: 35px;
    display: flex;
    color: v-bind('UseTheme.theme.var.color');
    line-height: 35px;
    span{
      padding: 0 10px;
    }
  }
  .second-row{
    flex: auto;
    display: flex;
    .axis-y{
      padding-top: 1px;
      box-sizing: border-box;
      padding-bottom: 28px;
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
        >div{
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .touch-zoom, .data-info-stalker{
          pointer-events: none;
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
  }
}
</style>