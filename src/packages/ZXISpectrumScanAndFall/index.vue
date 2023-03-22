<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-02 09:46:59
 * @FilePath: \zxi-device\src\packages\ZXISpectrumScanAndFall\index.vue
 * @Description: 绘制数据拼接频谱图和瀑布图
 -->


<script setup lang="ts">
import { computed, ref, CSSProperties, watch } from 'vue'
import ZXIAxisY from '../ZXIAxisY'
import ZXIAxisX from '../ZXIAxisX'
import ZXIAxisTimeY from '../ZXIAxisTimeY'
import ZXIControlBtn from '../ZXIControlBtn'
import ZXIIcons from '../ZXIIcons'
import ZXIHighlight from '../ZXIHighlight'
import ZXIFrequencyDivision from '../ZXIFrequencyDivision'
import HeaderInfo from '../ZXISpectrumAndFall/components/HeaderInfo.vue'
import ScanPointer from './components/ScanPointer.vue'
import MarkerManager from './components/MarkerManager.vue'

import { spectrum } from './spectrum'
import { fall } from './fall'
import { EAxisXType, ESwitchState, IAxisYValue, IBtncontrols, IHighlightItem, ITargetIcon, IUnit, IAdditionalCurve, ISelectFrequency, ISpectrumParams } from '../types'
import { ISpectrumScanAndFallFallPool, ISpectrumScanAndFallSpectrumPool, ISpectrumScanInputData } from './type'
import { Scene } from '../core'
import { UseTheme } from '../styles'

interface IZXISpectrumAndFallProps {
  name?: string
  switchLever: ESwitchState
  refresh?: boolean
  /**
   * @description: 输入原始数据，数组0号索引为第一帧数据
   */ 
  inputData: Array<ISpectrumScanInputData>
  /**
   * @description: 附加的曲线，颜色rgb通道应归一化[0-1]
   */
  additionalCurve?: Map<string, IAdditionalCurve>
  /**
   * @description: 参数
   */    
  params: ISpectrumParams
  xScaleType?: EAxisXType
  defaultValueY?: IAxisYValue
  /**
   * @description: 控制工具样式
   */    
  controlStyle?: { wrapper: CSSProperties, item: CSSProperties }
  setTool?: Array<{ name: string, value: any }>
  deleteTool?: Array<string>
  addTool?: Array<{ btn: IBtncontrols, value: any  }>
  /**
   * @description: 信号标记
   */ 
  tags?: Array<ITargetIcon>
  /**
   * @description: 信号高亮
   */
  hightlightItems?: Array<IHighlightItem>
  /**
   * @description: Y轴坐标单位
   */  
  scaleY?: IUnit
  /**
   * @description: X轴坐标单位
   */    
  scaleX?: IUnit
  /**
   * @description: 瀑布图存储限制，false有限，true无限
   */  
  infiniteFall?: boolean
  /**
   * @description: 外部传入门限
   */
  singleThreshold?: number
  /**
   * @description: 单次输入数据模式
   */  
  singleMode?: boolean
  /** 
   * @description: 信号标记
   */  
  markers?: Array<number>
}

const props = withDefaults(defineProps<IZXISpectrumAndFallProps>(), {
  switchLever: ESwitchState.off,
  refresh: false,
  inputData: () => [],
  additionalCurve: () => new Map(),
  params: () => {
    return {
      begin: 0,
      end: 0,
      step: 0
    }
  },
  xScaleType: EAxisXType.range,
  defaultValueY: () => { return { max: 90, min: -20 } },
  controlStyle: () => { return { wrapper: { width: '360px', height: '140px' }, item: { width: '33.33%' } } },
  setTool: () => [],
  deleteTool: () => [],
  addTool: () => [],
  tags: () => [],
  hightlightItems: () => [],
  scaleY: () => {
    return {
      unit: 'dBuV',
      parse: (v: number) => {
        return `幅度：${v.toFixed(1)} dBuV|${(v - 107).toFixed(1)} dBm`
      },
      transform: (v: number) => {
        return parseFloat(v.toFixed(1))
      }
    }
  },
  scaleX: () => {
    return {
      unit: 'MHz',
      parse: (v: number) => {
        return `频率：${parseFloat(v.toFixed(6))}MHz|${parseFloat((v * 1000).toFixed(3))}kHz`
      },
      transform: (v: number) => {
        return parseFloat(v.toFixed(6))
      }
    }
  },
  infiniteFall: false,
  singleMode: false,
  markers: () => []
})

