<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-23 17:21:53
 * @Description: 罗盘图
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { AroundPile, Canvas, Engine, Scene } from '../core'
import { CompassUI } from './CompassUI'
import { EBtncontrolType, ESwitchState } from '../types'
import { ICompassData, ICompassBuffer, ICompassPool } from './type'
import ZXIControlBtn from '../ZXIControlBtn/index.vue'
import { Sundry } from '../helper'
import { UseTheme } from '../styles'

/** props */
interface ZXICompassProps {
  inputData: ICompassData
  switchLever: ESwitchState
  qualityThreshold?: number
  deleteTool?: boolean
  defaultTool?: '次数优先' | '质量优先'
  controlStyle?: { wrapper: { width: string, height: string }, item: { width: string } }
  showAngle?: { min: number, max: number }
  refresh?: boolean
  resideTime?: number
  name?: string
}

const props = withDefaults(defineProps<ZXICompassProps>(), {
  inputData: () => {
    return {
      bearing: new Float32Array(),
      quality: new Float32Array(),
      time: new Date()
    }
  },
  switchLever: ESwitchState.off,
  qualityThreshold: 0,
  deleteTool: false,
  defaultTool: '次数优先',
  controlStyle: () => {
    return { wrapper: { width: '100px', height: '70px' }, item: { width: '100%' } }
  },
  showAngle: () => { return { min: -1, max: -1 } },
  refresh: false,
  resideTime: 10,
  name: undefined
})

/** emits */
const emit = defineEmits<{
  (e: 'scene', result: Scene<ICompassPool>): void
}>()

const root = ref<HTMLDivElement>()

const wrapper = ref<HTMLDivElement>()

let compassUI: CompassUI

const scene = ref<Scene<ICompassPool>>()

const staticEffect = ref(false)

const bufferArray = ref<Array<ICompassBuffer>>([])
// 次数优先
const countAngleExact = ref(new Float32Array(3600))

const countAngleMerge = ref(new Float32Array(360))

const maxCountExact = ref(0)

const maxCountMerge = ref(0) // 合并后最大次数

// 质量优先
let qualityExact = new Float32Array(3600)

let qualityMerge = new Float32Array(360)

let weightedExact = new Float32Array(3600)

let weightedMerge = new Float32Array(360)

const qualityScoreExact = ref(new Float32Array(3600))

const qualityScoreMerge = ref(new Float32Array(360))
/**
 * @description: 最大概率方位角
 */    
const maxPossibl = ref(0)

const minAngle = computed(() => props.showAngle.min >= 0 ? props.showAngle.min : 0)
const maxAngle = computed(() => props.showAngle.max >= 0 ? props.showAngle.max : 360)

// 角度数组
const angleArray = new Float32Array(360)
for (let i = 0; i < 360; i++) {
  angleArray[i] = i
}

const controls = ref([{
  type: EBtncontrolType.radio,
  title: '次数优先',
  paramName: 'count',
  value: '次数优先'
}, {
  type: EBtncontrolType.radio,
  title: '质量优先',
  paramName: 'quality',
  value: '质量优先'
}])

const btnValues = ref({
  radioValue: props.defaultTool
})

function watchInputData () {
  bufferArray.value.push(props.inputData)

  let ange, floorAnge, quality, floorAnge10, weighted
  let len = bufferArray.value.length
  const len1 = props.inputData.bearing.length

  // 开始统计
  if (len > 1) {
    if ((bufferArray.value[len - 1].time.getTime() - bufferArray.value[0].time.getTime()) / 1000 > props.resideTime) {
      const del = bufferArray.value.shift()!
      for (let j = 0; j < len1; j++) {
        ange = del.bearing[j]
        if (ange < 0) continue

        floorAnge = Math.floor(ange)
        floorAnge10 = Math.floor(ange * 10)
        // 角度次数减一
        countAngleMerge.value[floorAnge]--
        countAngleExact.value[floorAnge10]--
        if (countAngleMerge.value[floorAnge] < 0) countAngleMerge.value[floorAnge] = 0
        if (countAngleExact.value[floorAnge10] < 0) countAngleExact.value[floorAnge10] = 0
        // 质量
        quality = del.quality[j]
        weighted = 1 / (1 + Math.exp(-0.1 * (quality - 65)))
        qualityMerge[floorAnge] -= weighted * quality
        qualityExact[floorAnge10] -= weighted * quality
        //
        weightedMerge[floorAnge] -= weighted
        weightedExact[floorAnge10] -= weighted
      }
      len--
    }
  }

  for (let j = 0; j < len1; j++) {
    ange = props.inputData.bearing[j]
    quality = props.inputData.quality[j]
    // 质量门限判断
    if (ange < 0 || quality < props.qualityThreshold) continue

    floorAnge = Math.floor(ange)
    floorAnge10 = Math.floor(ange * 10)
    // 角度统计
    countAngleMerge.value[floorAnge]++
    countAngleExact.value[floorAnge10]++
    // 质量优先
    weighted = 1 / (1 + Math.exp(-0.1 * (quality - 65)))
    // 累计
    qualityMerge[floorAnge] += weighted * quality
    qualityExact[floorAnge10] += weighted * quality
    //
    weightedMerge[floorAnge] += weighted
    weightedExact[floorAnge10] += weighted
    //
    qualityScoreMerge.value[floorAnge] = qualityMerge[floorAnge] / weightedMerge[floorAnge]
    qualityScoreExact.value[floorAnge10] = qualityExact[floorAnge10] / weightedExact[floorAnge10]
  }

  staticEffect.value = !staticEffect.value

  render()
}

