<script setup lang='ts'>
import { useFrameStore } from '@/store'
import { computed, ref, watch } from 'vue'
import Modulate from './components/Modulate.vue'
import * as Helper from 'helper/index'
import { IMockPanleState, setLinkTrigger, CustomTheme, fftToResolutionRatio } from '@/types'
import { ElMessage } from 'element-plus'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import { ISpectrumInputData, ESwitchState, IITUData, IModulateData, IHighlightItem, ILevelData, ZXISpectrumScanAndFallType, ZXILevel, UseTheme } from 'mcharts/index'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import { Sundry, ToExport } from 'helper/index'
import { useRoute } from 'vue-router'

const whichTab = ref(0)

const store = useFrameStore()

const levelInput = ref(new Map<string, ILevelData>())

const spectrumFull = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])

const paramsFull = computed(() => {
  const form = store.s_form
  let step = Helper.Device.getSamplingRateByBandwidth(Number(form.bandwidth)) / 1000
  step = step / Number(form.panfftpoints)

  return {
    begin: Number(form.frequency) - form.bandwidth / 2000,
    end: Number(form.frequency) + form.bandwidth / 2000,
    step,
    bandwidth: Number(form.bandwidth) / 1000
  }
})

const spectrumDemodulation = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])

const ITU = ref<Array<IITUData>>([])
const modulate = ref<Array<IModulateData>>([])
const decodingState = ref<Array<string>>([])

const hightlightItems = computed<Array<IHighlightItem>>(() => {
  if (store.s_form) {
    return [{
      bandwidth: Number(store.s_form.debw) / 1000,
      centerFrequency: Number(store.s_form.def)
    }]
  }
  return []
})

const startAndStop = computed(() => store.s_playButton)

const singleStep = computed(() => {
  const valueHz = Helper.Device.getSamplingRateByBandwidth(Number(store.s_form.debw)) / 1000
  return valueHz / Number(store.s_form.chfftpoints)
})

const singleParams = computed(() => {
  const form = store.s_form
  let step = Helper.Device.getSamplingRateByBandwidth(Number(form.debw)) / 1000
  step = step / Number(form.chfftpoints)

  return {
    begin: Number(form.def) - form.debw / 2000,
    end: Number(form.def) + form.debw / 2000,
    step,
    bandwidth: Number(form.debw) / 1000
  }
})

function defFrequency(v: number) {
  store.m_formOne({ key: 'def', value: v })
}

// 解调频率处于全景内检查方法
function checkDef(panle: IMockPanleState) {
  const form = panle.device.form.value

  const db = Number(form.bandwidth / 2000)
  const min = Number(form.frequency) - db
  const max = Number(form.frequency) + db
  if (Number(form.def) < min || Number(form.def) > max) {
    ElMessage.warning('解调频率必须处于全景测量范围内，已自动调整解调频率')
    form.def = form.frequency
    return false
  }
  return true
}

// 参数修改
function inited(panle: IMockPanleState) {
  const { device } = panle
  panle.device.elements.value.forEach(el => {
    // 构造完参数隐藏解调IQ、全景IQ按钮
    if (el.paramName === 'chiqdata' || el.paramName === 'paniqdata') {
      el.show = false
    }
  })

  fftToResolutionRatio('panfftpoints', 'bandwidth', device.elements, device.form, '全景频谱分辨率')
  fftToResolutionRatio('chfftpoints', 'debw', device.elements, device.form, '解调频谱分辨率')
}


// 启动任务前检查
function beforeTaskStart(params: { value: string }, panle: IMockPanleState) {
  return checkDef(panle)
}

// 修改全景中心频率、全景带宽、解调带宽，检查解调频率是否处于全景内
function beforeSendParamChange(panle: IMockPanleState) {
  let result = true
  if (panle.changeParam) {
    const key = panle.changeParam.key
    if (key === 'frequency' || key === 'bandwidth' || key === 'def') {
      result = checkDef(panle)
    }
  }
  return result
}

const markers = ref<Array<number>>([])

