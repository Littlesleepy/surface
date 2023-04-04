<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-03-10 16:29:10
 * @Description: 绘制多条抽取类型线
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, reactive, ref, watch, watchEffect } from 'vue'
import { EAxisXType, IAxisXValue, ESwitchState, IAxisYValue, IUnitAxis, ITargetIcon, EBtncontrolType, IBtncontrols, Controls, createMarker } from '../types'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import ZXIControlBtn from '../ZXIControlBtn'
import { Caliper, IPositionResult, isLayersFenceType, LayersFenceType, Marker, Scene, ToolTip } from '../core'
import { SampleLines, ILineData, ISampleLinesPool } from './type'
import { Sundry } from '..'
import { UseTheme } from '../styles'
import MarkerChain from '../ZXISpectrumScanAndFall/components/MarkerChain.vue'

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
  controlBtnY: { default: true },
  xScaleType: {
    type: Number as PropType<EAxisXType>,
    default: EAxisXType.symmetry
  },
  defaultValueY: {
    type: Object as PropType<IAxisYValue>,
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
    default: 50
  },
  toolTip: {
    default: () => {
      return {
        width: 300,
        height: 56
      }
    }
  },
  /**
   * @description: 信号标记
   */    
  tags: { type: Array as PropType<Array<ITargetIcon>>, default: () => [] },
  /** 
   * @description: 刷新
   */    
  refresh: { default: false },
  biaozhu: { default: false }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<ISampleLinesPool>): void
  (e: 'update:biaozhu', result: boolean): void
}>()

const biaozhuModle = computed({
  get: () => props.biaozhu,
  set: (v) => {
    emit('update:biaozhu', v)
  }
})

watch(biaozhuModle, (v) => {
  btnValues.biaozhu = v
})

const controls = ref<Array<IBtncontrols>>([{
  type: EBtncontrolType.switch,
  title: '标注',
  paramName: Controls.biaozhu
}])

const btnValues = reactive({
  biaozhu: false
})

const root = ref<HTMLDivElement>()

const sceneDom = ref<HTMLDivElement>()

const sceneL = ref<Scene<ISampleLinesPool>>()

const spectrumYvalue = ref<IAxisYValue>({ max: 0, min: 0 })

const spectrumXvalue = ref<IAxisYValue>({ max: 0, min: 0 })

let toolTipL: ToolTip

const scaleValueY = ref<IAxisYValue>({ max: 0, min: 0})

const inputDataLength = ref(0)

const usingData = computed(() => {
  for (const [, v] of props.inputData) {
    return { data: v.data, time: 0 }
  }
})

// 峰标文字显示
const showTagsText = computed(() => {
if (sceneL.value) {
  const fence = sceneL.value.fence
  if (fence) {
    if (isLayersFenceType(fence)) {
      return !fence.sampling
    } else {
      if (fence.baseFence.eachPieceWidth * fence.practicalCount < 2) return false
    }
  }
}

return true
})

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

