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
// import BaseLink from '@/components/BaseLink/BaseLink.vue'
import { useSingleMeasure } from '.'
import { isRef, onMounted, ref } from 'vue';
import BaseParams from 'cp/BaseParams/BaseParams.vue';
import { EParamsType, IParamElement } from '@/types';
// import { UseTheme } from 'zcharts'


const {
  spectrumInstance0,
  store,
  params,
  hightlightItems,
  route,
  spectrum,
  changeFrequency,
  // selectFrequency,
  // trigger,
  markers
} = useSingleMeasure()

const master = ref<InstanceType<typeof BaseParams>>()

</script>

<template>
  <BaseFrame>
    <template #set>
      <BaseParams ref="master" :disableBtnAfterTaskStart="{ all: false }" />
    </template>
    <div class="single-measure">
      <BaseParamsBranch
        class="params-branch"
        :params="[
          [
            { name: 'cf', paramName: 'frequency', ratio: 4 },
            { name: 'bd1', paramName: 'bandwidth', ratio: 6 },
            { name: 'debw', paramName: 'debw', ratio: 6 },
            { name: 'audio', paramName: 'tcpaudio', ratio: 2.5 }
          ]
        ]"
        :master="master" />
      <ZXISpectrumAndFall
        ref="spectrumInstance0"
        class="spectrum-and-fall"
        tabName="信道频谱"
        :inputData="spectrum"
        :params="params"
        :switchLever="store.s_playButton"
        :hightlightItems="hightlightItems"
        :markers="markers">
        <!-- <template #header>
          <BaseParamsBranch :master="master" />
        </template> -->
        <!-- <template #middle>
          <BaseParamsBranch :master="master" />
        </template> -->
      </ZXISpectrumAndFall>
    </div>
  </BaseFrame>
</template>

<style scoped lang="less">
.single-measure{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .params-branch{
    margin: 5px;
  }
  .spectrum-and-fall{
    width: 100%;
    flex: auto;
    padding-top: 5px;
    box-sizing: border-box;
  }
}
</style>