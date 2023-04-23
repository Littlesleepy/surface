<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 13:39:55
 * @FilePath: \zxi-device\src\views\CIQStream\CIQStream.vue
 * @Description:
 -->

<script setup lang="ts">
import { ReceiveData, ReceiveDataOptions, Axios } from '@/server'
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ESwitchState, ILineData, ISpectrumAndFallFallPool, Keyboard, Scene, UseTheme } from 'mcharts/index'
import { BaseParamsType, CustomTheme, EParamsType, IMockPanleState, IParamsVice } from '@/types'
import TimeDomain from './components/TimeDomain.vue'
import TimeFrequency from './components/TimeFrequency.vue'
import LoRa from './components/LoRa.vue'
import Frequency from './components/Frequency.vue'
import Bluetooth from './components/Bluetooth.vue'
import { Device, Sundry  } from '@/helper'
import { ToExport } from "helper/dataExports/index";
import { IIQAnalysis } from '.'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'

const frameStore = useFrameStore()

const route = useRoute()

const refresh = ref(false)

const defaultValueX = computed(() => {
  const form = frameStore.s_form
  let max = 0
  if (form.lmtime) {
    max = Number(form.lmtime)
  }

  return {
    min: 0,
    max
  }
})

// 时间分辨率
const resolutionRatio = computed(() => {
  const form = frameStore.s_form
  let result = 0
  if (form.efactor) {
    const realWidth = Device.getSamplingRateByBandwidth(Number(frameStore.s_form.bandwidth))
    // 时间分辨率
    result = (Number(form.efactor) / realWidth) // ms
  }

  return result
})

const frequencyData = ref<IIQAnalysis>()

const currentTabId = ref(0)

const aboutTime = computed(() => {
  const form = frameStore.s_form
  let result = ''
  if (form.efactor) {
    // 数据点数
    const points = Number(form.lmtime) / resolutionRatio.value + 1

    return `${result}  时域分辨率：${timeTransition(resolutionRatio.value)} 数据总点数：${points}`
  }

  return result
})

const inputTimeDomain = ref<Map<string, ILineData>>(new Map())

/**
 * @description: 毫秒时间格式转换
 * @param {number} time
 * @return {*}
 */
function timeTransition (time: number) {
  let result = ''
  if (time >= 1) {
    result = `${time}  ms`
  } else if (time < 1 && time >= 0.001) {
    result = `${1000 * time}  us` // us
  } else { // ns
    result = `${1000000 * time}  ns`
  }

  return result
}

function caculateEfactorLabel() {
  if (mockPanle) {
    const { device } = mockPanle
    const realWidth = Device.getSamplingRateByBandwidth(Number(device.form.value.bandwidth))
    if (realWidth === null) return
    const elements = device.elements.value
    for (let i = 0, len = elements.length; i < len; i++) {
      if (elements[i].paramName === 'efactor') {
        elements[i].title = '时域分辨率'
        elements[i].tooltip = '时域分辨率'
        elements[i].valueList.forEach((x: any) => {
          const resolutionRatio = (Number(x.value) / realWidth) // ms
          x.label = timeTransition(resolutionRatio)
        })
        break
      }
    }
  }
}

let mockPanle: IMockPanleState | undefined
/**
 * @description: 附加参数
 */
const vice = ref<IParamsVice>({
  elements: [{
    id: 0,
    type: EParamsType.enum,
    paramName: 'fft',
    tooltip: '频域特征FFT点数',
    title: '频域特征FFT点数',
    disabled: false,
    valueList: [{ label: '128', value: 128 }]
  }, {
    id: 2,
    type: EParamsType.enum,
    paramName: 'model',
    tooltip: '不同使用模式对应一套设备参数',
    title: '使用模式',
    disabled: false,
    valueList: [{
      label: '连续',
      value: '连续',
      tooltip: '接收机连续采样，按一定的时间分辨率回传缩略的幅度图，用以盲采查看时域轮廓、周期测量、设置触发门限等'
    },
    {
      label: '单次',
      value: '单次',
      tooltip: '接收机按测量时长进行单次连续采样，无丢失的回传，用以测量固定时长的详细无丢失的时域数据'
    }, {
      label: '上升沿',
      value: '上升沿',
      tooltip: '接收机以 上升沿 幅度触发的形式进行触发采样，当门限触发后，无丢失回传，用以测量详细无丢失的上升沿触发的时域数据'
    }, {
      label: '下降沿',
      value: '下降沿',
      tooltip: '接收机以 下降沿 幅度触发的形式进行触发采样，当门限触发后，无丢失回传，用以测量详细无丢失的下降沿触发的时域数据'
    }, {
      label: '完整上下沿',
      value: '完整上下沿',
      tooltip: '接收机以 完整上下沿 幅度触发的形式进行触发采样，当门限触发后，无丢失回传，用以测量详细无丢失的完整时间沿触发的时域数据'
    }]
    }],
  form: {
    model: '连续',
    fft: 128
  }
})
/**
 * @description: 参数面板初始化完成后
 */
