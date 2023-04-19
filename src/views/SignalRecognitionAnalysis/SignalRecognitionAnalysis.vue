<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-07 11:06:54
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-19 11:28:29
 * @FilePath: \zxi-surface\src\views\SignalRecognitionAnalysis\SignalRecognitionAnalysis.vue
 * @Description: 
 -->
<script setup lang='ts'>
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Modulate from './components/Modulate.vue'
import * as Helper from 'helper/index'
import { IMockPanleState, setLinkTrigger, CustomTheme, fftToResolutionRatio, BaseParamsType, localStorageKey } from '@/types'
import { ElMessage } from 'element-plus'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import { ISpectrumInputData, ESwitchState, IITUData, IModulateData, IHighlightItem, ZXISpectrumScanAndFallType, ZXILevel, UseTheme, ILevelData, IIQData, ZXIIQVector } from 'mcharts/index'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import { Sundry, ToExport } from 'helper/index'
import { useRoute } from 'vue-router'

const store = useFrameStore()

const setTool = [{
  name:'pubutu',
  value:false
}]

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
const levelInput = ref(new Map<string, ILevelData>())
const levleInstance = ref<InstanceType<typeof ZXILevel>>()

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

// IQ
const iqData = ref<IIQData>({
  iData: new Float32Array(),
  qData: new Float32Array()
})
const spIQVector = ref<InstanceType<typeof ZXIIQVector>>()

const markers = ref<Array<number>>([])

