<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 09:23:47
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-06 13:50:31
 * @FilePath: \zxi-surface\src\views\SingleMeasure\SingleMeasure.vue
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
  decodingState,
  reset
} = useSingleMeasure()

const master = ref<BaseParamsType>()

const tabId = ref(0)

const hideParam = new Set(['saveaudiodata', 'saverowdata', 'chiqdata'])

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
      <div class="base-link">
        <el-button type="primary" round @click="changeFrequency">切换频率</el-button>
        <el-button type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
      </div>
      <hr style="margin-top: .5rem"/>
    </BaseLink>
    <template #set>
      <BaseParams ref="master" />
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
        :refresh="reset"
        @selectFrequency="selectFrequency"
        useSelectFrequency>
        <template #header>
          <BaseParamsBranch
            class="params-branch0"
            :params="[
              [
                { name: '解调模式', paramName: 'demodulation', ratio: 11 },
                { name: '衰减', paramName: 'attenuation', ratio: 9 },
                { name: '禁噪门限', paramName: 'squelch', ratio: 9 },
                { name: 'ITU', paramName: 'itumeasure', ratio: 5.5 },
                { name: '音频', paramName: 'tcpaudio', ratio: 5.5 }
              ]
            ]"
            :master="master" />
        </template>
        <template #middle>
          <BaseParamsBranch
            class="params-branch1"
            :params="[
              [
                { name: '频谱带宽', paramName: 'bandwidth', ratio: 11 },
                { name: '中心频率', paramName: 'frequency', ratio: 18 },
                { name: '解调带宽', paramName: 'debw', ratio: 11 }
              ]
            ]"
            :master="master" />
        </template>
      </ZXISpectrumAndFall>
      <ZXIItu class="item" :inputData="ITU" />
      <ZXIModulate class="item" :inputData="modulate" />
      <ZXIScrollInfo :clear="clear" :inputData="decodingState" />
      <ZXISubaudioDecoding class="item" :inputData="subaudioDecoding" />
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

.params-branch0{
  padding: 0 0 0 @btnSpace;
}
.params-branch1{
  padding: 0 0 @btnSpace 11.5rem;
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
  .item{
    padding: @btnSpace;
    box-sizing: border-box;
  }
}

</style>