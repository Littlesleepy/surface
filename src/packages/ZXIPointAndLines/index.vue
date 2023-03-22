<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 17:17:33
 * @Description: 多条线段带节点图
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, ref, watch, watchEffect, reactive } from 'vue'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import { IAxisYValue } from '..'
import { EAxisXType, ESwitchState, IAxisXValue } from '../types'
import { IPointAndLineData, IPointAndLinePool } from './type'
import { Canvas, Engine, LayerFence, LayerFenceType, Scene, ToolTip, ZoomTrans } from '../core'
import { Sundry } from '../helper'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Map as PropType<Map<string, IPointAndLineData>>,
    default: () => new Map()
  },
  name: { type: String, default: undefined },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  /**
   * @description: 上下预留空间比例
   */    
  capacity: { default: 0.1 },
  pointRadius: { default: 4 }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IPointAndLinePool>): void
}>()

const root = ref<HTMLDivElement>()

const scaleX = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(0))
  }
}

const scaleY = {
  unit: 'dBuV',
  transform: (v: number) => {
    return parseFloat(v.toFixed(1))
  }
}

const dataPoint = ref(256)

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

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

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<IPointAndLinePool>>()

let zoomTrans: ZoomTrans

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<number>()

let dataSize = 0

let lineYvalues = new Float32Array()
/**
 * @description: 绘制数据最大长度
 */    
const maxLength = computed(() => {
  if (props.inputData.size > 0) {
    let max = 0
    for (const [, value] of props.inputData) {
      max = Math.max(max, value.data.length)
    }

    return dataPoint.value > max ? max : dataPoint.value
  }

  return dataPoint.value
})

const cutData = computed(() => {
  const data: Map<string, IPointAndLineData> = new Map()
  for (const [key, value] of props.inputData) {
    data.set(key, {
      colorLine: value.colorLine,
      colorPoint: value.colorPoint,
      data: value.data.subarray(0, maxLength.value)
    })
  }
  return data
})

function axisXchange (obj: IAxisXValue) {
  spectrumXvalue.value = obj
}

/**
 * @description: 如果当前fenceCount发生变化
 */  
function refreshByFenceCountchange () {
  if (scene.value) {
    const fence = scene.value.fence! as LayerFenceType

    lineYvalues = new Float32Array(fence.baseFence.count)

  }
}

function watchCutData () {
  if (scene.value) {
    // 找出最大值和最小值
    let maxArr: Array<number> = []
    let minArr: Array<number> = []
    for (const [, value] of cutData.value) {
      maxArr.push(Sundry.max(value.data))
      minArr.push(Sundry.min(value.data))
    }
    spectrumYvalue.value.max = Math.max(...maxArr)
    spectrumYvalue.value.min = Math.min(...minArr)
    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min

    const dy = rangeY * props.capacity
    spectrumYvalue.value.max += dy
    spectrumYvalue.value.min -= dy

    spectrumYvalue.value.max = Math.ceil(spectrumYvalue.value.max)
    spectrumYvalue.value.min = Math.floor(spectrumYvalue.value.min)
  }
}

function render () {
  if (scene.value) {
    const fence = scene.value.fence! as LayerFenceType
    const baseFence = fence.baseFence
    // canvas渲染，在dataPoint超过512时性能明显不如gl
    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx,
      minValue = spectrumYvalue.value.min, rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min,
      height = scene.value.canvas.clientHeight, lineXvalues = baseFence.piecesTrans
    let fenceIndex, end

    renderCtx.clearScreen()
    for (const [, item] of cutData.value) {
      fenceIndex = baseFence.visibleIndex.min
      end = baseFence.visibleIndex.max + 1
      if (end > item.data.length) end = item.data.length

      // 构造Y坐标集合
      for (; fenceIndex < end; fenceIndex++) {
        lineYvalues[fenceIndex] = (1 - (item.data[fenceIndex] - minValue) / rangeY) * height
      }

      // 线条
      fenceIndex = baseFence.visibleIndex.min
      ctx.strokeStyle = item.colorLine
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(lineXvalues[fenceIndex], lineYvalues[fenceIndex])
      fenceIndex++
      for (; fenceIndex < end; fenceIndex++) {
        ctx.lineTo(lineXvalues[fenceIndex], lineYvalues[fenceIndex])
      }
      ctx.stroke()

      // 圆点
      fenceIndex = baseFence.visibleIndex.min
      const pointRadius = item.pointRadius === undefined ? props.pointRadius : item.pointRadius
      ctx.fillStyle = item.colorPoint
      for (; fenceIndex < end; fenceIndex++) {
        ctx.beginPath()
        ctx.arc(lineXvalues[fenceIndex], lineYvalues[fenceIndex], pointRadius, 0, 360)
        ctx.fill()
      }
    }

    scene.value.render2D()
  }
}

