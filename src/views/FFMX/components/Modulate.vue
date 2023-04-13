<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-07 15:48:35
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-10 11:27:09
 * @FilePath: \zxi-surface\src\views\FFMX\components\Modulate.vue
 * @Description: 
 -->
<script setup lang='ts'>
import { useFrameStore } from '@/store'
import { computed, onBeforeUnmount, Ref, ref, watch } from 'vue'
import * as Helper from 'helper/index'
import { EAxisXType, ESwitchState, ILineData, ISpectrumParams, ZXISpectrumLineType, UseTheme, ILevelData, ZXILevel } from 'mcharts/index'
import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
import { ReceiveData, ReceiveDataOptions } from '@/server'
import { ToExport } from 'helper/index'
import { CustomTheme } from '@/types'

const props = defineProps({
  canDraw: { default: false }
})

const scaleY = {
  unit: '',
  parse: (v: number) => {
    return `值：${v.toFixed(1)}`
  },
  transform: (v: number) => {
    return parseFloat(v.toFixed(1))
  }
}
const store = useFrameStore()

const inputData1 = ref(new Map<string, ILineData>())

const statistical1 = ref(new Float32Array())

const inputData2 = ref(new Map<string, ILineData>())

const statistical2 = ref(new Float32Array())

const inputData3 = ref(new Map<string, ILineData>())

const statistical3 = ref(new Float32Array())

const inputData4 = ref(new Float32Array())

const inputData5 = ref(new Float32Array())

const inputData6 = ref(new Float32Array())

const inputData7 = ref(new Float32Array())

const inputData8 = ref(new Float32Array())

const inputData9 = ref(new Float32Array())

const inputData10 = ref(new Float32Array())

const levelInput = ref(new Map<string, ILevelData>())

const startAndStop = computed(() => store.s_playButton)

const levleInstance = ref<InstanceType<typeof ZXILevel>>()

const params1 = computed(() => {
  return { bandwidth: Number(store.s_form.debw) / 1000 }
})

const param4 = computed<ISpectrumParams>(() => {
  const form = store.s_form
  const realWidth = Helper.Device.getSamplingRateByBandwidth(Number(form.debw)) / 1000
  const frequency = Number(form.def) === 0 ? Number(form.frequency) : Number(form.def)

  return {
    begin: frequency - realWidth / 2,
    end: frequency + realWidth / 2
  }
})

const param5 = computed<ISpectrumParams>(() => {
  const realWidth = Helper.Device.getSamplingRateByBandwidth(Number(store.s_form.debw)) / 2000
  return {
    begin: 0,
    end: realWidth
  }
})

// 数据储存
const cacheData0 = new Map<string, Map<string, ILineData>>()

const cacheData1 = new Map<string, Float32Array>()

// 数据接收
const options: ReceiveDataOptions = new Map()
const optionsChild: ReceiveDataOptions = new Map()



// 瞬时频率频谱数据
function receiveSpectrum1(
  key: string,
  receive1: Ref<Map<string, ILineData>>,
  receive2: Ref<Float32Array>
) {
  optionsChild.set(key, {
    control: (data) => {
      const result = new Float32Array(data)
      const map = new Map()
      map.set('1', { data: result, color: CustomTheme.theme.lineColorOne })
      cacheData0.set(key, map)
      if (props.canDraw) {
        receive1.value = map
        // 统计
        receive2.value = result
      }
    }
  })

}
receiveSpectrum1('INSTANTFREQUENCYDATA', inputData1, statistical1)
// 瞬时幅度频谱数据
receiveSpectrum1('INSTANTAMPLITUDEDATA', inputData2, statistical2)
// 瞬时相位频谱数据
receiveSpectrum1('INSTANTPHASEDATA', inputData3, statistical3)
// 瞬时包络
function receiveSpectrum2(
  key: string,
  receive: Ref<Float32Array>,
  half = true) {
  optionsChild.set(key, {
    control: (data) => {
      const len = Math.floor(data.length / 2)
      const result = half ? new Float32Array(data.slice(len)) : new Float32Array(data)
      cacheData1.set(key, result)

      if (props.canDraw) receive.value = result
    }
  })
}
receiveSpectrum2('IFEDATA', inputData4, false)
// FFMX瞬时幅度
receiveSpectrum2('IAEDATA', inputData5, false)
// FFMX FM解调
receiveSpectrum2('FMDEMODDATA', inputData6, false)
// 功率谱
receiveSpectrum2('PWERDATA', inputData7, false)
// 平方谱
receiveSpectrum2('SQUAREDATA', inputData8, false)
// 四次方谱
receiveSpectrum2('QUADDATA', inputData9, false)
// 八次方谱
receiveSpectrum2('EIGHTDATA', inputData10, false)
// 电平
optionsChild.set('CHLEVEL', {
  control: (data) => {
    const map = new Map<string, ILevelData>()
    map.set('1', { data: data.level, time: new Date() })
    levelInput.value = map
  }
})
options.set('DATA', { children: optionsChild })
ReceiveData.add(options)