function render () {
  // 计算绘制区域
  if (scene.value) {
    if (btnValues.value.radioValue === '次数优先') {
      maxCountExact.value = Sundry.max(countAngleExact.value)
      maxCountMerge.value = Sundry.max(countAngleMerge.value)

      for (let z = 0; z < 3600; z++) {
        if (maxCountExact.value === countAngleExact.value[z]) {
          maxPossibl.value = z / 10
          break
        }
      }

      draw(countAngleMerge.value)
      
    } else {
      const maxQualityScoreExact = Sundry.max(qualityScoreExact.value)
      for (let z = 0; z < 3600; z++) {
        if (maxQualityScoreExact === qualityScoreExact.value[z]) {
          maxPossibl.value = z / 10
          break
        }
      }

      draw(qualityScoreMerge.value)
    } 
  }
}

function draw (data: Float32Array) {
  if (scene.value) {
    let closePath = false
    if (minAngle.value === 0 && maxAngle.value === 360) {
      closePath = true
    }

    const R = scene.value.canvas.clientHeight / 2
    const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx

    renderCtx.clearScreen()
    ctx.strokeStyle = UseTheme.theme.Compass.lineColor
    ctx.lineWidth = 1
    ctx.translate(R, R)
    ctx.beginPath()
    // 最大次数作为绘制最大半径
    const maxCount = Sundry.max(data)
    if (maxCount === 0) return

    const start = Math.floor(minAngle.value)
    const end = Math.floor(maxAngle.value)

    const { x, y } = getDrawPosition(start, data, maxCount, R)
    ctx.moveTo(x, y)

    for (let i = start + 1; i <= end; i++) {
      const { x, y } = getDrawPosition(i, data, maxCount, R)
      ctx.lineTo(x, y)
    }

    if (closePath) ctx.closePath()
    ctx.stroke()

    ctx.setTransform(1, 0, 0, 1, 0, 0)

    scene.value.render2D()
  }
}
/** 
 * @description: 计算绘制坐标
 * @return {*}
 */
function getDrawPosition (index: number, data: Float32Array, maxCount: number, maxR: number) {
  const angle = angleArray[index] / 180 * Math.PI
  const r = data[index] / maxCount * maxR

  const x = r * Math.sin(angle)
  const y = r * Math.cos(angle)

  return { x, y }
}
/**
 * @description: 重置
 */    
function reset () {
  bufferArray.value = []
  countAngleMerge.value = new Float32Array(360)
  countAngleExact.value = new Float32Array(3600)
  qualityExact = new Float32Array(3600)
  qualityMerge = new Float32Array(360)
  weightedExact = new Float32Array(3600)
  weightedMerge = new Float32Array(360)
  qualityScoreExact.value = new Float32Array(3600)
  qualityScoreMerge.value = new Float32Array(360)
}

watch(() => props.inputData, watchInputData)

watch([() => btnValues.value.radioValue, () => props.showAngle], () => {
  render()
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    reset()
  }
})

watch(() => props.refresh, () => {
  reset()
})

let themeKey

onMounted(() => {
  if (wrapper.value) {
    compassUI = new CompassUI(wrapper.value)

    // 主题注册
    themeKey = UseTheme.on(() => {
      render()
    })

    const engine = new Engine(compassUI.canvasMount)

    const ctx = new Canvas(engine.canvas, { backgroundColor: 'rgba(0, 0, 0, 0)' })

    scene.value = new Scene(engine, ctx)
    scene.value.disposeManager.add(compassUI.dispose)

    new AroundPile(scene.value.container)

    scene.value.resizeObservers.set('compass', () => {
      render()
    })

    scene.value.pool = reactive({
      bufferArray,
      countAngleExact,
      countAngleMerge,
      maxCountExact,
      maxCountMerge,
      qualityScoreExact,
      qualityScoreMerge,
      staticEffect
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  if (scene.value) {
    UseTheme.off(themeKey)
    scene.value.dispose()
  }
})

defineExpose({
  root
})

</script>
<template>
  <div ref="root">
    <div class="container">
      <div class="header">
        <ZXIControlBtn
            class="radar-control"
            v-if="!deleteTool"
            :controls="controls"
            :btnValues="btnValues"
            :controlStyle="controlStyle" />
        <p class="name" v-if="name !== undefined">{{ name }}</p>
        <span class="maximum-probability">最大概率方位角:{{ maxPossibl ? maxPossibl + '°': null}}</span>
      </div>
      <div class="img-wrapper" ref="wrapper" />
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
.container{
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  box-sizing: border-box;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  flex-direction: column;
  .header{
    height: @headerHeight;
    display: flex;
    justify-content: space-between;
    .radar-control{
      left: 10px;
      z-index: 99;
      margin: auto 0;
      width: @headerHeight;
    }
    .name{
      margin: auto 0;
      font-size: 12px;
      color: v-bind('UseTheme.theme.var.color');
      flex: auto;
    }
    .maximum-probability{
      width: 145px;
      text-align: right;
      color: v-bind('UseTheme.theme.var.color');
      font-size: 12px;
      margin: auto 0;
    }
  }
  .img-wrapper{
    flex: auto;
  }
}
</style>