<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-21 16:05:37
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXISpectrumLine\index.vue
 * @Description: 
 -->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, reactive, ref, watch, watchEffect, WatchStopHandle } from 'vue'
import * as Helper from '../helper/index'
import { IBtncontrols, EBtncontrolType, ISpectrumParams, EAxisXType, IAxisXValue, ESwitchState, IAxisYValue, SpectrumData, ILineData, IUnit, Controls } from '../types'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import ZXIFrequencyDivision from '../ZXIFrequencyDivision'
import { Canvas, Engine, IPositionResult, LayersFence, LayersFenceType, Scene, ToolTip, ZoomTrans } from '../core'
import { ISpectrumLinePool } from './type'
import { Sundry } from '../helper/index'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Object as PropType<Float32Array>,
    default: () => new Float32Array()
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
  controlBtnY: { default: true },
  xScaleType: {
    type: Number as PropType<EAxisXType>,
    default: EAxisXType.symmetry
  },
  setTool: {
    type: Array as PropType<Array<{ name: string, value: any }>>,
    default: () => []
  },
  deleteTool: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },
  defaultValueY: {
    default: () => {
      return { max: 90, min: -10 }
    }
  },
  scaleNumWidthY: {
    default: 50
  },
  name: { type: String, default: '' },
  capacity: { default: 0.1 },
  refresh: {
    default: false
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
  toolTip: {
    default: () => {
      return {
        width: 420,
        height: 56
      }
    }
  }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<ISpectrumLinePool>): void
}>()

const root = ref<HTMLDivElement>()

const controls = ref<Array<IBtncontrols>>([{
    type: EBtncontrolType.switch,
    title: '峰值',
    paramName: Controls.fengzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.fengzhiColor, true)
  }, {
    type: EBtncontrolType.switch,
    title: '均值',
    paramName: Controls.junzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.junzhiColor, true)
  }, {
    type: EBtncontrolType.switch,
    title: '谷值',
    paramName: Controls.guzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.guzhiColor, true)
  },
{
  type: EBtncontrolType.switch,
  title: '频率划分',
  paramName: 'pinlvhuafen'
}])

const btnValues = ref({
  fengzhi: false,
  junzhi: false,
  guzhi: false,
  pinlvhuafen: true
})

// 设置默认工具值
props.setTool.forEach((x: { name: string, value: any }) => {
  // @ts-ignore
  btnValues.value[x.name] = x.value
})

props.deleteTool.forEach(x => {
  controls.value.forEach((btn, i) => {
    if (x === btn.paramName) {
      controls.value.splice(i, 1)
      // @ts-ignore
      btnValues.value[x] = false
    }
  })
})

const inputDataLength = ref(0)

let lineYvalues = new Float32Array()

let fenceCount = 0

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<ISpectrumLinePool>>()

let toolTip: ToolTip

let zoomTrans: ZoomTrans

/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<number>()

const scaleValueY = ref<IAxisYValue>({ max: 0, min: 0})

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0})

const spectrumXvalue = ref<IAxisXValue>({ max: 0, min: 0})

const renderData = ref(new Map<string, ILineData>())

/**
 * @description: 数据统计计算
 */
const statisticalBuffer = reactive({
  input: new Float32Array(),
  max: new Float32Array(),
  min: new Float32Array(),
  sum: new Float64Array(),
  mean:  new Float32Array(),
  count: new Map<number, number>()
})

const defaultValueX = computed<IAxisXValue>(() => {
  return { max: props.params.end, min: props.params.begin }
})

const step = computed(() => {
  if (inputDataLength.value) {
    return (defaultValueX.value.max - defaultValueX.value.min) / (inputDataLength.value - 1)
  }
  return 0
})

function axisYChange (obj: IAxisYValue) {
  spectrumYvalue.value = obj
}

function axisXChange (obj: IAxisXValue) {
  spectrumXvalue.value = obj
}

// 数据抽取和绘图数据构造
function watchInputData (data: Float32Array) {
  if (zoomTrans.options.lock) zoomTrans.options.lock = false
  if (toolTip.options.lock) toolTip.options.lock = false

  if (inputDataLength.value !== data.length) {
    inputDataLength.value = data.length

    initStatisticalBuffer()

    // 刷新fence
    if (scene.value) {
      if (scene.value.canvas.clientWidth === 0) return
      const fence = scene.value.fence! as LayersFenceType

      fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
    }
  }

  // 均值峰值谷值统计
  SpectrumData.statisticalData(data, statisticalBuffer)
  
  makeRenderData()

  render()
}

