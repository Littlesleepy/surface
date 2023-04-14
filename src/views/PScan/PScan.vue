<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-01-12 10:24:03
 * @FilePath: \zxi-device\src\views\PScan\PScan.vue
 * @Description: 全景扫描
 -->

<script setup lang="ts">
import SignalList from './components/SignalList.vue'
import BaseLink from 'cp/BaseLink/BaseLink.vue'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import { BaseParamsType } from '@/types';
import { onMounted, ref } from 'vue';
import Sample from './components/Sample.vue'
import { usePScan } from '.'
import { UseTheme } from 'mcharts/index'

const {
  store,
  route,
  defaultValueY,
  additionalCurve,
  icons,
  params,
  scaleY,
  hopSpeed,
  occupyShow,
  spectrumScan,
  occupancySpectrum,
  autoThreshold,
  sampleData,
  getSpectrumScene1,
  getSpectrumScene2,
  selectFrequency,
  trigger,
  markers,
  beforeTaskStart,
  getSample,
  currentTabId,
  spectrumInstance0,
  spectrumInstance1
} = usePScan()

const master = ref<BaseParamsType>()

const hideParam = new Set(['occupy', 'saverowdata', 'occupyspantime'])

onMounted(() => {
  if (master.value) {
    const elements = master.value.elements

    // 隐藏部分参数
    elements.forEach((el) => {
      if (hideParam.has(el.paramName)) el.show = false
    })
  }
})

</script>

<template>
  <BaseMonitorFrame>
    <BaseLink :trigger="trigger">
      <el-button style="width: 100%;" type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
      <hr style="margin-top: .5rem"/>
    </BaseLink>
    <template #set>
      <BaseParams ref="master" :dynamicParam="false" :beforeTaskStart="beforeTaskStart" />
    </template>
    <!-- 头部切换视图 -->
    <template #header-center>
      <BaseTabHeader
        style="width: 100%;height: 100%; padding: .5rem; box-sizing: border-box;"
        :headers="['全景频谱', '信号识别', '样本操作']"
        v-model="currentTabId" />
    </template>
    <ZXITabs
      class="PScan"
      :wrapperStyle="{ border: 'none' }"
      :hidHeader="true"
      v-model="currentTabId">
      <ZXISpectrumScanAndFall
        class="spectrum-scan-and-fall tab-item"
        ref="spectrumInstance0"
        :inputData="spectrumScan"
        :params="params"
        :switchLever="store.s_playButton"
        :additionalCurve="additionalCurve"
        :tags="icons"
        :markers="markers"
        useSelectFrequency
        @spectrumScene=getSpectrumScene1
        @selectFrequency="selectFrequency">
        <template #header>
          <BaseParamsBranch
            class="params-branch0"
            :params="[
              [
                { name: '数据帧率', paramName: 'framerate', ratio: 11 },
                { name: '衰减', paramName: 'attenuation', ratio: 18 },
                { name: '信噪比', paramName: 'AutoSignalDetectedSNR', ratio: 11 }
              ],
              [
                { name: '信号识别', paramName: 'AutoSignalRecognition', ratio: 11 },
                { name: '信号门限', paramName: 'threshold', ratio: 9 },
                { name: '门限容差', paramName: 'occupytolerance', ratio: 9 },
                { name: '信号识别方式', paramName: 'signaldiscriminatemode', ratio: 11 }
              ]
            ]"
            :master="master" />
        </template>
        <template #middle>
          <BaseParamsBranch
            class="params-branch1"
            :params="[
              [
                { name: '开始频率', paramName: 'begin', ratio: 11 },
                { name: '分辨率', paramName: 'step', ratio: 18 },
                { name: '结束频率', paramName: 'end', ratio: 11 }
              ]
            ]"
            :master="master" />
        </template>
      </ZXISpectrumScanAndFall>
      <SignalList
        class="tab-item"
        tabName="信号识别"
        :lists="autoThreshold.signals"
        :hopSpeed="hopSpeed" />
      <Sample
        tabName="样本操作"
        class="tab-item"
        :inputData="sampleData"
        :viewCurrent="currentTabId === 2"
        :params="params"
        @result="getSample" />
    </ZXITabs>
  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');
.params-branch0{
  padding: 0 0 0 @btnSpace;
}
.params-branch1{
  padding: 0 0 @btnSpace 11.5rem;
}
.PScan{
  width: 100%;
  height: 100%;
  .spectrum-scan-and-fall{
    width: 100%;
    height: 100%;
  }
  .tab-item{
    padding: @btnSpace @btnSpace 0 @btnSpace;
    box-sizing: border-box;
    background: v-bind('UseTheme.theme.var.backgroundColor');
  }
}
</style>