const emit = defineEmits<{
  (e: 'selectFrequency', result: ISelectFrequency): void
  (e: 'spectrumScene', result: Scene<ISpectrumScanAndFallSpectrumPool>): void
  (e: 'fallScene', result: Scene<ISpectrumScanAndFallFallPool>): void
}>()

const root = ref<HTMLDivElement>()

/**
 * @description: 横坐标起始值
 */    
const defaultValueX = computed(() => {
  return { 
    min: props.params.begin,
    max: props.params.end
  }
})

/**
 * @description: 频率步进MHz
 */    
const step = computed(() => {
  if (props.params.step === undefined) throw new Error('请配置props.params.step')
  return props.params.step
})

const inputDataLength = computed(() => {
  let len = 0
  if (props.params.step !== undefined) {
    len = Math.ceil((props.params.end - props.params.begin) / props.params.step) + 1
  } else {
    throw new Error('请配置props.params.step')
  }
  if (len < 0) { len = 0 }
  return len
})

const {
  axisYColor,
  controls,
  btnValues,
  scanIndex,
  inputData,
  usingData,
  spectrumAxisX,
  spectrumAxisY,
  afterStaticData,
  spectrumDom,
  spectrumYvalue,
  spectrumXvalue,
  spectrumScene,
  showTagsText,
  peakIcons,
  dbThresholdValue,
  marker,
  markerManagers,
  markerManagerTrigger,
  statisticalBuffer,
  axisYCahnge,
  axisYChange,
  resetSpectrum
} = spectrum(props, emit, defaultValueX, step, inputDataLength)

/**
 * @description: 瀑布图隐藏
 */    
const fallLock = computed(() => btnValues.pubutu)

const pubutusave = computed(() => btnValues.pubutusave)

const {
  fallAxisYColor,
  fallDom,
  fallScene,
  inputDataBuffer,
  fallScroll,
  resetFall
} = fall(props, spectrumScene, inputDataLength, afterStaticData, spectrumYvalue, defaultValueX, step, usingData, fallLock,
  pubutusave, dbThresholdValue, btnValues, controls)

watch(spectrumScene, (scene) => {
  emit('spectrumScene', scene!)
})

watch(fallScene, (scene) => {
  if (scene && spectrumScene.value) spectrumScene.value.shareFenceTo(scene)
  emit('fallScene', scene!)
})

watch(() => props.inputData, (data) => {
  inputData.value = data
})

watch(() => props.refresh, () => {
  resetSpectrum()
  resetFall()
})


defineExpose({
  root,
  btnValues
})

</script>

