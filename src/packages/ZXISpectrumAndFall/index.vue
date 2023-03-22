<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 16:53:02
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISpectrumAndFall\index.vue
 * @Description: 绘制数据非拼接频谱图和瀑布图
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
import HeaderInfo from './components/HeaderInfo.vue'
import MarkerManager from '../ZXISpectrumScanAndFall/components/MarkerManager.vue'

import { spectrum } from './spectrum'
import { fall } from './fall'
import { EAxisXType, ESwitchState, IAxisYValue, IBtncontrols, IHighlightItem, ITargetIcon, IUnit } from '../types'
import { IAdditionalCurve, ISelectFrequency, ISpectrumAndFallFallPool, ISpectrumAndFallSpectrumPool, ISpectrumInputData, ISpectrumParams } from './type'
import { Scene } from '../core'
import { UseTheme } from '../styles'

import ZXISwitchButtons from '../ZXISwitchButtons'

interface IZXISpectrumAndFallProps {
  name?: string
  switchLever?: ESwitchState
  refresh?: boolean
  /**
   * @description: 输入原始数据，数组0号索引为第一帧数据
   */ 
  inputData: Array<ISpectrumInputData>
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
      end: 0
    }
  },
  xScaleType: EAxisXType.symmetry,
  defaultValueY: () => { return { max: 90, min: -20 } },
  controlStyle: () => { return { wrapper: { width: '400px' }, item: { width: '33.33%' } } },
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
  markers: () => [],
  name: '频谱图'
})

const emit = defineEmits<{
  (e: 'selectFrequency', result: ISelectFrequency): void
  (e: 'spectrumScene', result: Scene<ISpectrumAndFallSpectrumPool>): void
  (e: 'fallScene', result: Scene<ISpectrumAndFallFallPool>): void
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
  if (props.params.step !== undefined) {
    return props.params.step
  } else {
    if (inputDataLength.value > 0) {
      return (props.params.end - props.params.begin) / (inputDataLength.value - 1)
    }
  }
  return 0
})

const {
  buttons,
  controls,
  btnValues,
  inputData,
  usingData,
  spectrumAxisX,
  spectrumAxisY,
  axisYColor,
  spectrumDom,
  inputDataLength,
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
  axisYChange,
  axisXChange,
  resetSpectrum
} = spectrum(props, emit, defaultValueX, step)
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
} = fall(props, spectrumScene, inputData, spectrumYvalue, defaultValueX, step, usingData, fallLock,
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
          <span class="name" v-if="name !== undefined">{{name}}</span>
          <div class="slot-content">
            <!-- 头部插槽 -->
            <slot name="header"></slot>
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
          @change="axisYChange" />
        <!-- 第二列 -->
        <div class="second-column">
          <!-- 图区 -->
          <div class="draw-container">
            <div class="mount" ref="spectrumDom">
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
            @change="axisXChange" />
        </div>
      </div>
      <!-- 中部插槽 -->
      <div class="middle">
        <slot name="middle"></slot>
      </div>
      <!-- 瀑布图 -->
      <div class="fall" v-show="btnValues.pubutu">
        <ZXIAxisTimeY
          class="axis-time-y"
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
      left: 5px;
      top: 0px;
      z-index:100;
    }
    .single-header-info{
      width: 100%;
      padding-left: 60px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      .name{
        line-height: @headerHeight;
        font-size: 16px;
        color: v-bind('UseTheme.theme.var.color');
      }
      .slot-content{
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

  .middle{

  }
  .fall{
    height: 50%;
    display: flex;
    .axis-time-y{
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