// 导出结果
const instance1 = ref<HTMLDivElement>()
const instance2 = ref<HTMLDivElement>()
const instance3 = ref<HTMLDivElement>()
const instance4 = ref<ZXISpectrumLineType>()
const instance5 = ref<ZXISpectrumLineType>()
const instance6 = ref<ZXISpectrumLineType>()
const instance7 = ref<ZXISpectrumLineType>()
const instance8 = ref<ZXISpectrumLineType>()
const instance9 = ref<ZXISpectrumLineType>()
const instance10 = ref<ZXISpectrumLineType>()

function drawForce0(key, receive1: Ref<Map<string, ILineData>>, receive2: Ref<Float32Array>) {
  if (cacheData0.size > 0) {
    const data = cacheData0.get(key)!
    receive1.value = data
    receive2.value = data.get('1')!.data
  }
}

function drawForce1(key: string, receive: Ref<Float32Array>) {
  if (cacheData1.size > 0) {
    const data = cacheData1.get(key)!
    receive.value = data
  }
}

function drawForceAll() {
  drawForce0('INSTANTFREQUENCYDATA', inputData1, statistical1)
  drawForce0('INSTANTAMPLITUDEDATA', inputData2, statistical2)
  drawForce0('INSTANTPHASEDATA', inputData3, statistical3)

  drawForce1('IFEDATA', inputData4)
  // FFMX瞬时幅度
  drawForce1('IAEDATA', inputData5)
  // FFMX FM解调
  drawForce1('FMDEMODDATA', inputData6)
  // 功率谱
  drawForce1('PWERDATA', inputData7)
  // 平方谱
  drawForce1('SQUAREDATA', inputData8)
  // 四次方谱
  drawForce1('QUADDATA', inputData9)
  // 八次方谱
  drawForce1('EIGHTDATA', inputData10)
}

watch(() => props.canDraw, (v) => {
  if (v) drawForceAll()
})

watch(() => store.s_playButton, (btn) => {
  if (btn === ESwitchState.open) {
    cacheData0.clear()
    cacheData1.clear()
  }
})

// 主题注册
const inputDataArr = [inputData1, inputData2, inputData3]

const themeKey = CustomTheme.on(() => {
  inputDataArr.forEach(input => {
    for (const [, line] of input.value) {
      line.color = CustomTheme.theme.lineColorOne
      input.value = new Map(input.value)
    }
  })
})

onBeforeUnmount(() => {
  CustomTheme.off(themeKey)
})

ToExport.beforExport.set('1', () => {

  if (levelInput.value.size > 0) ToExport.addDom('电平图', levleInstance.value!.root!, 3)
  if (cacheData0.size > 0) {
    // 如果未观察信号分析页，则强制绘制一次
    if (!props.canDraw) drawForceAll()
    // 标题
    ToExport.addText('', '----信号分析----', 7, {
      PDF: { contentSize: 24 },
      Excel: { options: { size: 24 } }
    })
      .addDom('瞬时频率', instance1.value!, 8)
      .addDom('瞬时幅度', instance2.value!, 9)
      .addDom('瞬时相位', instance3.value!, 10)
      .addDom('瞬时频率包络', instance4.value!.root!, 11)
      .addDom('瞬时幅度包络', instance5.value!.root!, 12)
      .addDom('FM解调谱', instance6.value!.root!, 13)
      .addDom('功率谱', instance7.value!.root!, 14)
      .addDom('二次方谱', instance8.value!.root!, 15)
      .addDom('四次方谱', instance9.value!.root!, 16)
      .addDom('八次方谱', instance10.value!.root!, 17)
  }
})

const currentTabId = ref(0)
</script>