function mockPanleInited (mock: IMockPanleState) {
  mockPanle = mock

  caculateEfactorLabel()

  parameterMatching()
}

/**..................................timeDomain.................................. */
const timeDomainResult = ref<{ begin: number, end: number }>()

const disTime = ref(0)

/**
 * @description: 接收时域组件反出的时间索引范围，发给后端
 */
function getTimeDomain (result: { begin: number, end: number } | undefined) {
  // 结束索引达到最大值需要减一，最后一个补齐数据不要
  if (result) {
    const maxIndex = Number(frameStore.s_form.lmtime) / resolutionRatio.value
    if (result.end === maxIndex) result.end -= 1
  } else {
    return
  }

  timeDomainResult.value = result
  if (!frequencyFallScene || !mockPanle || !result) return

  if (frameStore.s_playButton === ESwitchState.open) {
    ElMessage.warning('任务进行中采集时域不可用')
    return
  }

  refresh.value = !refresh.value
  // 计算附加参数
  const points = result.end - result.begin + 1
  if (points <= 16) {
    ElMessage.warning('时域选取点数必须大于16')
    return
  }
  disTime.value = resolutionRatio.value * (points - 1)

  const valueList: Array<{ label: string, value: number }> = [{ label: '128', value: 128 }]
  let fft = 128
  const maxValue = points < 32768 ? points : 32768
  while((fft *= 2) < maxValue) {
    valueList.push({ label: fft.toString(), value: fft })
  }

  mockPanle.vice.elements.value[0].valueList = valueList
  // 检查表单中fft是否存在于当前可选项中
  let formFft = Number(frameStore.s_viceForm.fft)
  let hasFft = false
  valueList.forEach(el => {
    if (el.value === formFft) hasFft = true
  })
  if (!hasFft) { // 如果没有取中间
    const len = valueList.length
    let index = Math.floor(len / 2)
    formFft = valueList[index].value
    mockPanle.vice.form.value.fft = formFft
  }

  // 计算参数
  const params = {
    taskId: frameStore.s_taskId,
    startIndex: result.begin,
    stopIndex: result.end,
    fftPoints: formFft,
    totalFrame: frequencyFallScene.canvas.clientHeight,
    timeInterval: resolutionRatio.value
  }
  const marker = Sundry.createMarker({
    text: '获取分析结果中。。。'
  })

  Axios({
    url: 'api/Monitor/CIQStream/iqAnalysis',
    params
  }).then((msg) => {
    frequencyData.value = msg.data
  }).catch((err) => {
    ElMessage.error(err.data)
  }).finally(() => {
    marker.close()
  })

}
/**.............................................频域特征............................................. */
let frequencyFallScene: Scene<ISpectrumAndFallFallPool> | undefined

/**
 * @description: 获取频域特征瀑布图场景
 */
function getFallScene (scene: Scene<ISpectrumAndFallFallPool>) {
  frequencyFallScene = scene
}

const branchReset = ref(false)

/**
 * @description: 不同使用模式下参数匹配
 */
