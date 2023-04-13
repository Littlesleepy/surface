<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-11 09:10:40
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-13 16:12:30
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\HandheldSingleMeasure.vue
 * @Description: 
 -->


<script setup lang='ts'>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFrameStore, useServerStore } from '@/store'
import { ELevelType, ESwitchState, IAxisYValue, ILevelData, IModulateData, ISpectrumInputData, ISubaudioDecodingData, ZXILevel, UseTheme } from 'mcharts/index'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import { mockPanleInited } from './mockPanleInited'
import { mapStyle } from 'helper/index'
import { ElMessage } from 'element-plus'
import levelsrc from './audio/level.mp3'
import LevelSlider from './components/LevelSlider/LevelSlider.vue'
import { localStorageKey } from '@/storage'
import { BaseParamsType, CustomTheme, setLinkTrigger } from '@/types'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import CommonMap from './components/CommonMap/CommonMap.vue'
import lightStyle from '@/assets/mapStyle/light.json'
import { MeasureControl, setDeviceMarker } from "./components/CommonMap/Control";

const store = useFrameStore()

// 列表组件
// const TabsRef = ref<InstanceType<typeof Tabs>>()

const ZLevel = ref<InstanceType<typeof ZXILevel>>()
// 辅助音频
const levelAudio = ref<HTMLAudioElement>()
// 单频数据
const inputData = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])
// 当前Level值
const inputLevel = ref<any>({
  level: 0,
  compass: 0
})
const levelData = ref(new Map<string, ILevelData>())
// 单频参数
const params = computed(() => {
  const form = store.s_form
  return {
    begin: Number(form.frequency) - form.bandwidth / 2000,
    end: Number(form.frequency) + form.bandwidth / 2000,
    bandwidth: Number(form.bandwidth) / 1000
  }
})
// 单频配置
const setTool = [
  {
    name: 'pubutu',
    value: false
  },
  {
    name: 'fengbiao',
    value: true
  }
]



const markers = ref<Array<number>>([])

const { trigger, selectFrequency } = setLinkTrigger()

function changeFrequency() {
  store.m_formOne({ key: 'frequency', value: trigger.value.value })
}

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()
// 频谱数据
optionsChild.set('SPECTRUMDATA', {
  control: (data) => {
    inputData.value = [makeSpectrumData(data)]
  }
})
//
const dBuV = ref(0)
optionsChild.set('LQCB', {
  control: (data: any) => {
    dBuV.value = data.level
    data.level = Math.pow(10, data.level / 20)
    levelData.value = new Map().set('level', {
      data: data.level,
      time: new Date()
    })
    inputLevel.value = data

  }
})

optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
  control: (data: { data: boolean }) => {
    if (data.data) {
      ElMessage({ message: '溢出', type: 'warning', grouping: true })
    }
  }
})


options.set('DATA', { children: optionsChild })
ReceiveData.add(options)

// 设置最大小值
const maxMinLevel = ref<IAxisYValue>({
  max: 0,
  min: -20
})
function setLevelValue(value: IAxisYValue) {
  maxMinLevel.value = value
  ZLevel.value!.setMaxMin(maxMinLevel.value)
}

watch(() => inputLevel.value.level, (newLevel) => {
  const viceForms = localStorage.getItem(localStorageKey.KEY_VICEFORMS)
  const playSpeed = JSON.parse(viceForms!).HandheldSingleMeasure['playSpeed'] as number
  const { max, min } = maxMinLevel.value
  const speed = Math.min(newLevel! / (max - min), 1)
  const speedPlay = Math.max(speed * playSpeed, 1)
  // 播放速度
  levelAudio.value!.playbackRate = Math.round(speedPlay)
  // 音量
  levelAudio.value!.volume = Math.max(speed, 0.4)
})

watch(() => store.s_playButton, (btn) => {
  const viceForms = localStorage.getItem(localStorageKey.KEY_VICEFORMS)
  const playAudio = JSON.parse(viceForms!).HandheldSingleMeasure['playAudio'] as boolean
  if (btn === ESwitchState.open) {
    levelData.value.clear()
    if (playAudio) {
      levelAudio.value!.muted = false

      levelAudio.value?.play()
    }
  } else {
    levelAudio.value?.pause()
  }
})

