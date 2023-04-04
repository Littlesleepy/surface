<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 09:23:47
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 14:42:15
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\views\SingleMeasure\SingleMeasure.vue
 * @Description: 
 -->

<script setup lang="ts">
import ShowInfo from './components/ShowInfo.vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import { useSingleMeasure } from '.'
import { isRef, onMounted, ref } from 'vue';
import BaseParams from 'cp/BaseParams/BaseParams.vue';
import { BaseParamsType, EParamsType, IParamElement } from '@/types';
import { UseTheme } from 'mcharts/index'


const {
  spectrumInstance0,
  store,
  params,
  hightlightItems,
  clear,
  route,
  spectrum,
  changeFrequency,
  selectFrequency,
  trigger,
  markers,
  subaudioDecoding,
  ITU,
  modulate,
  decodingState
} = useSingleMeasure()

const master = ref<BaseParamsType>()

const tabId = ref(0)

</script>

<template>
  <BaseMonitorFrame>
     <BaseLink :trigger="trigger">
      <div class="base-link">
        <el-button type="primary" round @click="changeFrequency">切换频率</el-button>
        <el-button type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
      </div>
      <hr>
    </BaseLink>
    <template #set>
      <BaseParams ref="master" :disableBtnAfterTaskStart="{ all: false }" />
    </template>
    <!-- 头部切换视图 -->
    <template #header-center>
      <BaseTabHeader
        style="width: 100%;height: 100%; padding: .5rem; box-sizing: border-box;"
        :headers="['频谱', 'ITU测量', '调制识别', '数字语音解调/解码状态', '亚音解码']"
        v-model="tabId" />
    </template>
    <ZXITabs
      class="single-tabs"
      :wrapperStyle="{ border: 'none' }"
      :hidHeader="true"
      v-model="tabId">
      <ZXISpectrumAndFall
        ref="spectrumInstance0"
        class="spectrum-and-fall"
        :inputData="spectrum"
        :params="params"
        :switchLever="store.s_playButton"
        :hightlightItems="hightlightItems"
        :markers="markers"
        @selectFrequency="selectFrequency">
        <template #header>
          <BaseParamsBranch
            class="params-branch"
            :params="[
              [
                { name: '解调模式', paramName: 'demodulation', ratio: 9.1 },
                { name: '衰减', paramName: 'attenuation', ratio: 6.9 },
                { name: '禁噪门限', paramName: 'squelch', ratio: 11.3 },
                { name: 'Itu', paramName: 'itumeasure', ratio: 5.9 },
                { name: '音频', paramName: 'tcpaudio', ratio: 5.9 }
              ]
            ]"
            :master="master" />
        </template>
        <template #middle>
            <BaseParamsBranch
              class="params-branch"
              :params="[
                [
                  { name: '频谱带宽', paramName: 'bandwidth', ratio: 8.6 },
                  { name: '中心频率', paramName: 'frequency', ratio: 12 },
                  { name: '解调带宽', paramName: 'debw', ratio: 8 }
                ]
              ]"
              :master="master" />
          </template>
      </ZXISpectrumAndFall>
      <ZXIItu :inputData="ITU" />
      <ZXIModulate :inputData="modulate" />
      <ZXIScrollInfo :clear="clear" :inputData="decodingState" :wrapperStyle="{ padding: '0' }" />
      <ZXISubaudioDecoding :inputData="subaudioDecoding" />
    </ZXITabs>
  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');
.base-link{
  display: flex;
  justify-content:space-around;
}
.header-tab{
  width: 100%;
  height: 100%;
}

.params-branch{
  padding: 0 0 @btnSpace @btnSpace;
}
.single-tabs{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .spectrum-and-fall{
    width: 100%;
    flex: auto;
    padding: @btnSpace @btnSpace 0 @btnSpace;
    box-sizing: border-box;
    background: v-bind('UseTheme.theme.var.backgroundColor');
  }
}

</style>