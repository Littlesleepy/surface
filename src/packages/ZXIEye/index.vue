<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-04-23 17:31:46
 * @Description: 眼图
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, watch, reactive, watchEffect } from 'vue'
import { IAxisXValue, IAxisYValue, EAxisXType, ESwitchState } from '../types'
import { IEyeData, IEyePool } from './type'
import { Canvas, Engine, IPositionResult, Scene, ToolTip } from '../core'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Object as PropType<IEyeData>,
    default: () => {
      return {
        sampleRate: 0,
        baudRate: 0,
        eyePhaseData: new Float32Array(),
        eyeAmplitudeData: new Float32Array()
      }
    },
    required: true
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  name: { type: String, default: '眼图' }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IEyePool>): void
}>()

const root = ref<HTMLDivElement>()

const scale = {
  unit: '',
  transform: (v: number) => {
    return parseFloat(v.toFixed(0))
  }
}

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

const spectrumXvalue = ref<IAxisXValue>({ max: 0, min: 0 })

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<IEyePool>>()

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<IPositionResult>()

let vertex = new Float32Array()

const eyeType = ref(true)

const eyetypes = ref([{
  value: true,
  label: '相位'
}, {
  value: false,
  label: '幅度'
}])

const symbloCycle = ref(5)

const symbloCycles = ref([{
  value: 1,
  label: '1'
}, {
  value: 2,
  label: '2'
}, {
  value: 3,
  label: '3'
}, {
  value: 4,
  label: '4'
}, {
  value: 5,
  label: '5'
}, {
  value: 6,
  label: '6'
}, {
  value: 7,
  label: '7'
}, {
  value: 8,
  label: '8'
}, {
  value: 9,
  label: '9'
}, {
  value: 10,
  label: '10'
}])

const eyeCount = ref(32)

const eyeCounts = ref([{
  value: 32,
  label: '32'
}, {
  value: 64,
  label: '64'
}, {
  value: 128,
  label: '128'
}, {
  value: 256,
  label: '256'
}, {
  value: 512,
  label: '512'
}, {
  value: 1024,
  label: '1024'
}])

function getMaxMin (data: Float32Array) {
  let max = data[0]
  let min = max
  let item = max
  for (let i = 1, len = data.length; i < len; i++) {
    item = data[i]
    if (max < item) max = item
    if (min > item) min = item
  }

  return { max, min }
}

function render () {
  if (scene.value) {
    // 使用eyephase数据绘刢，该数据的采样速率由返回数据项samplingrate
    // 指明，设为Fs，则相邻两个数据点乀间的时间间隑为Ts = 1 / Fs；根据输入参数中的码元速率Fm，
    // 则码元周期为Tm = 1 / Fm。设定要显示连续N个码元的眼图，则横坐标的时间周期为T = N * Tm，
    // 需显示点数D = T / Ts，将eyephase数组按D分段，每段横坐标范围0~D - 1，纵坐标为对应eyephase
    // 索引值重绘叠加绘制（建议叠加次数不少于16次）。
    if (props.inputData === null || props.inputData.sampleRate === 0 || props.inputData.eyePhaseData.length === 0) return
    // 采样周期
    const Ts = 1.0 / (props.inputData.sampleRate * 1000)
    // 码元周期
    const Tm = 1.0 / (props.inputData.baudRate * 1000)
    // 横坐标显示周期
    const T = symbloCycle.value * Tm
    let D = T / Ts
    if (D < 1) D = 1
    const data = eyeType.value ? props.inputData.eyePhaseData : props.inputData.eyeAmplitudeData

    spectrumYvalue.value = getMaxMin(data)
    // 一行数据长度
    const oneRow = Math.floor(D)
    if (spectrumXvalue.value.max + 1 !== oneRow) {
      spectrumXvalue.value.max = oneRow + 1
      vertex = new Float32Array(oneRow)
      const dx = scene.value.canvas.clientWidth / (oneRow - 1)
      for (let i = 0; i < oneRow; i++) {
        vertex[i] = dx * i
      }
    }

    let maxCount = Math.floor(data.length / oneRow)
    if (eyeCount.value < oneRow) maxCount = eyeCount.value

    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx
    renderCtx.clearScreen()

    ctx.strokeStyle = UseTheme.theme.Eye.lineColor
    ctx.lineWidth = 1

    const y = spectrumYvalue.value, rangeY = y.max - y.min, height = scene.value.canvas.clientHeight

    for (let i = 0; i < maxCount; i++) {
      ctx.beginPath()
      ctx.moveTo(vertex[0], (1 - (data[0] - y.min) / rangeY) * height)

      const start = Math.floor(D * i)
      for (let j = 1; j < oneRow; j++) {
        ctx.lineTo(vertex[j], (1 - (data[j + start] - y.min) / rangeY) * height)
      }
      ctx.stroke()
    }

    scene.value.render2D()
  }
}

watch(() => props.inputData, () => {
  if (toolTip.options.lock) toolTip.options.lock = false

  render()
})


watch([eyeType, symbloCycle, eyeCount], render)

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true

    vertex = new Float32Array()

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  }
})

// 游离信息显示
watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value && props.inputData.eyePhaseData.length > 0) {
    const result: Map<string, { info: string, color?: string }> = new Map()

    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min
    const rangeX = spectrumXvalue.value.max - spectrumXvalue.value.min
    const p = toolTipPosition.value

    result.set('0', { info: 'x:' + (p.offsetMiddlePCTX * rangeX + spectrumXvalue.value.min).toFixed(0) })
    result.set('1', { info: 'y:' + ((1 - p.offsetMiddlePCTY) * rangeY + spectrumYvalue.value.min).toFixed(0) })

    toolTip.setContent(result)
  }
})

let themKey

onMounted(() => {
  if (sceneDom.value) {
    const engine = new Engine(sceneDom.value)

    const ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })

    scene.value = new Scene(engine, ctx)

    // 注册主题
    themKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.rgb.backgroundColor

      ctx.clearScreen()
      render()
    })

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.CROSS,
      infoTag: {
        width: 130,
        height: 56
      }
    })

    toolTip.afterActive.set('spectrum', (p) => {
      toolTipPosition.value = p
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
      if (scene.value && spectrumXvalue.value.max > 0) {
        const oneRow = spectrumXvalue.value.max + 1
        vertex = new Float32Array(oneRow)
        const dx = scene.value.canvas.clientWidth / (oneRow - 1)
        for (let i = 0; i < oneRow; i++) {
          vertex[i] = dx * i
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
    <div class="eye-image-container">
      <div class="header">
        <span>{{name}}</span>
        <ZXISelect style="width: 200px;" name="数据类型" v-model="eyeType">
          <el-option v-for="item in eyetypes" :key="item.label" :label="item.label" :value="item.value" />
        </ZXISelect>
        <ZXISelect style="width: 160px;margin: 0 5px;" name="码元周期" v-model="symbloCycle">
          <el-option v-for="item in symbloCycles" :key="item.label" :label="item.label" :value="item.value" />
        </ZXISelect>
        <ZXISelect style="width: 200px;" name="累加次数" v-model="eyeCount">
          <el-option v-for="item in eyeCounts" :key="item.label" :label="item.label" :value="item.value" />
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
          :defaultValue="spectrumYvalue"
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
            :scale="scale"
            :defaultValue="spectrumXvalue" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.eye-image-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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