const { trigger, selectFrequency } = setLinkTrigger()

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 全景频谱
optionsChild.set(ReceiveData.key.DATA.SPECTRUMDATA, {
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
// 电平
optionsChild.set('CHLEVEL', {
  control: (data) => {
    const map = new Map<string, ILevelData>()
    map.set('1', { data: data.level, time: new Date() })
    levelInput.value = map
  }
})
// ITU
optionsChild.set(ReceiveData.key.DATA.ITU, {
  control: (data) => {
    ITU.value = data.data
  }
})
// IQ数据
optionsChild.set(ReceiveData.key.DATA.IQDATA, {
  control: (data) => {
    iqData.value = { iData: new Float32Array(data.iData), qData: new Float32Array(data.qData) }
  }
})

// 模式识别
optionsChild.set(ReceiveData.key.DATA.MODE, {
  control: (data) => {
    modulate.value = data.data
  }
})

// 数字语音解调/解码状态
optionsChild.set(ReceiveData.key.DATA.LOGTEXTSTATE, {
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
const spInstance1 = ref<ZXISpectrumScanAndFallType>()

ToExport.beforExport.set('0', () => {
  ToExport.DATA.clear()
  ToExport.DOM.clear()
  if (levelInput.value.size > 0) ToExport.addDom('电平图', levleInstance.value!.root!, 3)
  // 参数
  const r = Sundry.formatParams(route.meta.functionKey!)
  ToExport.addTable(r.title, r.headers, r.formatData, 0)
  // 全景频谱
  if (spectrumFull.value[0].data.length > 0) ToExport.addDom('全景频谱', spInstance0.value!.root!, 1)
  // 解调频谱
  if (spectrumDemodulation.value[0].data.length > 0) ToExport.addDom('解调频谱', spInstance1.value!.root!, 2)
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
  // IQ
  if (iqData.value.iData.length > 0) ToExport.addDom('IQ矢量图', spIQVector.value!.root!, 7)
})

const tabId = ref(0)
const firstTabId = ref(0)

const master = ref<BaseParamsType>()
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
      <BaseParams ref="master" :beforeSendParamChange="beforeSendParamChange" :beforeTaskStart="beforeTaskStart"
        :inited="inited" :dynamicParam="false" />
    </template>
    <template #header-center>
      <div class="header-slot">
        <BaseTabHeader :headers="['全景频谱', '信号分析', '信道测量', '调制识别', '数字语音解调/解码状态']" v-model="tabId" />
      </div>
    </template>
    <ZXITabs class="FFM-tabs" :wrapperStyle="{ border: 'none' }" :hidHeader="true" v-model="tabId">

      <div class="first-page">
        <div class="first-colum">
          <ZXISpectrumAndFall 
            :setTool="setTool" 
            class="spectrum-and-fall" 
            name="" 
            ref="spInstance0" 
            :inputData="spectrumFull"
            :params="paramsFull" 
            :switchLever="startAndStop" 
            :hightlightItems="hightlightItems" 
            :markers="markers"
            @selectFrequency="selectFrequency"
            useSelectFrequency
            >
            <template #header>
              <BaseParamsBranch class="params-branch" :params="[
                [
                  { name: '全景中心频率', paramName: 'frequency', ratio: 6 },
                  { name: '全景频谱带宽', paramName: 'bandwidth', ratio: 6 }
                ]
              ]" :master="master" />
            </template>
          </ZXISpectrumAndFall>
        </div>
        <div class="second-colum">
          <BaseTabHeader class="tab-header" :headers="[
            [{ name: '解调频谱', ratio: 1 }],
            [{ name: '电平图', ratio: 1 }],
            [{ name: 'IQ矢量图', ratio: 1 }],
          ]" v-model="firstTabId" />
          <ZXITabs :wrapperStyle="{ border: 'none' }" :hidHeader="true" class="FFM-tabs-first" v-model="firstTabId">
            <ZXISpectrumAndFall class="spectrum-and-fall-single" name="" ref="spInstance1"
              :inputData="spectrumDemodulation" :params="singleParams" :switchLever="startAndStop"
              :setTool="[{ name: 'pubutu', value: false }]" @selectFrequency="(result) => { defFrequency(result.value) }">
              <template #header>
                <BaseParamsBranch class="params-branch" :params="[
                  [
                    { name: '测量/解调频率', paramName: 'def', ratio: 6 },
                    { name: '解调模式', paramName: 'demodulation', ratio: 6 },
                    { name: '测量/解调带宽', paramName: 'debw', ratio: 6 }
                  ]
                ]" :master="master" />
              </template>
            </ZXISpectrumAndFall>
            <ZXILevel class="level" name="" ref="levleInstance" :deleteTool="['threshold']" :inputData="levelInput"
              :switchLever="startAndStop" />
            <div class="IQ-container">
              <ZXIIQVector 
                ref="spIQVector" 
                class="iq-vector-image" 
                :name="'IQ矢量图'" 
                :pointRadius="7"
                :inputData="iqData"
                :switchLever="startAndStop"
                 />
              
            </div>
          </ZXITabs>

        </div>
      </div>
      <Modulate tabName="信号分析" class="tabItem" :canDraw="tabId === 1" />
      <ZXIItu class="table" :inputData="ITU" />
      <ZXIModulate class="table" :inputData="modulate" />
      <ZXIScrollInfo class="Info" :clear="startAndStop === ESwitchState.open" :inputData="decodingState" />

    </ZXITabs>

  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');
.base-link{
  display: flex;
  justify-content:space-around;
}
.header-slot {
  width: 100%;
  height: 100%;
  display: flex;
  padding: @btnSpace;
  box-sizing: border-box;
}

.FFM-tabs {
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;

  :deep(.FFM-tabs>div) {
    background-color: v-bind('UseTheme.theme.var.backgroundColor');
  }

  .first-page {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: @btnSpace;

    .first-colum {
      background-color: v-bind('UseTheme.theme.var.backgroundColor');
      display: flex;
      flex-direction: row;
      box-sizing: border-box;
      width: 100%;
      height: 60%;

      .spectrum-and-fall {
        flex: auto;
        box-sizing: border-box;

        .params-branch {
          padding-left: 4.5rem;
        }
      }

    }

    .second-colum {
      display: flex;
      flex: auto;
      flex-direction: row;
      padding-top: @btnSpace;
      border-top: v-bind('CustomTheme.theme.districtBorder');
      box-sizing: border-box;
      background-color: v-bind('UseTheme.theme.var.backgroundColor');

      .tab-header {
        width: 100px;
      }

      .FFM-tabs-first {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        flex: auto;
        padding-left: @btnSpace;

        .IQ-container {
          width: 100%;
          height: 100%;
          background-color: v-bind('UseTheme.theme.var.backgroundColor');
          display: flex;
          justify-content: center;

          .iq-vector-image {
              height: 100%;
              aspect-ratio:1/1;
            }

        }

      }

      .params-branch {
        padding-left: 4.5rem;
      }

      // .spectrum-and-fall-single {
      //   flex: auto;
      //   padding-right: 2px;
      // }

    }
  }

  .table {
    padding: @btnSpace;
    box-sizing: border-box;
  }

  .Info {
    background-color: v-bind('UseTheme.theme.var.backgroundColor');
  }


}
</style>