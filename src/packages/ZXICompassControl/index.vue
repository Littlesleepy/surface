<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 13:46:28
 * @Description: 带门限和电平控制的罗盘图
 * 
-->

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ICompassControl } from './type'
import ZXICompass from '../ZXICompass/index.vue'
import { ESwitchState, ICompassPool } from '../types'
import { Scene } from '../core';
import { UseTheme } from '../styles'

/** props */
interface ZXICompassControlProps {
  inputData: ICompassControl
  switchLever: ESwitchState
  deleteTool?: boolean
  defaultTool?: '次数优先' | '质量优先'
  controlStyle?: { wrapper: { width: string, height: string }, item: { width: string } }
  refresh?: boolean
  resideTime?: number
  name?: string
  levelThreshold: number
}

const props = withDefaults(defineProps<ZXICompassControlProps>(), {
  inputData: () => {
    return {
      bearing: new Float32Array(),
      quality: new Float32Array(),
      level: 0,
      time: new Date()
    }
  },
  switchLever: ESwitchState.off,
  deleteTool: false,
  defaultTool: '次数优先',
  controlStyle: () => {
    return {
      wrapper: { width: '130px', height: '65px' },
      item: { width: '100%' } }
  },
  refresh: false,
  resideTime: 10,
  name: undefined,
  levelThreshold: -100
})

/** emits */
defineEmits<{
  (e: 'scene', result: Scene<ICompassPool>): void,
  (e: 'levelThresholdChange', level: number): void
}>()

const root = ref<HTMLDivElement>()

const qualityThreshold = ref(0)

const levelValue = ref(0)

const levelDom = ref<HTMLSpanElement>()

const qualityDom = ref<HTMLSpanElement>()

const compassData = ref({ time: new Date(), quality: new Float32Array(), bearing: new Float32Array() })

function qualityValueFormat (value: number) {
  return value + '%'
}

watch(() => props.inputData, (data) => {
  qualityDom.value!.style.width = data.quality[0] + '%'
  levelDom.value!.style.width = (data.level + 100) / 2.2 + '%'
  // 罗盘
  compassData.value = data
})

watch(() => props.levelThreshold, (data) => {
  if (data !== undefined) levelValue.value = data
}, { immediate: true })

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="container">
      <ZXICompass
        class="radar-image"
        :name="name"
        :switchLever="switchLever"
        :inputData="compassData"
        :defaultTool="defaultTool"
        :deleteTool="deleteTool"
        :controlStyle="controlStyle"
        :resideTime="resideTime"
        :qualityThreshold="qualityThreshold"
        :refresh="refresh"
        @scene="(scene) => { $emit('scene', scene) }" />
      <div class="compass-control">
        <div class="compass-control-container">
          <el-slider
            class="quality"
            v-model="qualityThreshold"
            :min="0"
            :max="100"
            :format-tooltip="qualityValueFormat" />
          <div class="quality-info">
            <span ref="qualityDom" />
          </div>
          <p>
            <span>质量门限: {{qualityThreshold + '%'}}</span>
            <span>实时质量:<span class="info-style">
              {{ inputData.quality.length === 0 ? 0 : inputData.quality[0].toFixed(2)}}
            </span>%</span>
          </p>
          <el-slider
            class="level"
            v-model="levelValue"
            @change="(value) => { $.emit('levelThresholdChange', value) }"
            :min="-100"
            :max="120" />
          <div class="quality-info">
            <span ref="levelDom" />
          </div>
          <p>
            <span>电平门限：{{levelValue.toFixed(0)}}</span>
            <span>实时电平:<span class="info-style">{{inputData.level.toFixed(2)}}</span>dBuV</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .radar-image{
    flex: auto;
  }
  .compass-control{
    width: 100%;
    .compass-control-container{
      width: 100%;
      height: 100%;
      opacity: 1;
      :deep(.el-slider__button-wrapper){
        z-index: 5!important;
      }
      :deep(.el-slider__runway){
        margin: 12px 0;
      }
      :deep(.el-slider__input){
        display: none;
      }
      .quality, .level{
        padding: 0 10px;
        box-sizing: border-box;
      }
      .quality-info{
        padding: 0 10px;
        box-sizing: border-box;
        width: 100%;
        >span{
          display: block;
          width: 0%;
          height: 4px;
          border-radius: 4px;
          background-color: rgb(4, 182, 18);
        }
      }
      >p{
        height: 15px;
        font-size: 12px;
        color: v-bind('UseTheme.theme.var.color');
        text-align: center;
        >span{
          height: 100%;
          display: inline-block;
          line-height: 15px;
          .info-style{
            display: inline-block;
            width: 30px;
            text-align: right;
          }
        }
        >span:first-child{
          width: 40%;
        }
        >span:last-child{
          width: 60%;
        }
      }
    }
  }
}
</style>