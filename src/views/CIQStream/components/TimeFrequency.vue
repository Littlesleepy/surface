<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-23 10:26:24
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-18 15:09:15
 * @FilePath: \zxi-surface\src\views\CIQStream\components\TimeFrequency.vue
 * @Description: 时频特征
 -->

<script setup lang="ts">
import { ToExport } from '@/helper'
import { ReceiveData, ReceiveDataOptions, makeSpectrumData } from '@/server'
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, PropType, Ref, ref, watch, watchEffect } from 'vue'
import { ESwitchState, IIQData, INoSampleLinesPool, ISpectrumInputData, Scene, ZXIIQVector, ZXISpectrumAndFall, UseTheme } from 'mcharts/index'
import { IIQAnalysis } from '..'
import { CustomTheme } from '@/types'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'

const props = defineProps({
  inputData: {
    type: Object as PropType<IIQAnalysis>
  },
  disTime: {
    default: 0
  }
})

const scaleX = {
  unit: 'ms',
  parse: (v: number) => {
    const data = parseFloat(v.toFixed(9))
    return `时间：${data}ms | ${data * 1000}us`
  },
  transform: (v: number) => {
    return parseFloat(v.toFixed(9))
  }
}

const frameStore = useFrameStore()

const spectrum = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])

const params = ref({
  begin: 0,
  end: 0,
  bandwidth: 0
})

watchEffect(() => {
  const form = frameStore.s_form
  params.value = {
    begin: Number(form.frequency) - form.bandwidth / 2000,
    end: Number(form.frequency) + form.bandwidth / 2000,
    bandwidth: Number(form.bandwidth) / 1000
  }
})

// IQ
const iqData = ref<IIQData>({
  iData: new Float32Array(),
  qData: new Float32Array()
})

/**...........................时域分析结果........................... */
const inputData1 = ref(new Map())

const inputData2 = ref(new Map())

const inputData3 = ref(new Map())

const celiangInfo = ref<string[]>([])

const clear = ref(false)

const defaultValueX = computed(() => {
  return {
    min: 0,
    max: props.disTime
  }
})

// 瞬时频率频谱数据
function receiveSpectrum (
  data: Array<number>,
  receive: Ref<Map<string, { data: Float32Array, color: Float32Array }>>
) {
  const result = new Float32Array(data)
  const map = new Map()
  map.set('1', { data: result, color: CustomTheme.theme.lineColorOne })
  receive.value =  map
}

let scene1: Scene<INoSampleLinesPool>
function getScene1 (scene: Scene<INoSampleLinesPool>) {
  scene1 = scene
}

let scene2: Scene<INoSampleLinesPool>
function getScene2 (scene: Scene<INoSampleLinesPool>) {
  scene2 = scene
}

function getScene3 (scene: Scene<INoSampleLinesPool>) {
  // 缩放平移连接
  scene.shareFenceTo([scene1, scene2])

  // 游离连接
  toolTipLink(scene1, scene2, '1-2')
  toolTipLink(scene1, scene, '1-3')

  toolTipLink(scene2, scene1, '2-1')
  toolTipLink(scene2, scene, '2-3')

  toolTipLink(scene, scene1, '3-1')
  toolTipLink(scene, scene2, '3-2')
  
}
/** 
 * @description: 提示信息器连接
 */    
function toolTipLink (source: Scene<INoSampleLinesPool>, target: Scene<INoSampleLinesPool>, key: string) {
  source.pool!.toolTip.addlink(key, {
    target: target.pool!.toolTip,
    position: (p) => {
      return {
        offsetX: p.offsetX,
        offsetY: p.offsetY
      }
    }
  })
}
/** 
 * @description: 计算频谱参数
 * @param {number} bandwidth MHz
 */    
function caculateParams (bandwidth: number) {
  const form = frameStore.s_form
  params.value = {
    begin: Number(form.frequency) - bandwidth / 2,
    end: Number(form.frequency) + bandwidth / 2,
    bandwidth
  }
}

watch(() => props.inputData, (v) => {
  if (v) {
    caculateParams(v.realTimeSpectrum.span / 1000)
    spectrum.value = [{ time: new Date(v.realTimeSpectrum.time).getTime(), data: new Float32Array(v.realTimeSpectrum.data) }]

    receiveSpectrum(v.measureTimeDomainData.instantFrequencies, inputData1)
    receiveSpectrum(v.measureTimeDomainData.instantAmplitudes, inputData2)
    receiveSpectrum(v.measureTimeDomainData.instantPhases, inputData3)

    clear.value = true
    setTimeout(() => {
      celiangInfo.value = [v.toolTipStr]
      clear.value = false
    })
  }
})

watch(() => props.disTime, () => {
  clear.value = true
})

watch(() => frameStore.s_playButton, (btn) => {
  if (btn === ESwitchState.open) {
    clear.value = true
    caculateParams(frameStore.s_form.bandwidth / 1000)
  }
})

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 频谱数据
optionsChild.set(ReceiveData.key.DATA.SPECTRUMDATA, {
  control: (data) => {
    spectrum.value = [makeSpectrumData(data)]
  }
})
// IQ数据
optionsChild.set(ReceiveData.key.DATA.IQDATA, {
  control: (data) => {
    iqData.value = { iData: new Float32Array(data.iData), qData: new Float32Array(data.qData) }
  }
})

