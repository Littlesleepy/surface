<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-03-02 11:38:51
 * @Description: 多用途Y轴
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, ref, watch, computed, effectScope, watchEffect } from 'vue'
import * as Helper from '../helper/index'
import { IAxisYValue } from './type'
import { Axis, Scene, IAxisOptions, Fence, AxisType } from '../core'
import { IUnitAxis, UseTheme } from '..'

/** props */
interface ZXIAxisYProps {
  defaultValue?: IAxisYValue
  scale?: IUnitAxis
  controlBtn?: boolean
  step?: number
  color?: { width?: string, backgroundImage?: string, open?: boolean }
  scene?: Scene
  scaleNumWidth?: number
}

const props = withDefaults(defineProps<ZXIAxisYProps>(), {
  defaultValue: () => { return { max: 90, min: -20 } },
  scale: () => {
    return {
      unit: 'dBuV',
      transform: (v: number) => {
        return parseFloat(v.toFixed(0))
      }
    }
  },
  controlBtn: true,
  step: 5,
  color: () => {
    return {
      width: '10px',
      backgroundImage: 'linear-gradient(to bottom, red, yellow, green, blue)',
      open: true
    }
  },
  scaleNumWidth: 40
})

/** emits */
const emit = defineEmits<{
  (e: 'change', result: { min: number, max: number }): void
}>()

const root = ref<HTMLDivElement>()

const axisDom = ref<HTMLDivElement>()

const maxValue = ref(props.defaultValue.max)

const minValue = ref(props.defaultValue.min)

const touchStartY = ref(0)

let axis = ref<AxisType>()

const colorY = computed(() => {
  return {
    width: props.color.width!,
    backgroundImage: props.color.backgroundImage!
  }
})

// 刻度值控制
function maxAdd () {
  if (!props.controlBtn) return
  if (maxValue.value + props.step - minValue.value <= 0) return
  maxValue.value += props.step
}
function maxReduce () {
  if (!props.controlBtn) return
  if (maxValue.value - props.step - minValue.value <= 0) return
  maxValue.value -= props.step
}
function minAdd () {
  if (!props.controlBtn) return
  if (maxValue.value - minValue.value - props.step <= 0) return
  minValue.value += props.step
}
function minReduce () {
  if (!props.controlBtn) return
  if (maxValue.value - minValue.value + props.step <= 0) return
  minValue.value -= props.step
}
// 滚轮或者触屏控制刻度
function controlScale (ds: number): void {
  maxValue.value += ds
  minValue.value += ds
}
// 滚轮控制
function mousewheel (e: WheelEvent): void {
  if (!props.controlBtn) return
  const ds = e.deltaY < 0 ? 5 : -5
  controlScale(ds)
}
// 触屏开始
function touchStart (e: TouchEvent): void {
  touchStartY.value = e.touches[0].clientY
}
// 触屏上下滑动
const touchMove = Helper.UI.throttle(function (e: TouchEvent): void {
  if (!props.controlBtn) return
  const dx = e.touches[0].clientY - touchStartY.value
  if (Math.abs(dx) > 5) {
    const ds = dx > 0 ? -5 : 5
    controlScale(ds)
    touchStartY.value = e.touches[0].clientY
  }
}, 50)

watch(() => props.defaultValue, (v) => {
  maxValue.value = props.scale.transform(v.max)
  minValue.value = props.scale.transform(v.min)
}, { deep: true })

watch([maxValue, minValue], ([max, min]) => {
  emit('change', { max, min })
}, { immediate: true })

const scoped = effectScope()

watch(() => props.scene, (scene) => {
  if (scene && axisDom.value) {
    const options: IAxisOptions = {
      direction: Fence.VERTICAL,
      scaleNum: {
        width: props.scaleNumWidth
      }
    }
    axis.value = Axis.create(scene, axisDom.value, options)

    // 主题切换注册
    themeKey = UseTheme.on(() => {
      axis.value!.options.axisLine.color = UseTheme.theme.rgb.scaleColor
      axis.value!.renderAxisLine()
    })
    
    scoped.run(() => {
      watchEffect(() => {
        const controlLists: Array<number> = []
        const ds = (maxValue.value - minValue.value) / (axis.value!.scaleNum - 1)
        for (let i = 0; i < axis.value!.scaleNum; i++) {
          const value = props.scale.transform((maxValue.value - ds * i))
          controlLists.push(value)
        }

        axis.value!.setScaleNumber(controlLists)
      })

      watch(() => axis.value?.scaleNum, (v) => {
        if (v !== undefined) {
          for (const [, fun] of afterChange) {
            fun(v)
          }
        }
      })
    })
  }
})

const afterChange = new Map<string, (num: number) => void>()

let themeKey

onBeforeUnmount(() => {
  UseTheme.afterSetProperty.delete(themeKey)
  
  scoped.stop()

  axis.value!.dispose()
})

defineExpose({
  root,
  axis,
  afterChange
})

</script>

<template>
  <div ref="root">
    <div
      class="container"
      @wheel.stop="mousewheel"
      @touchstart="touchStart"
      @touchmove.stop="touchMove">
      <div class="control" v-show="controlBtn">
        <div>
          <button @click="maxAdd"><i class="iconfont icon-jia" /></button>
          <button @click="maxReduce"><i class="iconfont icon-jian" /></button>
        </div>
        <span v-show="true">{{ scale.unit }}</span>
        <div>
          <button @click="minAdd"><i class="iconfont icon-jia" /></button>
          <button @click="minReduce"><i class="iconfont icon-jian" /></button>
        </div>
      </div>
      <div ref="axisDom" />
      <span v-if="color.open" :style="colorY" />
    </div>
  </div>
</template>

<style scoped lang="less">
.container{
  height: 100%;
  display: flex;
  box-sizing: border-box;
  cursor: pointer;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .control{
    width: 60px;
    color: v-bind('UseTheme.theme.var.color');
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    >div{
      height: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      button{
        margin: 0 5px;
        width: 40px;
        height: 40px;
        background-color: rgba(0, 0, 0, 0);
        transition: background-color .2s;
        cursor: pointer;
        border: none;
        .iconfont{
          font-size: 30px;
          color: v-bind('UseTheme.theme.var.color');
        }
        &:hover{
          background-color: rgba(220, 220, 220, .3);
          transform: scale(1.09)
        }
        &:active{
          background-color: rgba(230, 230, 230, 1);
        }
      }
    }
    span{
      margin: auto;
      color: v-bind('UseTheme.theme.var.color');
      font-size: 20px;
    }
  }
}
</style>