<template>
  <div class="Modulate-container">
    <div class="first-colum">
      <ZXILevel class="level" name="电平图" ref="levleInstance" :deleteTool="['threshold']" :inputData="levelInput"
        :switchLever="startAndStop" />
    </div>
    <div class="second-colum">
      <BaseTabHeader class="tab-header" :headers="[
        [{ name: '瞬时频率', ratio: 1 }],
        [{ name: '瞬时幅度', ratio: 1 }],
        [{ name: '瞬时相位', ratio: 1 }],
        [{ name: '瞬时频率包络', ratio: 1 }],
        [{ name: '瞬时幅度包络', ratio: 1 }],
        [{ name: 'FM解调谱', ratio: 1 }],
        [{ name: '功率谱', ratio: 1 }],
        [{ name: '二次方谱', ratio: 1 }],
        [{ name: '四次方谱', ratio: 1 }],
        [{ name: '八次方谱', ratio: 1 }],
      ]" v-model="currentTabId" />
      <ZXITabs class="tabItem" :wrapperStyle="{ border: 'none' }" :hidHeader="true" v-model="currentTabId">
        <div ref="instance1" class="item">
          <ZXITimeDomainLines class="level" :name="'瞬时频率'" :inputData="inputData1" :switchLever="store.s_playButton"
            :params="params1" :capacity="0" :scaleY="{
              unit: 'Hz',
              parse: (v: number) => {
                return `频偏：${v.toFixed(1)}Hz`
              },
              transform: (v: number) => {
                return parseFloat(v.toFixed(1))
              }
            }" />
          <ZXIStatisticalY class="statistical" :inputData="statistical1" :switchLever="store.s_playButton" />
        </div>
        <div ref="instance2" class="item">
          <ZXITimeDomainLines class="level" :name="'瞬时幅度'" :inputData="inputData2" :params="params1"
            :switchLever="store.s_playButton" :capacity="0" :scaleY="{
              unit: 'dBuV',
              parse: (v: number) => {
                return `幅度：${v.toFixed(1)}dBuV`
              },
              transform: (v: number) => {
                return parseFloat(v.toFixed(1))
              }
            }" />
          <ZXIStatisticalY class="statistical" :inputData="statistical2" :switchLever="store.s_playButton" />
        </div>
        <div ref="instance3" class="item">
          <ZXITimeDomainLines class="level" :name="'瞬时相位'" :inputData="inputData3" :params="params1"
            :switchLever="store.s_playButton" :capacity="0" :scaleY="{
              unit: 'rad',
              parse: (v: number) => {
                return `相位：${v.toFixed(1)}rad`
              },
              transform: (v: number) => {
                return parseFloat(v.toFixed(1))
              }
            }" />
          <ZXIStatisticalY class="statistical" :inputData="statistical3" :switchLever="store.s_playButton" />
        </div>
        <ZXISpectrumLine class="spectrum" ref="instance4" :name="'瞬时频率包络'" :inputData="inputData4" :params="param5"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :deleteTool="['pinlvhuafen']" :xScaleType="EAxisXType.range" :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" ref="instance5" :name="'瞬时幅度包络'" :inputData="inputData5" :params="param5"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :deleteTool="['pinlvhuafen']" :xScaleType="EAxisXType.range" :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" :name="'FM解调谱'" ref="instance6" :inputData="inputData6" :params="param5"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :deleteTool="['pinlvhuafen']" :xScaleType="EAxisXType.range" :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" ref="instance7" :name="'功率谱'" :inputData="inputData7" :params="param4"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" ref="instance8" :name="'二次方谱'" :inputData="inputData8" :params="param4"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" ref="instance9" :name="'四次方谱'" :inputData="inputData9" :params="param4"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :scaleY="scaleY" />
        <ZXISpectrumLine class="spectrum" ref="instance10" :name="'八次方谱'" :inputData="inputData10" :params="param4"
          :switchLever="store.s_playButton" :controlBtnY="false" :setTool="[{ name: 'junzhi', value: true }]"
          :scaleY="scaleY" />
      </ZXITabs>
    </div>

  </div>
</template>


<style scoped lang="less">
@import url('theme');

.Modulate-container {
  width: 100%;
  height: 100%;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  display: flex;
  flex-direction: column;

  .first-colum {
    width: 100%;
    height: 40%;

    .level {
      height: 100%;
      width: 100%;
    }
  }

  .second-colum {
    flex: auto;
    display: flex;
    border-top: v-bind('CustomTheme.theme.districtBorder');

    .tab-header {
      width: 150px;
      margin: @btnSpace;
    }
  }

  .tabItem {
    flex: auto;
    display: flex;

    .item {
      flex: auto;
      display: flex;
      background-color: v-bind('UseTheme.theme.var.backgroundColor');
      .level {
        flex: auto;
      }

      .statistical {
        width: 20%;
        min-width: 100px;
        padding-top: 45px;
        padding-left: 5px;
      }
    }

    .spectrum {
      flex: auto;
      
    }

  }
}
</style>