watch(cutData, (v) => {
  if (zoomTrans.options.lock) zoomTrans.options.lock = false
  if (toolTip.options.lock) toolTip.options.lock = false

  if (dataSize !== v.size) {
    dataSize = v.size

    if (toolTip) {
      toolTip.setOptions({
        infoTag: {
          width: dataSize > 1 ? 200 : 130
        }
      })
    }
  }
  
  if (v.size > 0) {
    watchCutData()

    render()
  }
})

watch(maxLength, (len) => {
  if (scene.value) {
    const fence = scene.value.fence! as LayerFenceType
    defaultValueX.value.max = len - 1
    
    fence.refresh(scene.value.canvas.clientWidth, len)
  }
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true
    zoomTrans.options.lock = true

    dataSize = 0

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  }
})

// 游离信息显示
watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value && cutData.value.size > 0) {
    const result: Map<string, { info: string, color?: string }> = new Map()
    const fence = scene.value.fence as LayerFenceType
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value)

    result.set('0', { info: `第${dataIndex}个` })
    
    const tags = new Map()
    let info = ''
    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min
    for (const [key, item] of cutData.value) {
      // data可能undefined
      const data = item.data[dataIndex]
      if (data !== undefined) {
        if (cutData.value.size > 1) {
          info = key + '：' + data.toFixed(1)
        } else {
          info = '值：' + data.toFixed(1)
        }

        result.set(key, { info, color: item.colorLine })

        tags.set(key, {
          value: 1 - (data - spectrumYvalue.value.min) / rangeY,
          backgroundColor: item.colorLine
        })
      }
    }

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

      render()
    })

    const fence = LayerFence.create(scene.value, { coordinateTrans: scene.value.canvas })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.VERTICAL,
      infoTag: {
        width: 100,
        height: 36
      }
    })

    toolTip.afterTrigger.set('spectrum', (p) => {
      toolTipPosition.value = p.offsetMiddlePCTX
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('spectrum', () => {
      disableToolTipInfo = true
    })

    fence.afterRefresh.add(() => {
      refreshByFenceCountchange()
    })

    fence.afterZoomOrTrans.add(() => {
      render()
    })

    zoomTrans = new ZoomTrans(scene.value)

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (sceneDom.value && sceneDom.value.clientWidth !== scene.value!.fence!.expectCount) {
        // 刷新
        if (scene.value) {
          if (scene.value.canvas.clientWidth === 0) return
          const fence = scene.value.fence! as LayerFenceType
    
          fence.refresh(scene.value.canvas.clientWidth, maxLength.value)
        }
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
  if (scene.value) {
    UseTheme.off(themKey)

    scene.value.dispose()
  }
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="point-and-line-container">
      <div class="header">
        <span v-if="name">{{name}}</span>
        <el-tooltip content="数据点数" effect="light" placement="bottom">
          <el-select style="width:80px;" v-model="dataPoint">
            <el-option v-for="item in dataPointSelect" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-tooltip>
      </div>
      <!-- 频谱 -->
      <div class="second-row">
        <ZXIAxisY
          class="axis-Y"
          :color="{ open: false }"
          :controlBtn="false"
          :scale="scaleY"
          :defaultValue="spectrumYvalue"
          :scene="scene"
          :scaleNumWidth="50" />
        <div class="second-column">
          <div class="canvas-father">
            <div class="mount" ref="sceneDom"></div>
          </div>
          <!-- X轴 -->
          <ZXIAxisX
            class="axis-x"
            :xScaleType="EAxisXType.range"
            :scene="scene"
            :step="1"
            :defaultValue="defaultValueX"
            :scale="scaleX"
            @change="axisXchange" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.point-and-line-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
  box-sizing: border-box;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    height: 35px;
    display: flex;
    color: v-bind('UseTheme.theme.var.color');
    line-height: 35px;
    span{
      padding: 0 10px;
      font-size: 12px;
    }
  }
  .second-row{
    flex: auto;
    display: flex;
    .axis-Y{
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
        box-sizing: border-box;
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        position: relative;
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