const { trigger, selectFrequency } = setLinkTrigger()

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 全景频谱
optionsChild.set('SPECTRUMDATA', {
  control: (data) => {
    spectrumFull.value = [makeSpectrumData(data)]
  }
})
// 解调频谱数据
optionsChild.set('CHSPECTRUM', {
  control: (data) => {
    spectrumDemodulation.value = [makeSpectrumData(data)]
  }
})
// 电平数据
optionsChild.set('CHLEVEL', {
  control: (data) => {
    const map = new Map<string, ILevelData>()
    map.set('1', { data: data.level, time: new Date() })
    levelInput.value = map
  }
})
// ITU
optionsChild.set('ITU', {
  control: (data) => {
    ITU.value = data.data
  }
})
// 模式识别
optionsChild.set('MODE', {
  control: (data) => {
    modulate.value = data.data
  }
})
// 数字语音解调/解码状态
optionsChild.set('LOGTEXTSTATE', {
  control: (data) => {
    decodingState.value = data.data
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

watch(() => store.s_playButton, (btn) => {
  if (btn === ESwitchState.open) {
    ITU.value = []
    modulate.value = []
    decodingState.value = []
  }
})

// 导出结果
const route = useRoute()
const spInstance0 = ref<ZXISpectrumScanAndFallType>()
const levleInstance = ref<InstanceType<typeof ZXILevel>>()
const spInstance1 = ref<ZXISpectrumScanAndFallType>()

ToExport.beforExport.set('0', () => {
  ToExport.DATA.clear()
  ToExport.DOM.clear()

  // 参数
  const r = Sundry.formatParams(route.meta.functionKey!)
  ToExport.addTable(r.title, r.headers, r.formatData, 0)
  // 全景频谱
  if (spectrumFull.value[0].data.length > 0) ToExport.addDom('全景频谱', spInstance0.value!.root!, 1)
  // 解调频谱
  if (spectrumDemodulation.value[0].data.length > 0) ToExport.addDom('解调频谱', spInstance1.value!.root!, 2)
  // 电平
  if (levelInput.value.size > 0) ToExport.addDom('电平图', levleInstance.value!.root!, 3)
  // ITU
  if (ITU.value.length > 0) {
    const result = Sundry.formatITU(ITU.value)
    ToExport.addTable(result.title, result.headers, result.formatData, 4)
  }
  // 模式识别
  if (modulate.value.length > 0) {
    const result = Sundry.formatModulate(modulate.value)
    ToExport.addTable(result.title, result.headers, result.formatData, 5)
  }
  // 数字语音解调/解码状态
  if (decodingState.value.length > 0) {
    const r = Sundry.formatDecodingState(decodingState.value)
    ToExport.addText(r.title, r.str, 6)
  }
})

const tabId = ref(0)

</script>

<template>
  <BaseMonitorFrame>
    <BaseLink :trigger="trigger">
      <div class="base-link">
        <el-button type="primary" round @click="defFrequency(trigger.value as number)">解调</el-button>
        <el-button type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
      </div>
      <hr>
    </BaseLink>
    <template #set>
      <BaseParams ref="master" :inited="inited" :disableBtnAfterTaskStart="{ all: false }" />
    </template>
    <template #header-center>
      <div class="header-slot">
        <BaseTabHeader :headers="['主页','信号分析', '信道测量','调制识别','数字语音解调/解码状态']" v-model="tabId" />
      </div>
    </template>
    <ZXITabs class="FFM-tabs" :wrapperStyle="{ border: 'none' }" :hidHeader="true" v-model="tabId">

      <div class="first-page">
        <div class="first-colum">
          <ZXISpectrumAndFall class="spectrum-and-fall" name="全景频谱" ref="spInstance0" :inputData="spectrumFull"
            :params="paramsFull" :switchLever="startAndStop" :hightlightItems="hightlightItems" :markers="markers"
            @selectFrequency="selectFrequency" />
        </div>
        <div class="second-colum">
          <ZXISpectrumAndFall class="spectrum-and-fall-single" name="解调频谱" ref="spInstance1"
            :inputData="spectrumDemodulation" :params="singleParams" :switchLever="startAndStop"
            :setTool="[{ name: 'pubutu', value: false }]" @selectFrequency="(result) => { defFrequency(result.value) }" />
          <ZXILevel class="level" name="电平图" ref="levleInstance" :inputData="levelInput" :switchLever="startAndStop"
            :deleteTool="['threshold']" />
        </div>
      </div>
      <Modulate tabName="信号分析" class="tabItem" :canDraw="tabId === 1" />
      <ZXIItu :inputData="ITU" />
      <ZXIModulate :inputData="modulate" />
      <ZXIScrollInfo :clear="startAndStop === ESwitchState.open" :inputData="decodingState" />
    </ZXITabs>

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
}

.FFM-tabs {
  width: 100%;
  height: 100%;
  display: flex;
  
  .first-page {
    display: flex;
    flex-direction: column;

    .first-colum {
      background-color: v-bind('UseTheme.theme.var.backgroundColor');
      display: flex;
      flex-direction: row;
      box-sizing: border-box;
      width: 100%;
      height: 65%;
      padding-right: @btnSpace;

      .spectrum-and-fall {
        flex: auto;
        box-sizing: border-box;
      }

    }

    .second-colum {
      display: flex;
      flex: auto;
      flex-direction: row;

      padding-right: @btnSpace;
      border-top: v-bind('CustomTheme.theme.districtBorder');
      box-sizing: border-box;
      background-color: v-bind('UseTheme.theme.var.backgroundColor');

      .level {
        flex: auto;
        border-left: v-bind('CustomTheme.theme.districtBorder');

      }

      .spectrum-and-fall-single {
        // flex: auto;
        width: 50%;
        padding-right: 2px;
      }

    }
  }


}
</style>