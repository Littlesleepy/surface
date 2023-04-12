<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2022-08-15 11:50:28
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-02-21 15:19:39
 * @FilePath: \zxi-device\src\views\HandheldSingleMeasure\components\ZXICompassUI\ZXICompassUI.vue
 * @Description:
 -->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, watch, WatchStopHandle } from 'vue'
import { AroundPile, Canvas, CompassUI, Engine, ESwitchState, ICompassOptions, Scene } from 'mcharts/index'
import { Radar } from './types'
import * as helpel from '@/helper'
interface compassData {
  compass: number,
  level: number,
  time?: string | Date,
  frequency?: number,
  bearing?: Float32Array,
  quality?: Float32Array,
  label?: any,
  att?: number
}

const props = defineProps({
  padding: {
    type: Number, default: 0
  },
  options: {
    type: Object as PropType<ICompassOptions>, default: () => {
      return {
        compass: { enable: true },
        el_0_180: {
          span0Dom: {
            content: '0',
            color: 'rgb(255,255,255)',
            fontSize: '14px'
          },
          span1Dom: {
            content: '180',
            color: 'rgb(255,255,255)',
            fontSize: '14px'
          }
        },
        el_90_270: {
          span0Dom: {
            content: '270',
            color: 'rgb(255,255,255)',
            fontSize: '14px'
          },
          span1Dom: {
            content: '90',
            color: 'rgb(255,255,255)',
            fontSize: '14px'
          }
        }
      }
    }
  },
  inputData: {
    type: Object as PropType<compassData>,
    required: true
  },
  strokeStyle: {
    type: String,
    default: () => {
      return 'rgb(153,255,22)'
    }
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    required: true
  },
  resideTime: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['getMaxCompass'])

const container = ref<HTMLDivElement>()

const RadarImageContainer = ref<HTMLDivElement>()

const maxCompass = ref(0)

const CompassValue = ref(0)

const radian = Math.PI / 180

let scene: Scene

let $watch1: WatchStopHandle
let $watch2: WatchStopHandle
let compassUI: CompassUI
onMounted(() => {

  container.value!.style.padding = props.padding + 'px'

  const options = {
    compass: {
      enable: true
    }
  }

  compassUI = new CompassUI(RadarImageContainer.value!, options)

  const engine = new Engine(compassUI.canvasMount)
  const ctxx = new Canvas(engine.canvas)
  scene = new Scene(engine, ctxx, { backgroundColor: helpel.Echart.MOCK_BG_COLOR_S })
  scene.disposeManager.add(compassUI.dispose)
  const aroundPile = new AroundPile(compassUI.refusedToRotate!)

  compassUI.afterRotate.set('test', (event: DeviceOrientationEvent) => {
    if (event.alpha) {
      aroundPile.setOffsetAngle(event.alpha)
    }
  })

  // 容器大小变化 重新绘图
  scene.resizeObservers.set('setHeight', () => {
    drawLine(false)
  })

  // 获取canvas上下文
  const Rcanvas = scene.renderCtx.canvas
  const ctx = Rcanvas.getContext('2d')!

  // 绘制图形
  const RadarArray: Array<Radar> = []
  let maxLevel = 0

  function drawLine (IsSet: boolean) {
    // ********更新数据********
    // 画布中心点(半径)
    const Cpoint = Rcanvas.offsetWidth / 2
    // IsSet为true才更新数据 否则用旧数据绘图
    if (IsSet) {
      RadarArray.push({
        compass: 360 - props.inputData.compass,//方位角(角度)
        level: props.inputData.level,//level值(线的长度)
        time: new Date().setTime(Number(new Date()))//创建时间 用于超时删除
      })
    }

    if (RadarArray.length == 0) return

    const dsTime = RadarArray[RadarArray.length - 1].time - RadarArray[0].time
    //移除数据
    if (dsTime > props.resideTime * 1000 || RadarArray.length > 500) {
      RadarArray.shift()
    }
    // 抽取最大level值
    maxLevel = RadarArray[0].level
    for (let i = 1, j = RadarArray.length - 1; i < j; i++) {
      const max = RadarArray[i].level
      if (maxLevel < max) {
        maxLevel = max
      }
    }
    // ********绘图********
    // 刷新画布
    scene.refresh()
    // 设置颜色
    ctx.strokeStyle = props.strokeStyle
    // 开始绘图
    ctx.beginPath()
    // ↓该值为动态设置level最大值绘制出的线长度(等于半径)
    const m = Cpoint / maxLevel
    for (let i = 0, j = RadarArray.length - 1; i < j; i++) {
      // 当前方位角和level值
      let compass = RadarArray[i].compass
      let level = RadarArray[i].level
      // 抽取最大compass值
      if (level == maxLevel) {
        maxCompass.value = Number(compass.toFixed(1))
        emit('getMaxCompass', maxCompass.value)
      }
      // 长度根据最大值和半径调整
      level = level * m
      // 角度转为弧度
      compass = compass * radian
      // 设置线的起点
      ctx.moveTo(Cpoint, Cpoint)
      // 设置线的结束点
      ctx.lineTo(
        Cpoint + (level) * Math.sin(compass),
        Cpoint - (level) * Math.cos(compass)
      )
    }
    // 根据循环中设置的路径绘图
    ctx.stroke()
  }

  $watch1 = watch(() => props.inputData, (data) => {
    if (data.compass == -1) return
    drawLine(true)
    CompassValue.value = Number(data.compass.toFixed(1))
  })

  $watch2 = watch(() => props.switchLever, (play) => {
    if (play == 1) {
      RadarArray.length = 0
      drawLine(false)
    }
  })
})

onBeforeUnmount(() => {
  if (scene) {
    scene.dispose()
  }

  $watch1()
  $watch2()
})

</script>

<template>
  <div>
    <div class="container" ref="container">
      <div class="RadarImageContainer" ref="RadarImageContainer" />
      <span class="CompassValue">罗盘值: <span>{{ CompassValue ? CompassValue + '°' : ' --' }}</span> </span>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;

  * {
    user-select: none;
  }

  .RadarImageContainer {
    width: 100%;
    height: 100%;
    box-sizing: border-box;

  }

  .CompassValue {
    position: absolute;
    bottom: 0px;
    left: 0px;
    color: white;
    // border: 2px solid rgb(121,121,121);
    border-left: none;
    border-bottom: none;
    border-radius: 0px 8px 0px 0px;
    padding: 8px;
  }
}
</style>