// 数据抽取和绘图数据构造
function watchInputData () {
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

/**....................................卡尺工具................................ */
let caliper: Caliper

const caliperPosition = ref<IPositionResult>()

watch(() => btnValues.biaozhu, (v) => {
  biaozhuModle.value = v
  if (caliper) {
    if (v) {
      caliper.open()
    } else {
      caliper.close()
    }
  }
})

watchEffect(() => {
  if (caliperPosition.value && sceneL.value) {
    const fence = sceneL.value.fence as LayersFenceType
    if (inputData.value.size > 0) {
      const result: Map<string, { info: string, color?: string }> = new Map()
      const dataIndex = fence.getDataIndexByDistance(caliperPosition.value.offsetMiddlePCTX)
      // X
      const dataX = props.defaultValueX.min + dataIndex * step.value

      result.set('0', {
        info: `${props.scaleX.transform(dataX)} ${props.scaleX.unit}`
      })

      caliper.setContent(result)
    }
  }
})

/** .............................................marker............................................. */
const params = computed(() => {
  return { begin: props.defaultValueX.min, end: props.defaultValueX.max }
})
const {
  marker,
  addMarker,
  setMarkerPoints
} = createMarker(computed(() => props.scaleX), params, step)

watch([spectrumYvalue, () => props.inputData], () => setMarkerPoints(spectrumYvalue.value, inputData.value))

onMounted(() => {
  if (sceneDom.value) {
    const {
      scene,
      cutDataIndexArrMap,
      toolTip,
      toolTipPosition,
      disableToolTipInfo
    } = SampleLines.create(props, sceneDom.value, inputDataLength, inputData, switchLever, spectrumYvalue)

    sceneL.value = scene.value

    toolTipL = toolTip

    toolTipL.setOptions({ infoTag: props.toolTip })
    // 卡尺
    caliper = new Caliper(sceneL.value!.container, {
      scene: scene.value
    })

    caliper.infoTag!.remove()

    caliper.afterClose.set('caliper', () => {
      btnValues.biaozhu = false
      caliperPosition.value = undefined

      if (marker.value) {
        marker.value.clear()
      }
    })

    caliper.afterTrigger.set('caliper', (p) => {
      caliperPosition.value = { ...p }

      caliper.infoTag!.append()
    })

    caliper.afterEnd.set('caliper', (p) => {
      caliperPosition.value = { ...p }
      
      caliper.infoTag!.remove()

      if (inputData.value.size > 0) {
        const fence = scene.value!.fence as LayersFenceType
        const dataIndex = fence.getDataIndexByDistance(p.offsetMiddlePCTX)
        // 频率
        const dataX =  props.defaultValueX.min + dataIndex * step.value

        addMarker([props.scaleX.transform(dataX)])
        setMarkerPoints(spectrumYvalue.value, props.inputData)
      }
    })

    if (btnValues.biaozhu) caliper.open()

    // marker标注
    marker.value = new Marker(sceneL.value!)
    marker.value.closeButton.style.top = '60px'

    // @ts-ignore
    scene.value.pool = reactive({
      spectrumXvalue,
      spectrumYvalue,
      toolTip,
      toolTipPosition,
      disableToolTipInfo,
      cutDataIndexArrMap,
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
    <MarkerChain
      :usingData="inputData"
      :marker="marker"
      :scaleX="scaleX"
      :scaleY="scaleY"
      :step="step" />
    <div class="container">
      <div class="header">
        <!-- 工具部分 -->
        <ZXIControlBtn
          class="control"
          :controls="controls"
          :btnValues="btnValues"
          :controlStyle="{ wrapper: { width: legends.length ? '240px' : '150px' } }">
          <el-tooltip v-for="(legend, index) in legends" :key="index" effect="dark" :content="legend.name" placement="right" >
            <div class="legend">
              <span :style="{ backgroundColor: legend.backgroundColor }" />
              <p>{{ legend.name }}</p>
            </div>
          </el-tooltip>
        </ZXIControlBtn>
        <span v-if="name" class="name">{{ name }}</span>
        <div class="header-slot">
          <slot></slot>
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
          <!-- 第二列 -->
        <div class="second-column">
          <div class="draw-img">
            <div class="mount" ref="sceneDom" >
              <!-- 信号标记 -->
              <ZXIIcons
                class="tool"
                v-if="tags.length > 0"
                :axisYValue="spectrumYvalue"
                :icons="tags"
                :scene="sceneL"
                :step="step"
                :usingData="usingData"
                :showText="showTagsText" />
            </div>
          </div>
          <ZXIAxisX
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
      .legend{
        width: 100%;
        padding-top: 5px;
        display: flex;
        line-height: @font20;
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
          font-size: @font20;
        }
      }
    }

    .name{
      font-size: @font20;
      padding-left: 10px;
    }
    .header-slot{
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
        }
      }
    }
  }
}
</style>