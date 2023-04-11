<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-11 09:10:40
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-11 11:49:24
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\HandheldSingleMeasure.vue
 * @Description: 
 -->


<script setup lang='ts'>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFrameStore } from '@/store'
import { ELevelType, ESwitchState, IAxisYValue, ILevelData, IModulateData, ISpectrumInputData, ISubaudioDecodingData, ZXILevel, UseTheme } from 'mcharts/index'
import { makeSpectrumData, ReceiveData, ReceiveDataOptions } from '@/server'
import { mockPanleInited } from './mockPanleInited'
import { mapStyle } from 'helper/index'
import { ElMessage } from 'element-plus'
import levelsrc from './audio/level.mp3'
import LevelSlider from './components/LevelSlider.vue'
import { localStorageKey } from '@/storage'
import { BaseParamsType, CustomTheme, setLinkTrigger } from '@/types'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'



const store = useFrameStore()
// 列表组件
// const TabsRef = ref<InstanceType<typeof Tabs>>()

const ZLevel = ref<InstanceType<typeof ZXILevel>>()
// 开关
// const clear = computed(() => store.s_playButton === ESwitchState.open)
// 亚音解码列表
const subaudioDecoding = ref<Array<ISubaudioDecodingData>>([])
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
// 罗盘参数列表
// const compassData = ref<compassData>({
//   level: 0,
//   compass: 0
// })
// 最大值的方位角
// const MaxCompass = ref(-1)
// 信号测量结果列表
// const compassTableData = [
//   { prop: 'name', label: '名称' },
//   { prop: 'curValue', label: '瞬时值' },
//   { prop: 'maxValue', label: '最大值' },
//   { prop: 'minValue', label: '最小值' },
//   { prop: 'aveValue', label: '平均值' }
// ]
// 信号测量结果列表的数据
const ITUList = ref<Array<any>>([])
// 调制识别
const modList = ref<Array<IModulateData>>([])
// 方位列表
// const compassList = ref<Array<compassListType>>([])

const LinesGeoJson = ref<any>({
  'type': 'FeatureCollection',
  'features': []
})

const markers = ref<Array<number>>([])

const { trigger, selectFrequency } = setLinkTrigger()

function changeFrequency() {
  store.m_formOne({ key: 'frequency', value: trigger.value.value })
}

// 绘制到地图的方位列表(选中的方位列表)
const MapLines = ref<Array<any>>([])
// 音频数据
const spectrumData = ref<Array<ISpectrumInputData>>([{
  data: new Float32Array(),
  time: 0
}])
// 数字语音解调
const decodingState = ref<Array<string>>([])

// const resideTime = computed(() => {
//   return Number(store.s_viceForm.resideTime)
// })

// gps
// const gps = computed(() => serveStore.s_serverStateInfo.gpsLocation)
// const isLocated = computed(() => gps.value.isLocated)
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
    // const result = makeSingleBearing(data)
    // compassData.value = result
    // console.log(data)
    // console.log(data.level)
    dBuV.value = data.level
    data.level = Math.pow(10, data.level / 20)
    levelData.value = new Map().set('level', {
      data: data.level,
      time: new Date()
    })
    inputLevel.value = data

  }
})
// 音频数据
optionsChild.set('AUDIOSPECTRUM', {
  control: (data) => {
    spectrumData.value = [{
      data: data.spectrumData,
      time: new Date(data.time).getTime()
    }]
  }
})
// 信号测量结果
optionsChild.set('ITU', {
  control: (data) => {
    ITUList.value = data.data
  }
})
// 模式识别
optionsChild.set('MODE', {
  control: (data) => {
    modList.value = data.data
  }
})
// 数字语音解调/解码状态
optionsChild.set('LOGTEXTSTATE', {
  control: (data) => {
    decodingState.value = data.data
  }
})
optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
  control: (data: { data: boolean }) => {
    if (data.data) {
      ElMessage({ message: '溢出', type: 'warning', grouping: true })
    }
  }
})

// 亚音频解码
optionsChild.set('SUBAUDIODATA', {
  control: (data) => {
    const arr: Array<ISubaudioDecodingData> = []
    if (data) {
      data.cdcss_n.forEach(element => {
        arr.push(element)
      })
      data.cdcss_p.forEach(element => {
        arr.push(element)
      })
      data.ctcss.forEach(element => {
        arr.push(element)
      })
    }
    subaudioDecoding.value = arr
  }
})

options.set('DATA', { children: optionsChild })
ReceiveData.add(options)
// 获取最大值的方位角
// function getMaxCompass (value) {
//   MaxCompass.value = value
// }
// 设置最大小值
const maxMinLevel = ref<IAxisYValue>({
  max: 0,
  min: -20
})
function setLevelValue(value: IAxisYValue) {
  maxMinLevel.value = value
  ZLevel.value!.setMaxMin(maxMinLevel.value)
}