options.set('DATA', { children: optionsChild })
ReceiveData.add(options)

// 导出结果
const spSpectrum = ref<InstanceType<typeof ZXISpectrumAndFall>>()
const spIQVector = ref<InstanceType<typeof ZXIIQVector>>()
const timeCeliang = ref<HTMLDivElement>()

ToExport.beforExport.set('1', () => {
  if (spectrum.value[0].data.length > 0) {
    // 标题
    ToExport.addText('', '----时频特征----', 2, {
      PDF: { contentSize: 24 },
      Excel: { options: { size: 24 } }
    })
    // 频谱
    ToExport.addDom('频谱', spSpectrum.value!.root!, 3)
  }
  // IQ矢量图
  if (iqData.value.iData.length > 0) ToExport.addDom('IQ矢量图', spIQVector.value!.root!, 4)
  // 时域测量
  if (inputData1.value.size > 0) ToExport.addDom('时域测量', timeCeliang.value!, 5)
  // 测量信息
  if (celiangInfo.value.length > 0) {
    let str = ''
    celiangInfo.value.forEach(s => {
      str += s + '\n'
    })

    ToExport.addText('测量信息', str, 6)
  }
})

// 主题注册
const dataArr = [inputData1, inputData2, inputData3]

const themeKey = CustomTheme.on(() => {
  dataArr.forEach(item => {
    for (const [, line] of item.value) {
      line.color = CustomTheme.theme.lineColorOne
      item.value = new Map(item.value)
    }
  })
})

onBeforeUnmount(() => {
  CustomTheme.off(themeKey)
})

const currentTabId = ref(0)

const defaultValueY = { max: 60, min: -50 }
</script>

<template>
  <div class="TimeFrequency">
    <!-- 左边按钮区域 -->
    <BaseTabHeader
      class="left"
      :headers="[
        [{ name: '频谱', ratio: 1 }],
        [{ name: '瞬时频率', ratio: 1 }],
        [{ name: '瞬时幅度', ratio: 1 }],
        [{ name: '瞬时相位', ratio: 1 }],
        [{ name: 'IQ矢量图', ratio: 1 }],
        [{ name: '测量信息', ratio: 1 }]
      ]"
      v-model="currentTabId" />
    <!-- 右边图区 -->
    <ZXITabs
      class="right"
      :wrapperStyle="{ border: 'none' }"
      :hidHeader="true"
      v-model="currentTabId">
      <ZXISpectrumAndFall
        class="spectrum-and-fall"
        ref="spSpectrum"
        :name="''"
        :defaultValueY="defaultValueY"
        :inputData="spectrum"
        :params="params"
        :switchLever="frameStore.s_playButton"
        :deleteTool="['pubutu', 'fallCeliang', 'shaixuan']" />
      <ZXITimeDomainLines
        class="level"
        :name="''"
        :inputData="inputData1"
        :switchLever="frameStore.s_playButton"
        :defaultValueX="defaultValueX"
        :capacity="0.1"
        :scaleX="scaleX"
        :toolTip="{ width: 460 }"
        :scaleNumWidthY="95"
        :scaleY="{
          unit: 'Hz',
          parse: (v: number) => {
            return `频偏：${v.toFixed(1)}Hz`
          },
          transform: (v: number) => {
            return parseFloat(v.toFixed(1))
          }
        }"
        @scene="getScene1"/>
      <ZXITimeDomainLines
        class="level"
        :name="''"
        :inputData="inputData2"
        :defaultValueX="defaultValueX"
        :switchLever="frameStore.s_playButton"
        :capacity="0.1"
        :toolTip="{ width: 460 }"
        :scaleX="scaleX"
        :scaleNumWidthY="95"
        :scaleY="{
          unit: 'dBuV',
          parse: (v: number) => {
            return `幅度：${v.toFixed(1)}dBuV`
          },
          transform: (v: number) => {
            return parseFloat(v.toFixed(1))
          }
        }"
        @scene="getScene2"/>
      <ZXITimeDomainLines
        class="level"
        :name="''"
        :inputData="inputData3"
        :defaultValueX="defaultValueX"
        :switchLever="frameStore.s_playButton"
        :capacity="0.1"
        :toolTip="{ width: 460 }"
        :scaleX="scaleX"
        :scaleNumWidthY="95"
        :scaleY="{
          unit: 'rad',
          parse: (v: number) => {
            return `相位：${v.toFixed(1)}rad`
          },
          transform: (v: number) => {
            return parseFloat(v.toFixed(1))
          }
        }"
        @scene="getScene3" />
      <ZXIIQVector
        ref="spIQVector"
        class="iq-vector-image"
        :inputData="iqData"
        :name="''"
        :switchLever="frameStore.s_playButton"
        :pointRadius="7" />
      <ZXIScrollInfo
        class="measure-info"
        name=""
        :inputData="celiangInfo"
        :clear="clear"
        :color="UseTheme.theme.var.color"
        :scrollWrapperStyle="{
          border: `1px solid ${UseTheme.theme.var.borderColor}`
        }"/>
    </ZXITabs>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.TimeFrequency{
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .left{
    width: 150px;
    margin-right: @btnSpace;
  }
  .right{
    flex: auto;
  }
}
.measure-info{
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
}
</style>