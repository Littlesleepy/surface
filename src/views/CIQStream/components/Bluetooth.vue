<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-24 16:12:42
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 11:58:15
 * @FilePath: \zxi-device\src\views\CIQStream\components\Bluetooth.vue
 * @Description: :wrapperStyle="{ backgroundColor: 'rgb(241, 241, 241)' }"
 -->

<script setup lang="ts">
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, PropType, ref, watch } from 'vue'
import { Axios } from '@/server'
import { ElMessage } from 'element-plus'
import { Sundry } from '@/helper'
import { ESwitchState, INoSampleLinesPool, Scene, UseTheme } from 'mcharts/index'
import { CustomTheme } from '@/types'
interface IResult {
  demodeResult: string
  errorMessage: string
  instantAmplitudeSpectrum: Array<number> | null
  instantFrequencySpectrum: Array<number> | null
  warnningMessage: string
}

const props = defineProps({
  disTime: {
    default: 0
  },
  timeDomainResult: {
    type: Object as PropType<{ begin: number, end: number }>
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

const encodeInfo = ref<Array<string>>([])

const clear = ref(false)

const inputData1 = ref(new Map())

const inputData2 = ref(new Map())

const defaultValueX = computed(() => {
  return {
    min: 0,
    max: props.disTime
  }
})

function decode () {
  if (!props.timeDomainResult) {
    ElMessage.warning('请先采集时域')
    return
  }
  refresh()

  const params: any = {
    taskId: frameStore.s_taskId,
    startIndex: props.timeDomainResult.begin,
    stopIndex: props.timeDomainResult.end
  }

  const marker = Sundry.createMarker({
    text: '请稍候。。。'
  })
  Axios({
    url: 'api/Monitor/CIQStream/bleDemod',
    params
  }).then(msg => {
    const data: IResult = msg.data
    if (data.warnningMessage) ElMessage.warning(data.warnningMessage)
    if (data.errorMessage) ElMessage.warning(data.errorMessage)
    if (data.instantAmplitudeSpectrum) {
      const map = new Map()
      map.set('1', { data: new Float32Array(data.instantAmplitudeSpectrum), color: CustomTheme.theme.lineColorOne })
      inputData1.value =  map
    }
    if (data.instantFrequencySpectrum) {
      const map = new Map()
      map.set('1', { data: new Float32Array(data.instantFrequencySpectrum), color: CustomTheme.theme.lineColorOne })
      inputData2.value =  map
    }

    if (data.demodeResult) encodeInfo.value = [data.demodeResult]
  }).catch(err => {
    ElMessage.error(err.data)
  }).finally(() => {
    marker.close()
    clear.value = false
  })
}

function refresh () {
  inputData1.value = new Map()
  inputData2.value = new Map()
  encodeInfo.value = []
  clear.value = true
}

let scene1: Scene<INoSampleLinesPool>
function getScene1 (scene: Scene<INoSampleLinesPool>) {
  scene1 = scene
}

function getScene2 (scene: Scene<INoSampleLinesPool>) {
  // 缩放平移连接
  scene.shareFenceTo(scene1)
  // 游离连接
  toolTipLink(scene1, scene, '1-2')
  toolTipLink(scene, scene1, '2-1')
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
        offsetY: 0
      }
    }
  })
}

watch(() => frameStore.s_playButton, (btn) => {
  if (btn === ESwitchState.open) {
    refresh()
  }
})

const dataArr = [inputData1, inputData2]

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

</script>

<template>
  <div class="container">
    <div class="first-column">
      <BaseButton class="start" @click="decode">蓝牙BLE识别解码</BaseButton>
      <ZXIScrollInfo
        class="info"
        :inputData="encodeInfo"
        :clear="clear"
        :color="UseTheme.theme.var.color"
        :wrapperStyle="{ padding: '0px' }"
        :scrollWrapperStyle="{ border: `1px solid ${UseTheme.theme.var.borderColor}` }" />
    </div>
    <div class="second-column">
      <ZXITimeDomainLines
        class="level"
        :name="'有效蓝牙BLE信号 时域频率波形'"
        :inputData="inputData1"
        :switchLever="frameStore.s_playButton"
        :defaultValueX="defaultValueX"
        :capacity="0.1"
        :scaleX="scaleX"
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
        @scene="getScene1" />
      <ZXITimeDomainLines
        class="level"
        :name="'有效蓝牙BLE信号 时域幅度波形'"
        :inputData="inputData2"
        :defaultValueX="defaultValueX"
        :switchLever="frameStore.s_playButton"
        :capacity="0.1"
        :unitX="scaleX"
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
        @scene="getScene2" />
      </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .first-column{
    width: 400px;
    padding-right: @btnSpace;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    .info{
      width: 100%;
      box-sizing: border-box;
      flex: auto;
    }
  }
  .second-column{
    flex: auto;
    display: flex;
    flex-direction: column;
    .level{
      flex: 1;
    }
  }

}
</style>