// 记录方位
// function recordCompass () {
//   if (!~MaxCompass.value) return
//   const { longitude, latitude } = gps.value
//   const [lon, lat] = getCoord(destination([longitude, latitude], 100, MaxCompass.value))
//   compassList.value.push({
//     compass: MaxCompass.value,
//     latitude,
//     longitude,
//     from_longitude: lon,
//     from_latitude: lat
//   })

// }
// // 更新绘制到地图的线列表
// function handleSelectionChange (value) {
//   MapLines.value = value

// }


// // 删除记录
// function CompassDelete () {
//   MapLines.value.forEach((de) => {
//     let pos = compassList.value.indexOf(de)
//     compassList.value.splice(pos, 1)
//   })
// }
// // 清空记录
// function CompassDeleteAll () {
//   compassList.value.length = 0
// }

function reset() {
  subaudioDecoding.value.length = 0
  ITUList.value.length = 0
  modList.value.length = 0
  decodingState.value.length = 0
  MapLines.value.length = 0
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
    reset()
    if (playAudio) {
      levelAudio.value!.muted = false

      levelAudio.value?.play()
    }
  } else {
    levelAudio.value?.pause()
  }
})

const master = ref<BaseParamsType>()
const tabId = ref(0)

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
    <!-- 头部切换视图 -->
    <template #header-center>
      <BaseTabHeader style="width: 100%;height: 100%; padding: .5rem; box-sizing: border-box;"
        :headers="['主页', '音频频谱', '信号测量结果', '调制识别', '数字语音解调/解码状态', '亚音解码']" v-model="tabId" />
    </template>
    <ZXITabs class="single-tabs" :wrapperStyle="{ border: 'none' }" :hidHeader="true" v-model="tabId">
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
            :switchLever="store.s_playButton" :setTool="setTool" :markers="markers" @selectFrequency="selectFrequency" />
          <div class="map" ref="mapDom" />
          <!-- <ZXITabs class="tabsAndAudio">
                      <ZXIScroll tabName="信号测量结果">
                        <ZXIItu :inputData="ITUList" class="lable-content" />
                      </ZXIScroll>
                      <ZXISpectrumAndFall
                          class="spectrum-and-fall-Audio"
                          tabName="音频频谱"
                        :inputData="spectrumData"
                        :params="params"
                        :switchLever="store.s_playButton"
                        :setTool="setTool"
                      />
                    </ZXITabs> -->
        </div>
        <!-- <ZXIDrawer :criticalPoint="9999">
                    <Tabs
                      :compassList="compassList"
                        :modList="modList"
                        :decodingState="decodingState"
                        :subaudioDecoding="subaudioDecoding"
                        :clear="clear"
                        @handle_Selection_Change="handleSelectionChange"
                        ref="TabsRef"
                      />
                    </ZXIDrawer> -->
      </div>
   
   
     
    </ZXITabs>
  </BaseMonitorFrame>
</template>

<style scoped lang="less">
.base-link {
  display: flex;
  justify-content: center;
}

.single-tabs {
  width: 100%;
  height: 100%;
}

.single-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');

  .containerTop {
    flex: 1;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 80px;
    grid-template-rows: 25px 1fr;
    border-bottom: v-bind('CustomTheme.theme.districtBorder');
    box-sizing: border-box;

    .containerTop-header {
      height: 25px;
      line-height: 25px;
      box-sizing: border-box;
      // color: rgb(220, 220, 220);
      color: v-bind('UseTheme.theme.var.color');
      font-size: 14px;
      text-align: center;
      grid-column-start: 1;
      grid-row-start: 1;
    }

    .containerTop-Level {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .ZSlider {
      width: 80px;
      height: 100%;
      // background-color: rgb(40, 40, 40);
      grid-column-start: 2;
      grid-row-start: 1;
      grid-row-end: 3;
    }

    .ZLevel {
      height: 100%;
      flex: 1;
      grid-column-start: 1;
      grid-row-start: 2;
      border-left: 1px solid v-bind('UseTheme.theme.var.borderColor');
      box-sizing: border-box;
      margin-left: 5px;
    }


  }

  .containerBottom {
    flex: 1;
    // width: 480px;
    display: flex;
    flex-direction: row;

    .spectrum-and-fall {
      flex: 1;
      padding-right: 5px;
      box-sizing: border-box;
      border-right: v-bind('CustomTheme.theme.districtBorder');
    }

    .map {
      box-sizing: border-box;
      border: 1px solid rgb(245, 247, 250);
      max-width: 400px;
      width: 40%;
    }


    .tabsAndAudio {
      border-top: 3px solid rgb(102, 102, 102);
      box-sizing: border-box;
      width: 100%;
      height: 35%;
      min-height: 265px;
      overflow: hidden;

      :deep(.base-content) {
        padding: 0;
      }
    }
  }

  :deep(.pull-data-panel),
  :deep(.push-data-panel) {
    border-radius: 0 !important;
  }

  :deep(.icon-jiantou) {
    left: -4px !important;
  }
}

.lable-content {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>