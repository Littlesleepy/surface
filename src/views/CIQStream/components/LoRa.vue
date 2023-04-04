<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-24 16:12:42
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-22 14:55:36
 * @FilePath: \zxi-device\src\views\CIQStream\components\LoRa.vue
 * @Description: :wrapperStyle="{ backgroundColor: 'rgb(241, 241, 241)' }"
 -->

<script setup lang="ts">
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, PropType, reactive, ref, watch } from 'vue'
import { CustomTheme, EParamsType } from '@/types'
import { Axios } from '@/server'
import { ElMessage } from 'element-plus'
import { Sundry } from '@/helper'
import { ESwitchState, INoSampleLinesPool, Scene, UseTheme } from 'mcharts/index'
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

const form = reactive({
  lorabw: 0,
  sf: 0,
  cfothreshold: 0.25,
  implicitHeader: false,
  layloadlength: 8,
  codingrate: 1,
  crc: false
})

const elements = ref<Array<any>>([
  {
    id: 0,
    toolTip: '',
    paramName: 'lorabw',
    title: 'LoRa带宽',
    type: EParamsType.enum,
    disabled: false,
    valueList: [{ label: '自动', value: 0 }, { label: '62.5', value: 62.5 }, { label: '125', value: 125 }, { label: '250', value: 250 }, { label: '500', value: 500 }]
  },
  {
    id: 1,
    toolTip: '',
    paramName: 'sf',
    title: '扩频因子',
    type: EParamsType.enum,
    disabled: false,
    valueList: [{ label: '自动', value: 0 }, { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 }, { label: '11', value: 11 }, { label: '12', value: 12 }]
  },
  {
    id: 2,
    toolTip: '设置LoRa识别解码的载波频偏门限，默认为0.25个符号，某些LoRa会超过0.5个符号',
    paramName: 'cfothreshold',
    title: '载波频偏门限',
    type: EParamsType.enum,
    disabled: false,
    valueList: [{ label: '0.1', value: 0.1 }, { label: '0.25', value: 0.25 }, { label: '0.5', value: 0.5 }, { label: '0.75', value: 0.75 }, { label: '1', value: 1 }]
  },
  {
    id: 3,
    toolTip: '',
    paramName: 'implicitHeader',
    title: '隐式报头',
    type: EParamsType.boolean,
    disabled: false
  },
  {
    id: 4,
    toolTip: '开启隐式报头方可操作',
    paramName: 'layloadlength',
    title: '负载字节数',
    type: EParamsType.enum,
    disabled: true,
    valueList: [{ label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 }, { label: '11', value: 11 }, { label: '12', value: 12 }]
  },
  {
    id: 5,
    toolTip: '开启隐式报头方可操作',
    paramName: 'codingrate',
    title: '循环编码率',
    type: EParamsType.enum,
    disabled: true,
    valueList: [{ label: '4/5', value: 1 }, { label: '4/6', value: 2 }, { label: '4/7', value: 3 }, { label: '4/8', value: 4 }]
  },
  {
    id: 6,
    toolTip: '开启隐式报头方可操作',
    paramName: 'crc',
    title: '是否CRC',
    type: EParamsType.boolean,
    disabled: true
  }
])

function getParams (value: any, key: string) {
  if (key === 'implicitHeader') {
    if (value) {
      elements.value[4].disabled = false
      elements.value[5].disabled = false
      elements.value[6].disabled = false
    } else {
      elements.value[4].disabled = true
      elements.value[5].disabled = true
      elements.value[6].disabled = true
    }
  }
}
/** 
 * @description: 解码
 */    
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

  Object.keys(form).forEach(key => {
    params[key] = form[key]
  })

  const marker = Sundry.createMarker({
    text: '请稍候。。。'
  })

  Axios({
    url: 'api/Monitor/CIQStream/loraDemod',
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

// 主题注册
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
    <div class="form">
      <BaseButton class="start" @click="decode">LoRo识别解码</BaseButton>
      <el-form
      :model="form"
      label-width="0"
      class="demo-ruleForm"
      label-position="left"
      :hide-required-asterisk="true">
        <el-tooltip v-for="item in elements" :key="item.id" effect="dark" :content="item.toolTip" :disabled="item.toolTip === ''" placement="right">
          <el-form-item :prop="item.paramName">
            <ZXISelect
              class="form-item"
              v-if="item.type === EParamsType.enum"
              @change="getParams(form[item.paramName], item.paramName)"
              v-model="form[item.paramName]"
              :name="item.title"
              :disabled="item.disabled">
              <el-option
                v-for="select in item.valueList"
                :key="select.label"
                :label="select.label"
                :value="select.value" />
            </ZXISelect>
            <ZXISwitch
              class="form-item"
              v-if="item.type === EParamsType.boolean"
              @change="getParams(form[item.paramName], item.paramName)"
              v-model="form[item.paramName]"
              :name="item.title"
              :disabled="item.disabled" />
          </el-form-item>
        </el-tooltip>
      </el-form>
    </div>
    <div class="third-column">
      <ZXITimeDomainLines
        class="level"
        :name="'有效LoRa信号 时域频率波形'"
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
        @scene="getScene1"/>
      <ZXITimeDomainLines
        class="level"
        :name="'有效LoRa信号 时域幅度波形'"
        :inputData="inputData2"
        :defaultValueX="defaultValueX"
        :switchLever="frameStore.s_playButton"
        :capacity="0.1"
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
        @scene="getScene2" />
    </div>
    <ZXIScrollInfo
      class="info"
      name="LoRa识别解码信息"
      :inputData="encodeInfo"
      :clear="clear"
      :color="UseTheme.theme.var.color"
      :scrollWrapperStyle="{ border: `1px solid ${UseTheme.theme.var.borderColor}` }" />
  </div>
</template>

<style scoped lang="less">
@import url('theme');

.form-item{
  width: 100%;
}
.demo-ruleForm{
  .el-form-item {
    margin-bottom: @btnSpace!important;
  }
}
.container{
  width: 100%;
  height: 100%;
  display: flex;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .form{
    width: 230px;
    padding-right: @btnSpace;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    .start{
      margin-bottom: @btnSpace;
    }
  }
  .info{
    width: 300px;
  }
  .third-column{
    flex: auto;
    display: flex;
    flex-direction: column;
    .level{
      flex: 1;
    }
  }
}
</style>