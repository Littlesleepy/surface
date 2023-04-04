<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-23 11:19:28
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-22 11:41:17
 * @FilePath: \zxi-device\src\views\CIQStream\components\Frequency.vue
 * @Description: 频域特征
 -->

<script setup lang="ts">
import { useFrameStore } from '@/store'
import { ElMessage } from 'element-plus'
import { computed, PropType, Ref, ref, watch } from 'vue'
import { ISpectrumAndFallFallPool, ISpectrumInputData, ISpectrumParams, Scene, EAxisXType, ZXISpectrumAndFall, ZXISpectrumLine, UseTheme } from 'mcharts/index'
import { IIQAnalysis, ISpectrumData } from '..'
import { Axios } from '@/server'
import { Device, Sundry, ToExport } from '@/helper'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import { BaseParamsType } from '@/types'

const props = defineProps({
  inputData: {
    type: Object as PropType<IIQAnalysis>
  },
  refresh: {
    default: false
  },
  timeDomainResult: {
    type: Object as PropType<{ begin: number, end: number }>
  },
  master: {
    type: Object as PropType<BaseParamsType>
  }
})

const emit = defineEmits<{
  (e: 'fallScene', result: Scene<ISpectrumAndFallFallPool>): void
}>()

const scaleY = {
  unit: '',
  parse: (v: number) => {
    return `值：${v.toFixed(1)}`
  },
  transform: (v: number) => {
    return parseFloat(v.toFixed(1))
  }
}

const frameStore = useFrameStore()

const spectrum = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])

const params = ref({
  begin: 0,
  end: 0,
  bandwidth: 0
})

const inputData1 = ref(new Float32Array())

const inputData2 = ref(new Float32Array())

const inputData3 = ref(new Float32Array())

const inputData4 = ref(new Float32Array())

const inputData5 = ref(new Float32Array())

const inputData6 = ref(new Float32Array())

const inputData7 = ref(new Float32Array())

const param5 = computed<ISpectrumParams>(() => {
  return {
    begin: 0,
    end: params.value.bandwidth / 2
  }
})

let fallScene: Scene<ISpectrumAndFallFallPool> | undefined
/**
 * @description: 获取瀑布图场景
 */    
function getFallScene (scene: Scene<ISpectrumAndFallFallPool>) {
  fallScene = scene
  emit('fallScene', scene)
}

// 瞬时包络
function receiveSpectrum (data: Array<number>, receive: Ref<Float32Array>, half = false) {
  if (props.inputData) {
    const len = Math.floor(data.length / 2)
    const result = half ? new Float32Array(data.slice(len)) : new Float32Array(data)
    receive.value = result
  }
}

function spectrumData (v: ISpectrumData) {
  // 频谱参数
  const form = frameStore.s_form
  const frequency = Number(form.frequency)
  params.value = {
    begin: frequency - v.samplingRate / 2000,
    end: frequency + v.samplingRate / 2000,
    bandwidth: v.samplingRate / 1000
  }

  // 频谱数据
  const datas = v.spectrums
  if (datas.length === 0) ElMessage.warning('时域选取点数少于128将不会得到频域特征中的滑动频谱数据')
  let item: { time: string, data: Array<number>, timeSpan: number }
  const result: Array<ISpectrumInputData> = new Array(datas.length)
  for (let i = 0, len = datas.length; i < len; i++) {
    item = datas[i]
    result[i] = { data: new Float32Array(item.data), time: new Date(item.time).getTime(), timeSpan: item.timeSpan }
  }

  spectrum.value = result
}

watch(() => props.inputData, (v) => {
  if (v) {
    spectrumData(v.spectrumData)
    // 功率谱
    receiveSpectrum(v.powerSpectrum, inputData1)
    // 四次方谱
    receiveSpectrum(v.quadSpectrum, inputData2)
    // 二次方谱
    receiveSpectrum(v.squareSpectrum, inputData3)
    // 八次方谱
    receiveSpectrum(v.eightSpectrum, inputData4)
    // 瞬时频率包络
    receiveSpectrum(v.ifEnvelopeSpectrum, inputData5)
    // 瞬时幅度包络
    receiveSpectrum(v.iaEnvelopeSpectrum, inputData6)
    // FM解调谱
    receiveSpectrum(v.fmDemodulationSpectrum, inputData7)
  }
})

watch(() => frameStore.s_viceForm.fft, (v) => {
  if (props.timeDomainResult && fallScene) {
    const realWidth = Device.getSamplingRateByBandwidth(Number(frameStore.s_form.bandwidth))
    // 时间分辨率
    const resolutionRatio = (Number(frameStore.s_form.efactor) / realWidth) // ms
    
    const params = {
      taskId: frameStore.s_taskId,
      startIndex: props.timeDomainResult.begin,
      stopIndex: props.timeDomainResult.end,
      fftPoints: v,
      totalFrame: fallScene.canvas.clientHeight,
      timeInterval: resolutionRatio
    }
    const marker = Sundry.createMarker({
      text: '获取滑动频谱数据中。。。'
    })
    
    Axios({
      url: 'api/Monitor/CIQStream/iqAnalysisSpectrum',
      params
    }).then(msg => {
      spectrumData(msg.data)
    }).catch(err => {
      ElMessage.error(err.data)
    }).finally(() => {
      marker.close()
    })
  }
})