function makeRenderData () {
  const colors = UseTheme.theme.SpectrumAndFall
  let c: Array<number> = colors.baoluotuColor
  
  renderData.value.set('输入',
    { data: props.inputData, color: UseTheme.transColor([c[0] * 255, c[1] * 255, c[2] * 255]) } )
  // 1.峰值
  if (btnValues.value.fengzhi) {
    c = colors.fengzhiColor
    renderData.value.set('峰值',
    { data: statisticalBuffer.max, color: UseTheme.transColor([c[0] * 255, c[1] * 255, c[2] * 255]) })
  } else {
    renderData.value.delete('峰值')
  }
  // 2.均值
  if (btnValues.value.junzhi) {
    c = colors.junzhiColor
    renderData.value.set('均值', { data: statisticalBuffer.mean, color: UseTheme.transColor([c[0] * 255, c[1] * 255, c[2] * 255]) })
  } else {
    renderData.value.delete('均值')
  }
  // 3.谷值
  if (btnValues.value.guzhi) {
    c = colors.guzhiColor
    renderData.value.set('谷值', { data: statisticalBuffer.min, color: UseTheme.transColor([c[0] * 255, c[1] * 255, c[2] * 255]) })
  } else {
    renderData.value.delete('谷值')
  }

  // 计算出Y轴最大值和最小值
  if (!props.controlBtnY) {
    const maxArr: number[] = []
    const minArr: number[] = []
    for (const [, value] of renderData.value) {
      maxArr.push(Sundry.max(value.data))
      minArr.push(Sundry.min(value.data))
    }
    const max = Math.max(...maxArr)
    const min = Math.min(...minArr)
    const dy = (max - min) * props.capacity
    scaleValueY.value.max = max + dy
    scaleValueY.value.min = min - dy

    spectrumYvalue.value.max = scaleValueY.value.max
    spectrumYvalue.value.min = scaleValueY.value.min

  }
}

// 初始化统计数据
function initStatisticalBuffer () {
  statisticalBuffer.input = new Float32Array(inputDataLength.value)
  statisticalBuffer.max = new Float32Array(inputDataLength.value)
  statisticalBuffer.min = new Float32Array(inputDataLength.value)
  statisticalBuffer.sum = new Float64Array(inputDataLength.value)
  statisticalBuffer.mean = new Float32Array(inputDataLength.value)
  statisticalBuffer.count = new Map([[0, 0]])
}

/**
 * @description: 如果当前fenceCount发生变化
 */  
function refreshByFenceCountchange () {
  if (scene.value) {
    const fence = scene.value.fence! as LayersFenceType

    lineYvalues = new Float32Array(fence.baseFence.count)
  }
}

function render () {
  if (scene.value) {
    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx,
      fence = scene.value.fence as LayersFenceType, height = scene.value!.canvas.clientHeight,
      minY = spectrumYvalue.value.min, rangeY = spectrumYvalue.value.max - minY, end = fence.baseFence.visibleIndex.max + 1,
      lineXvalues = fence.baseFence.piecesTrans
    let fenceIndex

    renderCtx.clearScreen()
    // 数据抽取，确保最长数据项最后抽取，保证cutDataIndexArr正确
    for (const [key, item] of renderData.value) {
      if (key === '输入') {
        SpectrumData.getSamplingData(item.data, lineYvalues, fence)
      } else {
        SpectrumData.getSamplingDataLine(item.data, lineYvalues, fence)
      }

      // 绘制
      ctx.strokeStyle = item.color
      ctx.lineWidth = 1

      fenceIndex = fence.baseFence.visibleIndex.min

      // y值可能为undefined，部分线条可能较短
      ctx.beginPath()
      ctx.moveTo(lineXvalues[fenceIndex], (1 - (lineYvalues[fenceIndex] - minY) / rangeY) * height)
      
      for (fenceIndex++; fenceIndex < end; fenceIndex++) {
        ctx.lineTo(lineXvalues[fenceIndex], (1 - (lineYvalues[fenceIndex] - minY) / rangeY) * height)
      }

      ctx.stroke()
    }

    scene.value.render2D()
  }
}

/**
 * @description: 重置
 */  
function resetSpectrum () {
  if (scene.value) {
    initStatisticalBuffer()
    
    renderData.value.clear()

    render()
  }
}

watch(() => props.inputData, (data) => {
  watchInputData(data)
})

watch([() => btnValues.value.fengzhi, () => btnValues.value.junzhi, () => btnValues.value.guzhi], () => {
  makeRenderData()

  render()
})

watch(spectrumYvalue, () => {
  if (props.controlBtnY) render()
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true
    zoomTrans.options.lock = true

    inputDataLength.value = 0

    renderData.value.clear()

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  }
})

watch(() => props.refresh, () => {
  resetSpectrum()
})

watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value) {
    const result: Map<string, { info: string, color?: string }> = new Map()
    const tags = new Map<string, { value: number, backgroundColor: string }>()

    const fence = scene.value.fence as LayersFenceType
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value)
    // 频率
    const frequency = defaultValueX.value.min + dataIndex * step.value

    result.set('1', {
      info: `${props.scaleX.parse(frequency)}`
    })
    // 幅度
    let range, rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min
    for (const [key, item] of renderData.value) {
      range = item.data[dataIndex]
      result.set(key, {
        info: `${key}${props.scaleY.parse(range)}`,
        color: item.color
      })

      tags.set(key, {
        value: 1 - (range - spectrumYvalue.value.min) / rangeY,
        backgroundColor: item.color
      })
    }

    toolTip.setContent(result)

    toolTip.setValueTags(tags)
  }
})

let themeKey

onMounted(() => {
  if (sceneDom.value) {
    const engine = new Engine(sceneDom.value)

    const ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })

    scene.value = new Scene(engine, ctx, { backgroundColor: Helper.Echart.MOCK_BG_COLOR_S })

    themeKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.rgb.backgroundColor

      if (props.inputData.length > 0) makeRenderData()

      const colors = UseTheme.theme.SpectrumAndFall
      controls.value.forEach(el => {
        const key = el.paramName + 'Color'
        if (el.activeColor !== undefined && key in colors) {
          el.activeColor = UseTheme.transColor(colors[key], true)
        }
      })

      render()
    })

    const fence = LayersFence.create(scene.value, { coordinateTrans: scene.value.canvas })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.VERTICAL,
      infoTag: props.toolTip
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

    fence.afterRefresh.add(() => {
      const fence = scene.value!.fence as LayersFenceType
      // fenceCount数量变化导致坐标集变化
      if (fenceCount !== fence.baseFence.count) {
        fenceCount = fence.baseFence.count

        refreshByFenceCountchange()
      }
    })

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (scene.value && scene.value.canvas.clientWidth !== scene.value.fence!.expectCount) {
        if (scene.value.canvas.clientWidth === 0) return
        const fence = scene.value.fence! as LayersFenceType
  
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
      spectrumXvalue,
      statisticalBuffer
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  if (scene.value) {
    UseTheme.off(themeKey)
    scene.value.dispose()
  }
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="spectrum-lines-container">
      <div class="header">
        <!-- 工具部分 -->
        <ZXIControlBtn
          class="control"
          :controls="controls"
          :btnValues="btnValues"
          :controlStyle="{ wrapper: { width: '400px' }, item: { width: 'calc(50% - 10px)' } }">
        </ZXIControlBtn>
        <span class="name" v-if="name">{{name}}</span>
        <div class="slot">
          <slot />
        </div>
      </div>
      <!-- 第二行 -->
      <div class="second-row">
        <!-- X轴 -->
        <ZXIAxisY
          class="axis-y"
          :scene="scene"
          :defaultValue="controlBtnY ? defaultValueY : scaleValueY"
          :controlBtn="controlBtnY"
          :color="{ open: false }"
          :scaleNumWidth="scaleNumWidthY"
          :scaleY="scaleY"
          @change="axisYChange" />
        <div class="second-column">
          <div class="draw-img">
            <div class="mount" ref="sceneDom">
              <!-- 频率划分 -->
              <ZXIFrequencyDivision
                class="tool frequency-division"
                v-if="btnValues.pinlvhuafen"
                :axisXValue="spectrumXvalue" />
            </div>
          </div>
          <ZXIAxisX
            class="axis-x"
            :xScaleType="xScaleType"
            :scene="scene"
            :defaultValue="defaultValueX"
            :step="step"
            :scaleX="scaleX"
            @change="axisXChange" />
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped lang="less">
@import url('../assets/styles/theme');
.spectrum-lines-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-right: 5px;
  box-sizing: border-box;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  /* 头部信息面板 */
  .header{
    width: 100%;
    color: v-bind('UseTheme.theme.var.color');
    display: flex;
    align-items: center;
    padding-bottom: 5px;
    box-sizing: border-box;
    .control{
      height: 100%;
      z-index: 99999;
      width: 60px;
    }
    .name{
      padding-left: 10px;
      font-size: @font20;
    }
    .slot{
      flex: auto;
      height: 100%;
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
      .draw-img{
        flex: auto;
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        touch-action: none;
        .mount{
          width: 100%;
          height: 100%;
          .tool{
            position: absolute;
            width: 100%;
            height: 100%;
          }
          .frequency-division{
            top: auto;
            bottom: 0;
            height: auto;
            z-index: 0;
          }
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
  }
}
</style>