<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-24 15:00:44
 * @Description: 绘制非抽取类型多条线
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, reactive, ref, watch } from 'vue'
import { EAxisXType, IAxisXValue, ESwitchState, IAxisYValue, ILineData, IUnitAxis } from '../types'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import ZXIControlBtn from '../ZXIControlBtn'
import { Scene, ToolTip } from '../core'
import { NoSampleLines, INoSampleLinesPool } from './type'
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
  scaleX: {
    type: Object as PropType<IUnitAxis>,
    default: () => {
      return {
        unit: 'MHz',
        transform: (v: number) => {
          return parseFloat(v.toFixed(6))
        }
      }
    }
  },
  scaleY: {
    type: Object as PropType<IUnitAxis>,
    default: () => {
      return {
        unit: 'dBuV',
        transform: (v: number) => {
          return parseFloat(v.toFixed(0))
        }
      }
    }
  },
  controlBtnY: { type: Boolean, default: true },
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
      return { max: 90, min: -10 }
    }
  },
  name: { type: String, default: '' },
  capacity: { default: 0.1 },
  scaleNumWidthY: {
    default: 30
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
  (e: 'scene', result: Scene<any>): void
}>()

const root = ref<HTMLDivElement>()

let dataSize = 0

const sceneDom = ref<HTMLDivElement>()

const sceneL = ref<Scene<INoSampleLinesPool>>()

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

const spectrumXvalue = ref<IAxisYValue>({ max: 0, min: 0 })

let toolTipL: ToolTip

const scaleValueY = ref<IAxisYValue>({ max: 0, min: 0})

const inputDataLength = ref(0)

const inputData = computed(() => props.inputData)

const switchLever = computed(() => props.switchLever)

const step = computed(() => {
  if (inputDataLength.value) {
    return (props.defaultValueX.max - props.defaultValueX.min) / (inputDataLength.value - 1)
  }
  return 0
})

// 线条图例
const legends = computed(() => {
  const arr: Array<{ backgroundColor: string, name: string }> = []
  if (props.inputData.size > 1) {
    for (const [key, value] of props.inputData) {
      arr.push({ backgroundColor: value.color, name: key })
    }
  }
  return arr
})

// 是否启用控制器
const enableControl = computed(() => {
  if (legends.value.length <= 1) return false
  return true
})

const headerStyle = computed(() => {
  if (legends.value.length > 1) return {}
  if (props.name !== '') return { height: '25px' }
  return { height: '5px' }
})

function axisYChange (obj: IAxisYValue) {
  spectrumYvalue.value = obj
}

function axisXChange (obj: IAxisXValue) {
  spectrumXvalue.value = obj
}

// 数据最大最小值和绘图数据构造
function watchInputData () {
  if (dataSize !== props.inputData.size) {
    dataSize = props.inputData.size

    if (toolTipL) {
      const height = dataSize > 1 ? dataSize * 40 + 16 : 56
      toolTipL.setOptions({
        infoTag: {
          height
        }
      })
    }
  }
  // 计算出Y轴最大值和最小值
  if (!props.controlBtnY && props.inputData.size) {
    const maxArr: number[] = []
    const minArr: number[] = []
    for (const [, value] of props.inputData) {
      maxArr.push(Sundry.max(value.data))
      minArr.push(Sundry.min(value.data))
    }
    const max = Math.max(...maxArr)
    const min = Math.min(...minArr)
    const dy = (max - min) * props.capacity
    scaleValueY.value.max = max + dy
    scaleValueY.value.min = min - dy
  }
}



watch(() => props.inputData, watchInputData)

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    dataSize = 0
  }
})

onMounted(() => {
  if (sceneDom.value) {
    const {
      scene,
      toolTip,
      toolTipPosition,
      disableToolTipInfo
    } = NoSampleLines.create(sceneDom.value, inputDataLength, inputData, switchLever, spectrumYvalue)

    sceneL.value = scene.value

    toolTipL = toolTip

    toolTipL.setOptions({ infoTag: props.toolTip })

    // @ts-ignore
    scene.value.pool = reactive({
      spectrumXvalue,
      spectrumYvalue,
      toolTip,
      toolTipPosition,
      disableToolTipInfo,
      inputData,
      step,
      inputDataLength
    })

    emit('scene', scene.value!)

    onBeforeUnmount(() => {
      if (scene.value) scene.value.dispose()
    })
  }
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="container">
      <div class="header" :style="headerStyle">
        <!-- 工具部分 -->
        <div class="wrapper">
          <ZXIControlBtn
            class="control"
            v-if="enableControl"
            :controlStyle="{ wrapper: { width: '240px' } }">
            <el-tooltip v-for="(legend, index) in legends" :key="index" effect="dark" :content="legend.name" placement="right" >
              <div class="legend">
                <span :style="{ backgroundColor: legend.backgroundColor }" />
                <p>{{ legend.name }}</p>
              </div>
            </el-tooltip>
          </ZXIControlBtn>
          <div class="header-info" v-if="name !== ''">
            <span>{{name}}</span>
          </div>
          <div calss="header-slot">
            <slot></slot>
          </div>
        </div>
      </div>
      <!-- 第二行 -->
      <div class="second-row">
        <!-- Y轴 -->
        <ZXIAxisY
          class="axis-y"
          :scene="sceneL"
          :defaultValue="controlBtnY ? defaultValueY : scaleValueY"
          :scale="scaleY"
          :controlBtn="controlBtnY"
          :color="{ open: false }"
          :scaleNumWidth="scaleNumWidthY"
          @change="axisYChange" />
        <div class="second-column">
          <div class="draw-img">
            <div class="mount" ref="sceneDom" />
          </div>
          <!-- X轴 -->
          <ZXIAxisX
            class="axis-x"
            :xScaleType="xScaleType"
            :scene="sceneL"
            :defaultValue="defaultValueX"
            :step="step"
            :scale="scaleX"
            @change="axisXChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.container{
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
    height: @headerHeight;
    position: relative;
    color: v-bind('UseTheme.theme.var.color');
    .wrapper{
      position: absolute;
      left: 10px;
      top: 2px;
      display: flex;
      .control{
        height: 100%;
        width: 25px;
        z-index: 2;
        .legend{
          width: 100%;
          padding-top: 5px;
          display: flex;
          line-height: 14px;
          color: v-bind('UseTheme.theme.var.tipColor');
          span{
            width: 60px;
            height: 5px;
            margin: auto 0;
          }
          p{
            flex: 1;
            padding-left: 5px;
            width: 0;
            .textOverflow();
            font-size: 12px;
          }
        }
      }
      .header-info{
        height: 100%;
        box-sizing: border-box;
        display: flex;
        span{
          font-size: 12px;
          line-height: 20px;
          margin: auto 0;
        }
      }
      .header-slot{
        height: 100%;
      }
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
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
  }
}
</style>