const master = ref<BaseParamsType>()
onMounted(() => {
  console.log(master.value?.elements);
  // frequency 频率(MHz) 
  // bandwidth 频谱带宽(kHz)
  // debw 解调带宽(kHz)
})
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
      <BaseParams ref="master" :inited="mockPanleInited" :disableBtnAfterTaskStart="{ all: false }" />
    </template>
    <div class="HandheldSingleMeasure">
      <div class="single-container">
        <div class="containerTop">
          <audio loop ref="levelAudio">
            <source :src="levelsrc" type="audio/mpeg">
          </audio>
          <div class="containerTop-header">
            瞬时值：{{ dBuV.toFixed(1) }} dBuV
          </div>

          <ZXILevel ref="ZLevel" :showAxisY="false" :capacity="0.1" :scaleY="{
            unit: 'dBuV',
            parse: (v) => `幅度：${parseFloat((20 * Math.log10(v)).toFixed(2))}dBuV`,
            transform: (v) => {
              return parseFloat((20 * Math.log10(v)).toFixed(2))
            }
          }" class="ZLevel" :drawType="ELevelType.bar" :switchLever="store.s_playButton" :deleteTool="['threshold']"
            :inputData="levelData" />
          <LevelSlider @event_setLevelValue="setLevelValue" :inputData="levelData" :switchLever="store.s_playButton"
            :inputLevel="inputLevel.level" class="ZSlider" />
        </div>
        <div class="containerBottom">
          <ZXISpectrumAndFall class="spectrum-and-fall" :inputData="inputData" :params="params"
            :switchLever="store.s_playButton" :setTool="setTool" :markers="markers" @selectFrequency="selectFrequency">
            <template #header>
              <BaseParamsBranch class="params-branch" :params="[
                [
                  { name: '频率', paramName: 'frequency', ratio: 12 },
                  { name: '频谱带宽', paramName: 'bandwidth', ratio: 12 },
                  { name: '解调带宽', paramName: 'debw', ratio: 12 },
                ]
              ]" :master="master" />
            </template>
          </ZXISpectrumAndFall>
          <CommonMap class="map"></CommonMap>
        </div>
      </div>
    </div>
  </BaseMonitorFrame>
</template>

<style scoped lang="less">
@import url('theme');

.base-link {
  display: flex;
  justify-content: center;
}

//     :deep(.pull-data-panel),
//     :deep(.push-data-panel) {
//       border-radius: 0 !important;
//     }

//     :deep(.icon-jiantou) {
//       left: -4px !important;
//     }

.HandheldSingleMeasure {
  width: 100%;
  height: 100%;
  display: flex;

  .single-container {
    flex: auto;
    display: flex;
    flex-direction: column;
    user-select: none;
    background-color: v-bind('UseTheme.theme.var.backgroundColor');

    .containerTop {
      height: 50%;
      display: grid;
      grid-template-columns: 1fr 90px;
      grid-template-rows: 32px 1fr;
      border-bottom: v-bind('CustomTheme.theme.districtBorder');
      box-sizing: border-box;

      .containerTop-header {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        color: v-bind('UseTheme.theme.var.color');
        font-size: 2rem;
        grid-column: 1/2;
        grid-row: 1/2;
      }

      .ZLevel {
        grid-column: 1/2;
        grid-row: 2/3;
        border-left: 1px solid v-bind('UseTheme.theme.var.borderColor');
        margin-left: 5px;
      }

      .ZSlider {
        grid-column: 2/3;
        grid-row: 1/3;
      }
    }

    .containerBottom {
      flex: auto;
      display: flex;
      flex-direction: row;

      .spectrum-and-fall {
        flex: 1;
        padding-right: @btnSpace;
        box-sizing: border-box;
        border-right: v-bind('CustomTheme.theme.districtBorder');

        .params-branch {
          padding: @btnSpace 0 0 @btnSpace;
        }
      }

      .map {
        box-sizing: border-box;
        max-width: 500px;
        width: 40%;
      }
    }
  }
}
</style>