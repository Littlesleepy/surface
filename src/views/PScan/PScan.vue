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
import { ref } from 'vue';
import Sample from './components/Sample.vue'
import { usePScan } from '.'

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

</script>

<template>
  <BaseFrame>
    <BaseLink :trigger="trigger">
      <el-button style="width: 100%;" type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
      <hr style="margin-top: .5rem"/>
    </BaseLink>
    <template #set>
      <BaseParams ref="master" :beforeTaskStart="beforeTaskStart" />
    </template>
    <!-- 头部切换视图 -->
    <template #header-center>
      <BaseTabHeader
        class="header-tab"
        :headers="['全景频谱', '信号识别', '样本操作']"
        v-model="currentTabId" />
    </template>
    <ZXITabs
      class="PScan"
      :wrapperStyle="{ border: 'none' }"
      :hidHeader="true"
      v-model="currentTabId">
      <ZXISpectrumScanAndFall
        class="spectrum-scan-and-fall"
        ref="spectrumInstance0"
        :inputData="spectrumScan"
        :params="params"
        :switchLever="store.s_playButton"
        :additionalCurve="additionalCurve"
        :tags="icons"
        :markers="markers"
        @spectrumScene=getSpectrumScene1
        @selectFrequency="selectFrequency">
        <template #header>
          <BaseParamsBranch
            class="params-branch"
            :params="[
              [
                { name: '数据帧率', paramName: 'framerate', ratio: 10 },
                { name: '衰减', paramName: 'attenuation', ratio: 20 },
                { name: '信噪比', paramName: 'AutoSignalDetectedSNR', ratio: 10 }
              ],
              [
                { name: '信号识别', paramName: 'AutoSignalRecognition', ratio: 10 },
                { name: '信号门限', paramName: 'threshold', ratio: 10 },
                { name: '门限容差', paramName: 'occupytolerance', ratio: 10 },
                { name: '信号识别方式', paramName: 'signaldiscriminatemode', ratio: 10 }
              ]
            ]"
            :master="master" />
        </template>
        <template #middle>
          <BaseParamsBranch
            class="params-branch"
            :params="[
              [
                { name: '开始频率', paramName: 'begin', ratio: 10 },
                { name: '分辨率', paramName: 'step', ratio: 10 },
                { name: '结束频率', paramName: 'end', ratio: 10 }
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
  </BaseFrame>
</template>

<style scoped lang="less">
@import url('theme');
.header-tab{
  width: 100%;
  height: 100%;
}
.params-branch{
  padding: 0 0 @btnSpace @btnSpace;
}
.PScan{
  width: 100%;
  height: 100%;
  .spectrum-scan-and-fall{
    width: 100%;
    height: 100%;
  }
}
</style>