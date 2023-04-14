<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-10 17:20:59
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-14 15:39:55
 * @FilePath: \zxi-surface\src\views\DPX\DPX.vue
 * @Description: 
 -->
<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import { useFrameStore } from 'store/index'
import * as Helper from 'helper/index'
import { ReceiveData, ReceiveDataOptions } from '@/server'
import { IDPXParams, ZXIDpx, UseTheme } from 'mcharts/index'
import { ElMessage } from 'element-plus'
import { BaseParamsType, fftToResolutionRatio, IMockPanleState } from '@/types'
import { Device, Sundry, ToExport } from 'helper/index'
import { useRoute } from 'vue-router'

/**
 * @description: DPX头部信息
 */
interface IServerDPXRateInfo {
  bandwidth: string
  dataPoint: number
  frameRate: string
  rate: string
  rbw: string
  samplingInterval: string
}

const store = useFrameStore()

const spectrum = ref({
  data: new Uint8Array(),
  indexs: new Float32Array()
})

const form = computed(() => store.s_form)

const params = computed<IDPXParams>(() => {
  return {
    begin: Number(form.value.frequency) - form.value.bandwidth / 2000,
    end: Number(form.value.frequency) + form.value.bandwidth / 2000,
    bandwidth: Number(form.value.bandwidth) / 1000,
    fftpoints: Number(form.value.fftpoints)
  }
})

const dpxInfo = ref<IServerDPXRateInfo>({
  bandwidth: '',
  dataPoint: 0,
  frameRate: '',
  rate: '',
  rbw: '',
  samplingInterval: ''
})

const headerInfo = computed(() => {
  const realWidth = Device.getSamplingRateByBandwidth(params.value.bandwidth * 1000) / 1000
  const step = realWidth / params.value.fftpoints
  const stepStr = Helper.Device.unitFormatChangeForStep(step)

  const counts = params.value.bandwidth * 1000000 / (step * 1000000) + 1

  var string = `中心频率:${form.value.frequency}MHz  频谱带宽: ${params.value.bandwidth * 1000}kHz  采样带宽:${dpxInfo.value.bandwidth}  分辨率:${stepStr}  频谱点数:${counts}`
  string += `  采样比率:${dpxInfo.value.rate}  速率:${dpxInfo.value.frameRate}  采样间隔:${dpxInfo.value.samplingInterval}`
  return string
})

// 参数修改
function inited(panle: IMockPanleState) {
  const { device } = panle

  fftToResolutionRatio('fftpoints', 'bandwidth', device.elements, device.form, '分辨率')
}

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
optionsChild.set('SPECTRUMDATA', {
  control: (data) => {
    spectrum.value = {
      data: data.data,
      indexs: new Float32Array(data.indexs)
    }
  }
})
// 头部信息
optionsChild.set('RATEINFO', {
  control: (data) => {
    dpxInfo.value = data
  }
})
// 溢出
optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
  control: (data: { data: boolean }) => {
    if (data.data) {
      ElMessage({ message: '溢出', type: 'warning', grouping: true })
    }
  }
})

options.set('DATA', { children: optionsChild })

ReceiveData.add(options)

// 导出结果
const route = useRoute()
const spInstance = ref<InstanceType<typeof ZXIDpx>>()

ToExport.beforExport.set('0', () => {
  ToExport.DATA.clear()
  ToExport.DOM.clear()
  // 参数
  const r = Sundry.formatParams(route.meta.functionKey!)
  ToExport.addTable(r.title, r.headers, r.formatData, 0)
  // 图像
  if (spectrum.value.data.length > 0) ToExport.addDom('荧光谱', spInstance.value!.root!, 1)
})
const master = ref<BaseParamsType>()
</script>

<template>
  <BaseMonitorFrame>
    <template #set>
      <BaseParams ref="master" :inited="inited" :dynamicParam="false" />
    </template>
    <template #header-center>
      <div class="header-slot">
        <BaseParamsBranch class="params-branch" :params="[
          [
            { name: '频率', paramName: 'frequency', ratio: 12 },
            { name: '频谱带宽', paramName: 'bandwidth', ratio: 12 },
            { name: '分辨率', paramName: 'fftpoints', ratio: 12 }
          ]
        ]" :master="master" />
      </div>
    </template>
    <div class="content-DPX">
      <div class="content-DPX-two">
        <ZXIDpx class="img" ref="spInstance" :params="params" :inputData="spectrum" :switchLever="store.s_playButton">
          <!-- <p class="info">{{ headerInfo }}</p> -->
        </ZXIDpx>
        <!-- <BaseParamsBranch class="params-branch" :params="[
          [
            { name: '频率(MHz)', paramName: 'frequency', ratio: 12 },
            { name: '频谱带宽(kHz)', paramName: 'bandwidth', ratio: 12 },
            { name: '分辨率', paramName: 'fftpoints', ratio: 12 }
          ]
        ]" :master="master" /> -->
      </div>
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


.content-DPX {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding:@btnSpace;

  /* 绘图区域 */
  .content-DPX-two {
    flex: auto;
    display: flex;
    flex-direction: column;

    p {
      height: 35px;
      box-sizing: border-box;
      color: v-bind('UseTheme.theme.var.color');
      font-size: 12px;
    }

    .img {
      flex: auto;
      height: 100%;
      box-sizing: border-box;

      .info {
        font-size: 2rem;
        display: flex;
        align-items: center;
      }
    }
    .params-branch{
      padding: @btnSpace @btnSpace @btnSpace 11.5rem;
    }
  }
}
</style>