<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-06 11:07:01
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-14 16:05:43
 * @FilePath: \zxi-surface\src\views\XScan\XScan.vue
 * @Description: 
 -->


<script setup lang='ts'>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useFrameStore } from 'store/index'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import * as Helper from 'helper/index'
import { ISpectrumScanInputData } from 'mcharts/index'
import { ElMessage, ElNotification } from 'element-plus'
import { IParam, localStorageKey } from '@/storage'
import { IMockPanleState } from '@/types'
import { useRoute } from 'vue-router'
import { fftToResolutionRatio, frequncyTrance } from './index'
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
  step = step / Number(form.fftpoints) / 1000 * form.efactor
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
let _panle: IMockPanleState
function inited(panle: IMockPanleState) {
  _panle = panle
  const { device } = panle
  if (!route.query.name) {
    fftToResolutionRatio('fftpoints', 'bandwidth', device.elements, device.form, '分辨率')
  }
}

watchEffect(() => {
  const form = store.s_form
  const bandwidth = Helper.Device.getSamplingRateByBandwidth(form.bandwidth)
  const step = bandwidth / Number(form.fftpoints)
  if (_panle) {
    const { device } = _panle
    device.elements.value.forEach(el => {
      if (el.paramName === 'efactor') {
        el.title = '显示分辨率'
        el.tooltip = '显示分辨率'
        el.valueList.forEach(li => {
          li.label = frequncyTrance(li.value * step)
        })
      }
    })
  }
})

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
      <BaseParams ref="master" :inited="inited" :dynamicParam="false" />
    </template>
    <template #header-center>
    </template>
    <div class="content-XScan">
      <ZXISpectrumScanAndFall class="spectrum-scan-and-fall" :inputData="spectrum" :params="params"
        :switchLever="startAndStop" useSelectFrequency @selectFrequency="selectFrequency">
        <template  #header>
          <BaseParamsBranch class="params-branch0" :params="[
            [
              { name: '每跳频谱带宽', paramName: 'bandwidth', ratio: 12 },
              { name: '射频拼接带宽', paramName: 'rfbandwidth', ratio: 12 },
              { name: '每跳测量时间(ms)', paramName: 'smtime', ratio: 12 },
              { name: '返回数据间隔时间(ms)', paramName: 'holdtime', ratio: 12 },
            ]
          ]" :master="master" />
        </template>
        <template  #middle>
          <BaseParamsBranch class="params-branch1" :params="[
            [
              { name: '开始频率', paramName: 'begin', ratio: 12 },
              { name: '分辨率', paramName: 'fftpoints', ratio: 12 },
              { name: '显示分辨率', paramName: 'efactor', ratio: 12 },
              { name: '结束频率', paramName: 'end', ratio: 12 },
            ]
          ]" :master="master" />
        </template>
      </ZXISpectrumScanAndFall>

    </div>

  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');
.base-link {
  display: flex;
  justify-content: space-around;
}

.content-XScan {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  padding: @btnSpace;

  .spectrum-scan-and-fall {
    flex: auto;
    // padding: @btnSpace @btnSpace 0 @btnSpace;
    box-sizing: border-box;
    background: v-bind('UseTheme.theme.var.backgroundColor');
  }
}

.params-branch0 {
  // padding: @btnSpace;
  // height: 100%;
  // display: flex;

  // div {
  //   height: 100%;
  // }
  // padding: @btnSpace;
  height: 100%;
  display: flex;
  padding-left: @btnSpace;
}

.params-branch1 {
  height: 100%;
  display: flex;
  padding: 0 0 @btnSpace 11.5rem;
}
</style>