// 导出结果
const spSpectrum = ref<InstanceType<typeof ZXISpectrumAndFall>>()
const spctrumLine0 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine1 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine2 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine3 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine4 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine5 = ref<InstanceType<typeof ZXISpectrumLine>>()
const spctrumLine6 = ref<InstanceType<typeof ZXISpectrumLine>>()

ToExport.beforExport.set('2', () => {
  if (spectrum.value[0].data.length > 0) {
    // 标题
    ToExport.addText('', '----频域特征----', 7, {
      PDF: { contentSize: 24 },
      Excel: { options: { size: 24 } }
    })
    // 频谱
    ToExport.addDom('频谱', spSpectrum.value!.root!, 8)
  }
  // 功率谱
  if (inputData1.value.length > 0) ToExport.addDom('功率谱', spctrumLine0.value!.root!, 9)
  // 二次方谱
  if (inputData3.value.length > 0) ToExport.addDom('二次方谱', spctrumLine2.value!.root!, 10)
  // 四次方谱
  if (inputData2.value.length > 0) ToExport.addDom('四次方谱', spctrumLine1.value!.root!, 11)
  // 八次方谱
  if (inputData4.value.length > 0) ToExport.addDom('八次方谱', spctrumLine3.value!.root!, 12)
  // 瞬时频率包络
  if (inputData5.value.length > 0) ToExport.addDom('瞬时频率包络', spctrumLine4.value!.root!, 13)
  // 瞬时幅度包络
  if (inputData6.value.length > 0) ToExport.addDom('瞬时幅度包络', spctrumLine5.value!.root!, 14)
  // FM解调谱
  if (inputData7.value.length > 0) ToExport.addDom('FM解调谱', spctrumLine6.value!.root!, 15)
})

const currentTabId = ref(0)

const defaultValueY = { max: 60, min: -50 }
</script>

<template>
  <div class="Frequency">
    <!-- 左边按钮区域 -->
      <BaseTabHeader
        class="left"
        :headers="[
          [{ name: '滑动频谱', ratio: 1 }],
          [{ name: '功率谱', ratio: 1 }],
          [{ name: '二次方谱', ratio: 1 }],
          [{ name: '四次方谱', ratio: 1 }],
          [{ name: '八次方谱', ratio: 1 }],
          [{ name: '瞬时频率包络', ratio: 1 }],
          [{ name: '瞬时幅度包络', ratio: 1 }],
          [{ name: 'FM解调谱', ratio: 1 }]
        ]"
        v-model="currentTabId" />
      <!-- 右边图区 -->
      <ZXITabs
        class="right"
        :wrapperStyle="{ border: 'none' }"
        :hidHeader="true"
        v-model="currentTabId">
        <ZXISpectrumAndFall
          class="spectrum-and-fall"
          ref="spSpectrum"
          name="滑动频谱"
          :inputData="spectrum"
          :defaultValueY="defaultValueY"
          :params="params"
          :switchLever="frameStore.s_playButton"
          :infiniteFall="true"
          :singleMode="true"
          :refresh="refresh"
          @fallScene="getFallScene" >
          <template #header>
            <BaseParamsBranch
              style="width: 300px;padding-left: .5rem;"
              :params="[
                [
                  { name: '频域特征FFT点数', paramName: 'fft', ratio: 10 }
                ]
              ]"
              :master="master" />
          </template>
        </ZXISpectrumAndFall>
        <ZXISpectrumLine
          class="spectrum"
          ref="spctrumLine0"
          :name="'功率谱'"
          :inputData="inputData1"
          :params="params"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          class="spectrum"
          ref="spctrumLine2"
          :name="'二次方谱'"
          :inputData="inputData3"
          :params="params"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          class="spectrum"
          ref="spctrumLine1"
          :name="'四次方谱'"
          :inputData="inputData2"
          :params="params"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          class="spectrum"
          ref="spctrumLine3"
          :name="'八次方谱'"
          :inputData="inputData4"
          :params="params"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          class="spectrum"
          ref="spctrumLine4"
          :name="'瞬时频率包络'"
          :inputData="inputData5"
          :params="param5"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :deleteTool="['pinlvhuafen']"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          ref="spctrumLine5"
          class="spectrum"
          :name="'瞬时幅度包络'"
          :inputData="inputData6"
          :params="param5"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :deleteTool="['pinlvhuafen']"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
        <ZXISpectrumLine
          ref="spctrumLine6"
          class="spectrum"
          :name="'FM解调谱'"
          :inputData="inputData7"
          :params="param5"
          :switchLever="frameStore.s_playButton"
          :controlBtnY="false"
          :deleteTool="['pinlvhuafen']"
          :xScaleType="EAxisXType.range"
          :refresh="refresh"
          :scaleY="scaleY" />
      </ZXITabs>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.Frequency{
  width: 100%;
  height: 100%;
  display: flex;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .left{
    width: 150px;
    margin-right: @btnSpace;
  }
  .right{
    flex: auto;
  }
}
</style>