function parameterMatching () {
  if (mockPanle) {
    const { device, vice } = mockPanle
    // 隐藏采样时长
    hidenParam('timewindow', false)
    // 隐藏幅度触发类型
    hidenParam('triggerpos', false)
    // 隐藏采样模式
    hidenParam('samplingmode', false)
    const deviceForm = device.form.value
    switch (vice.form.value.model) {
    case '连续': {
      // 采样模式必须为连续
      deviceForm.samplingmode = '连续'
      deviceForm.lmtime = '500'
      deviceForm.timewindow = 0
      deviceForm.triggerpos = '固定时长'
      // 门限不可见
      hidenParam('threshold', false)
      // 放出抽取因子
      hidenParam('efactor', true)
    }
      break
    case '单次': {
      // 采样模式必须为触发
      deviceForm.samplingmode = '触发'
      deviceForm.lmtime = '100'
      deviceForm.timewindow = 0.1
      deviceForm.triggerpos = '固定时长'
      // 固定时长门限不可见
      hidenParam('threshold', false)
      //设置抽取因子为1
      deviceForm.efactor = '1'
      // 隐藏抽取因子
      hidenParam('efactor', false)
    }
      break
    case '上升沿': {
      deviceForm.samplingmode = '触发'
      deviceForm.lmtime = '100'
      deviceForm.timewindow = 0.1
      deviceForm.triggerpos = '上升沿'
      //设置抽取因子为1
      deviceForm.efactor = '1'
      // 门限可见
      hidenParam('threshold', true)
      // 隐藏抽取因子
      hidenParam('efactor', false)
    }
      break
    case '下降沿': {
      deviceForm.samplingmode = '触发'
      deviceForm.lmtime = '100'
      deviceForm.timewindow = 0.1
      deviceForm.triggerpos = '下降沿'
      //设置抽取因子为1
      deviceForm.efactor = '1'
      // 门限可见
      hidenParam('threshold', true)
      // 隐藏抽取因子
      hidenParam('efactor', false)
    }
      break
    default: {
      deviceForm.samplingmode = '触发'
      deviceForm.lmtime = '1000'
      deviceForm.timewindow = 1
      deviceForm.triggerpos = '全脉冲'
      //设置抽取因子为1
      deviceForm.efactor = '1'
      // 门限可见
      hidenParam('threshold', true)
      // 隐藏抽取因子
      hidenParam('efactor', false)
      // 隐藏抽取因子
      hidenParam('efactor', false)
    }
    }

    branchReset.value = !branchReset.value
  }
}
/**
 * @description: 隐藏参数
 */
function hidenParam (key: string, hiden: boolean) {
  if (mockPanle) {
    const { device } = mockPanle
    let item: any
    const elements = device.elements.value
    for (let i = 0, len = elements.length; i < len; i++) {
      item = elements[i]
      if (item.paramName === key) {
        item.show = hiden
        break
      }
    }
  }
}

watch(() => frameStore.s_playButton, (btn) => {
  if (btn === ESwitchState.open) {
    timeDomainResult.value = undefined
  }
})

watch(() => frameStore.s_form.bandwidth, () => {
  caculateEfactorLabel()
})