<template>
  <div ref="root">
    <MarkerManager
      :marker="marker"
      :markerManagers="markerManagers"
      :trigger="markerManagerTrigger"
      :statisticalBuffer="statisticalBuffer"
      :usingData="usingData"
      :step="step"
      :scaleX="scaleX"
      :scaleY="scaleY" />
    <div class="container">
      <!-- 头部 -->
      <div class="header">
        <!-- 工具部分 -->
        <ZXIControlBtn
          class="single-control"
          :controls="controls"
          :btnValues="btnValues"
          :controlStyle="controlStyle" />
        <div class="single-header-info">
          <span v-if="name !== undefined">{{name}}</span>
          <HeaderInfo class="left" :params="params" :step="step" :xScaleType="xScaleType" />
          <div>
            <slot></slot>
          </div>
        </div>
      </div>
      <!-- 频谱 -->
      <div class="spectrum">
        <!-- Y轴 -->
        <ZXIAxisY
          class="axis-y"
          ref="spectrumAxisY"
          :scene="spectrumScene"
          :defaultValue="defaultValueY"
          :scale="scaleY"
          :color="axisYColor"
          @change="axisYCahnge" />
        <!-- 第一行 -->
        <div class="second-column">
          <div class="draw-container">
            <div class="mount" ref="spectrumDom">
              <ScanPointer
                class="tool"
                :index="scanIndex"
                :scene="spectrumScene" />
              <!-- 峰标 -->
              <ZXIIcons
                class="tool"
                v-if="peakIcons.length > 0"
                :axisYValue="spectrumYvalue"
                :icons="peakIcons"
                :scene="spectrumScene"
                :step="step"
                :usingData="usingData" />
              <!-- 信号标记 -->
              <ZXIIcons
                class="tool"
                v-if="tags.length > 0"
                :axisYValue="spectrumYvalue"
                :icons="tags"
                :scene="spectrumScene"
                :step="step"
                :usingData="usingData"
                :showText="showTagsText" />
              <!-- 高亮 -->
              <ZXIHighlight
                v-if="hightlightItems.length > 0"
                class="tool"
                :axisXValue="spectrumXvalue"
                :items="hightlightItems"
                :scene="spectrumScene"
                :step="step" />
              <!-- 频率划分 -->
              <ZXIFrequencyDivision
                class="tool frequency-division"
                v-if="btnValues.pinlvhuafen"
                :axisXValue="spectrumXvalue" />
            </div>
          </div>
          <!-- X轴 -->
          <ZXIAxisX
            class="axis-x"
            ref="spectrumAxisX"
            :xScaleType="xScaleType"
            :scene="spectrumScene"
            :defaultValue="defaultValueX"
            :step="step"
            :scale="scaleX"
            @change="axisYChange" />
        </div>
      </div>
      <!-- 瀑布图 -->
      <div class="fall" v-show="btnValues.pubutu">
        <ZXIAxisTimeY
          class="axis-y"
          :scene="fallScene"
          :inputDataBuffer="inputDataBuffer"
          :fallCeliang="btnValues.fallCeliang"
          :color="fallAxisYColor"
          @viewMove="fallScroll" />
        <div class="draw-container">
          <div class="mount" ref="fallDom" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    height: @headerHeight;
    position: relative;
    .single-control{
      width: @headerHeight;
      height: 100%;
      position: absolute;
      left: 10px;
      top: 1px;
      z-index: 2;
    }
    .single-header-info{
      width: 100%;
      padding-left: 35px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      span{
        line-height: @headerHeight;
        font-size: 12px;
        color: v-bind('UseTheme.theme.var.color');
        padding-right: 10px;
      }
      .left{
        flex: auto;
      }
    }
  }
  .spectrum{
    flex: auto;
    display: flex;
    padding-bottom: 5px;
    box-sizing: border-box;
    .axis-y{
      padding-top: 1px;
      box-sizing: border-box;
      padding-bottom: 28px;
    }
    .second-column{
      flex: auto;
      display: flex;
      flex-direction: column;
      .draw-container{
        flex: auto;
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        position: relative;
        .mount{
          width: 100%;
          height: 100%;
          .tool{
            position: absolute;
            width: 100%;
            height: 100%;
            // pointer-events: none;
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
  .fall{
    height: 50%;
    display: flex;
    .axis-y{
      width: 90px;
      box-sizing: border-box;
      padding-top: 1px;
      padding-bottom: 1px;
    }
    .draw-container{
      flex: auto;
      border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
      border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
      border-bottom: 1px solid v-bind('UseTheme.theme.var.borderColor');
      .mount{
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>