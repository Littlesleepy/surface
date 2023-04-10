<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-06 11:07:01
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-10 17:15:32
 * @FilePath: \zxi-surface\src\views\SpectrumAnalysis\SpectrumAnalysis.vue
 * @Description: 
 -->


<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { useFrameStore } from 'store/index'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import * as Helper from 'helper/index'
import { ISpectrumScanInputData } from 'mcharts/index'
import { ElMessage, ElNotification } from 'element-plus'
import { IParam, localStorageKey } from '@/storage'
import { IMockPanleState } from '@/types'
import { useRoute } from 'vue-router'
import { fftToResolutionRatio } from '@/types'
import { UseTheme } from 'mcharts/index'
import { useSingleMeasure } from '../SingleMeasure'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import BaseParams from 'cp/BaseParams/BaseParams.vue';
import { BaseParamsType, EParamsType, IParamElement } from '@/types';

const route = useRoute()

const store = useFrameStore()

const spectrum = ref<Array<ISpectrumScanInputData>>([{
  data: new Float32Array(),
  frequency: 0,
  sc: 0,
  time: 0
}])

const params = computed(() => {
  const form = store.s_form
  let step = Helper.Device.getSamplingRateByBandwidth(Number(form.bandwidth))
  step = step / Number(form.fftpoints) / 1000

  return {
    begin: Number(form.begin),
    end: Number(form.end),
    step
  }
})

const startAndStop = computed(() => store.s_playButton)

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 频谱数据
optionsChild.set('SPECTRUMDATA', {
  control: (data) => { spectrum.value = [makeSpectrumData(data)] }
})
// 溢出
const useFunctionArr: Array<IParam> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!).XScan

let rfattenuationValueList = ['']
useFunctionArr.forEach(p => {
  if (p.paramName === 'rfattenuation' && p.valueList) {
    rfattenuationValueList = p.valueList
  }
})

// 参数修改
function inited(panle: IMockPanleState) {
  if (!route.query.name) {
    const { device } = panle

    fftToResolutionRatio('fftpoints', 'bandwidth', device.elements, device.form, '分辨率')
  }
}

let canChange = true
optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
  control: (data: { data: boolean }) => {
    if (data.data) {
      ElMessage({ message: '溢出', type: 'warning', grouping: true })

      if (canChange) {
        let value = Number(store.s_form.rfattenuation)
        for (let i = 0; i < rfattenuationValueList.length; i++) {
          const item = Number(rfattenuationValueList[i])
          if (item > value) {
            value = item
            store.m_formOne({ key: 'rfattenuation', value })
            ElNotification.success(`溢出后自动调节射频衰减到${value}dB`)
            break
          }
        }
        canChange = false
      }
    }
  }
})

options.set('DATA', { children: optionsChild })
ReceiveData.add(options)

watch(() => store.s_formOneResult, (v) => {
  if (v.key === 'rfattenuation') {
    canChange = true
  }
})

const master = ref<BaseParamsType>()

const { trigger, changeFrequency, markers, selectFrequency } = useSingleMeasure()

const setTool = [
  {
    name: 'baoluotu',
    value: true
  },
  {
    name: 'zhuzhuangtu',
    value: false
  },
  {
    name: 'pubutu',
    value: false
  }
]

const deleteTool = ['pubutu']

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
      <BaseParams ref="master" :inited="inited" :disableBtnAfterTaskStart="{ all: false }" />
    </template>
    <!-- 头部切换视图 -->
    <template #header-center>
      <div class="header-slot">
        <BaseParamsBranch class="params-branch" :params="[
          [
            { name: '每跳频谱带宽(kHz)', paramName: 'bandwidth', ratio: 12 },
            { name: '射频拼接带宽', paramName: 'rfbandwidth', ratio: 12 },
            { name: '中频ADC增益开关', paramName: 'adcamplify', ratio: 6 },
          ]
        ]" :master="master" />
      </div>
    </template>
    <div class="content-right">
      <ZXISpectrumScanAndFall class="spectrum-scan-and-fall" :inputData="spectrum" :params="params"
        :switchLever="startAndStop" @selectFrequency="selectFrequency" :setTool="setTool" :deleteTool="deleteTool">
        <template #header>
          <BaseParamsBranch class="params-branch1" :params="[
            [
              { name: '开始频率', paramName: 'begin', ratio: 11 },
              { name: '分辨率', paramName: 'bandwidth', ratio: 11 },
              { name: '结束频率', paramName: 'end', ratio: 11 },
            ]
          ]" :master="master" />
        </template>
      </ZXISpectrumScanAndFall>
    </div>
  </BaseMonitorFrame>
</template>
 
<style scoped lang="less">
@import url('theme');

.header-slot {
  width: 100%;
  height: 100%;
  display: flex;
  padding: .5rem;
  box-sizing: border-box;

  .params-branch {
    width: 100%;
  }
}

.base-link {
  display: flex;
  justify-content: space-around;
}

.content-right {
  width: 100%;
  height: 100%;
  display: flex;

  .spectrum-scan-and-fall {
    flex: auto;
    padding: @btnSpace @btnSpace 0 @btnSpace;
    box-sizing: border-box;
    background: v-bind('UseTheme.theme.var.backgroundColor');
  }
}

.params-branch0 {
  padding: @btnSpace;
  height: 100%;
  display: flex;

  div {
    height: 100%;
  }
}

.params-branch1 {
  padding: @btnSpace;
  height: 100%;
  display: flex;
}
</style>