watch(() => frameStore.s_viceForm.model, () => {
  parameterMatching()
  // 动态切换
  if (master.value) master.value.imitateDynamicParam()
})
// 时域测量时间
watch(() => frameStore.s_form.lmtime, () => {
  if (frameStore.s_viceForm.model !== '连续' && mockPanle) {
    const { device } = mockPanle
    device.form.value.timewindow = device.form.value.lmtime / 1000
  }
})

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 时域数据
optionsChild.set('IQTIMEDOMAIN', {
  control: (data) => {
    // 补一个点
    data.data.push(data.data[data.data.length - 1])
    const result = new Float32Array(data.data)
    inputTimeDomain.value = new Map([
      ['1', {
        data: result,
        color: CustomTheme.theme.lineColorGreen
      }]
    ])
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

options.set(ReceiveData.key.AUTOSTOP, {
  control: () => {
    frameStore.m_playButton()
    ElMessage.success('完成采样')
  }
})

options.set('DATA', { children: optionsChild })
ReceiveData.add(options)

// 导出结果
const timeDomain = ref<HTMLDivElement>()

ToExport.beforExport.set('0', () => {
  // 测量参数
  const r = Sundry.formatParams(route.meta.functionKey!)
  ToExport.addTable(r.title, r.headers, r.formatData, 0)
  // 时域
  if (inputTimeDomain.value.size > 0) {
    ToExport.addDom('采集时域图', timeDomain.value!, 1)
  }
})

// 主题注册
const themeKey = CustomTheme.on(() => {
  for (const [, line] of inputTimeDomain.value) {
    line.color = CustomTheme.theme.lineColorGreen
    inputTimeDomain.value = new Map(inputTimeDomain.value)
  }
})

onBeforeUnmount(() => {
  CustomTheme.off(themeKey)
})

const master = ref<BaseParamsType>()
</script>

<template>
  <BaseMonitorFrame>
    <template #set>
      <BaseParams ref="master" :dynamicParam="false" :vice="vice" :inited="mockPanleInited" />
    </template>
    <!-- 头部切换视图 -->
    <template #header-center>
      <div class="header-slot">
        <BaseTabHeader
          :headers="['时频特征', '频域特征', 'LoRa', '蓝牙BLE']"
          v-model="currentTabId" />
        <ZXISelect
          v-if="master"
          class="use-model"
          v-model="master.viceForm.model"
          :name="'使用模式'"
          :disabled="vice.elements[1].disabled">
          <el-option
            v-for="select in vice.elements[1].valueList"
            :key="select.id"
            :label="select.label"
            :value="select.value" />
        </ZXISelect>
      </div>
      
    </template>
    <div class="CIQStream">
      <BaseParamsBranch
        class="params-branch"
        :params="[
          [
            { name: '频率', paramName: 'frequency', ratio: 10 },
            { name: '采样带宽', paramName: 'bandwidth', ratio: 10 },
            { name: '时域测量时间', paramName: 'lmtime', ratio: 10 },
            { name: '时域分辨率', paramName: 'efactor', ratio: 12 },
            { name: '幅度触发门限', paramName: 'threshold', ratio: 12 }
          ]
        ]"
        :master="master"
        :reset="branchReset" />
      <!-- 第一行 -->
      <div class="first-row" ref="timeDomain">
        <TimeDomain
          class="time-domain"
          :name="'时域'"
          :inputData="inputTimeDomain"
          :switchLever="frameStore.s_playButton"
          :defaultValueX="defaultValueX"
          @result="getTimeDomain" >
          <span class="about-time">{{ aboutTime }}</span>
        </TimeDomain>
      </div>
      <!-- 第二行 -->
      <ZXITabs
        class="second-row"
        :wrapperStyle="{ border: 'none' }"
        :hidHeader="true"
        v-model="currentTabId">
        <TimeFrequency
          :inputData="frequencyData"
          :disTime="disTime" />
        <Frequency
          :inputData="frequencyData"
          :refresh="refresh"
          :timeDomainResult="timeDomainResult"
          :master="master"
          @fallScene="getFallScene" />
        <LoRa
          :disTime="disTime"
          :timeDomainResult="timeDomainResult" />
        <Bluetooth
          :disTime="disTime"
          :timeDomainResult="timeDomainResult" />
      </ZXITabs>
    </div>
  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');
.header-slot{
  width: 100%;
  height: 100%;
  display: flex;
  padding: .5rem;
  box-sizing: border-box;
  .use-model{
    flex: auto;
    padding-left: calc(@btnSpace * 4);
  }
}

.about-time{
  font-size: @font20;
  color: v-bind('UseTheme.theme.var.color');
  display: table-cell;
  vertical-align: middle;
  height: 40px;
  padding-left: @btnSpace;
}

.domain-slot{
  height: 100%;
  padding: 0 @btnSpace;
  box-sizing: border-box;
  width: 280px;
  padding-left: 0 @btnSpace;
}
.CIQStream{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .params-branch{
    padding: @btnSpace @btnSpace 0 @btnSpace;
  }
  .first-row{
    height: 300px;
    display: flex;
    padding: @btnSpace @btnSpace 0 @btnSpace;
    box-sizing: border-box;
    background-color: v-bind('UseTheme.theme.var.backgroundColor');
    .time-domain{
      flex: auto;
    }
  }
  .second-row{
    flex: auto;
    margin-top: @btnSpace;
    padding: @btnSpace;
    box-sizing: border-box;
    border-top: v-bind('CustomTheme.theme.districtBorder');
  }
}
</style>