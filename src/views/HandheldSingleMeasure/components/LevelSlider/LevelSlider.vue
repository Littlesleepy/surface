<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2022-07-20 13:56:30
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-13 14:14:42
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\components\LevelSlider\LevelSlider.vue
 * @Description:
 -->

<script setup lang="ts">
import { CustomTheme } from '@/types'
import {
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch
} from 'vue'
import { Scene, ILevelPool, ESwitchState, UseTheme } from 'mcharts/index'


const props = defineProps({
  inputLevel: { type: Number, required: true, default: () => 0 },
  scene: { type: Object as PropType<Scene<ILevelPool>>, default: () => { } },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    required: true
  }
})

const emit = defineEmits(['event_setLevelValue'])

const touchStartY = ref(0)
// 最大值
const maxLevel = ref(0)
// 最小值
const minLevel = ref(-20)
// 当前值
const level = ref(0)

// 重置部分数据
function reset() {
  maxLevel.value = 0
  if (props.scene) {
    props.scene.pool?.buffer!.get('1')?.forEach((e) => {
      if (maxLevel.value < 20 * Math.log10(e.data)) {
        maxLevel.value = 20 * Math.log10(e.data)
      }
    })
  }
  minLevel.value = -20
}
// 重新开始时重置数据
watch(
  () => props.switchLever,
  (newValue) => {
    if (newValue == 1) {
      reset()
    }
  }
)
const mouseState = ref(false)
window.addEventListener('mouseup', closeState)
function closeState() {
  mouseState.value = false
}
// 手指触摸记录起始点
function SliderStart(e: TouchEvent | MouseEvent) {
  let clientY = 0
  mouseState.value = true
  if (e.type === 'touchstart') {
    e = e as TouchEvent
    clientY = e.touches[0].clientY
  } else if (e.type === 'mousedown') {
    e = e as MouseEvent
    clientY = e.clientY
  }
  touchStartY.value = clientY

}
// 手指移动增减最大小值
function SliderMove(e: TouchEvent | MouseEvent) {
  let clientY = 0
  if (!mouseState.value) return
  if (e.type === 'touchmove') {
    e = e as TouchEvent
    clientY = e.touches[0].clientY
  } else if (e.type === 'mousemove') {
    e = e as MouseEvent
    clientY = e.clientY
  }

  const dx = clientY - touchStartY.value
  if (Math.abs(dx) > 10) {
    const ds = dx > 0 ? -1 : 1
    maxLevel.value += ds
    minLevel.value += ds
    touchStartY.value = clientY
  }
}

function SliderWheel(e: WheelEvent) {
  const ds = e.deltaY > 0 ? -1 : 1
  maxLevel.value += ds
  minLevel.value += ds
}
// 点击按钮增减最大小值
const num = 5
function setMaxMin(str: string) {
  switch (str) {
    case 'addMax':
      maxLevel.value += num
      break
    case 'reduceMax':
      if (maxLevel.value - num < minLevel.value) return
      maxLevel.value -= num
      break
    case 'addMin':
      if (minLevel.value + num > maxLevel.value) return
      minLevel.value += num
      break
    case 'reduceMin':
      minLevel.value -= num
      break
  }
}
// 设置颜色
const Color = ref('rgb(0,0,0)')

function setColor(a_color: number) {
  const b_color: Array<Array<number>> = UseTheme.theme.SpectrumAndFall.barColor


  const L = b_color.length - 1
  const d = 1 / L
  for (let i = 1; i <= L; i++) {

    if (a_color <= (d * i)) {
      const n = (a_color - d * (i - 1)) * L
      const [r, g, b] = ((cb, ct, n) => {
        let c: Array<number> = []
        cb.forEach((e, i) => {
          // DEBUG
          // console.log(e,cb[i],ct[i]);
          // console.log(cb[i],ct[i]);
          if (cb[i] > ct[i]) {
            c.push(255 - ((cb[i] - ct[i]) * (n) + ct[i]) * 255)
            // console.log(255 - ((cb[i] - ct[i]) * (n) + ct[i]) * 255);
          } else if (cb[i] < ct[i]) {
            c.push(((ct[i] - cb[i]) * (n) + cb[i]) * 255)
          } else {
            c.push(cb[i] * 255)
          }
        })
        return c
      })(b_color[i - 1], b_color[i], n)
      Color.value = `rgb(${r},${g},${b})`
      // console.log(r,g,b);
      return `rgb(${r},${g},${b})`
    }
  }

}
// 设置高度
const heightRatio = ref(0)
function setHeight(control: boolean = false) {
  const max = Math.max(props.inputLevel, Math.pow(10, maxLevel.value / 20))
  const min = Math.pow(10, minLevel.value / 20)
  // const powMax = Math.pow(10, maxLevel.value / 20)
  // 设置最大值
  maxLevel.value = 20 * Math.log10(max)//max

  // 运行中使用这个值
  const play =
    ((props.inputLevel - min) / ((max - min) * 0.1 + max)) * 100

  // 暂停时使用这个值
  const stop =
    ((props.inputLevel - min) / (max - min)) * 100
  heightRatio.value = (control ? props.switchLever : true) ? play : stop

  // 动态设置颜色
  setColor(heightRatio.value / 100)

}

// 监听数据更新
watch(
  () => props.inputLevel,
  (newLevel) => {
    level.value = newLevel
    setHeight()
  }
)
const themeKey = CustomTheme.on(() => {
  queueMicrotask(() => {
    setColor(heightRatio.value / 100)
  })
})


// 监听最大小值变化
watch(
  () => [maxLevel.value, minLevel.value],
  ([nv1, nv2]) => {
    // 最大值修改
    setHeight(true)
    // 将值传给ZXILevel组件
    emit('event_setLevelValue', {
      max: Math.pow(10, nv1 / 20),
      min: Math.pow(10, nv2 / 20)
    })
  }
)
// 设置默认值
onMounted(() => {
  setColor(0)
  emit('event_setLevelValue', {
    max: Math.pow(10, maxLevel.value / 20),
    min: Math.pow(10, minLevel.value / 20)
  })
})
onUnmounted(() => {
  CustomTheme.off(themeKey)
  window.removeEventListener('mouseup', closeState)
})

</script>
 
<template>
  <div>
    <div class="LevelSlider">
      <div class="Slider-Top Slider-text">{{ maxLevel.toFixed(1) }}</div>
      <div class="Slider-Content" @touchstart="SliderStart" @mousedown="SliderStart" @touchmove="SliderMove"
        @mousemove="SliderMove" @wheel="SliderWheel">
        <div class="Slider-buttons">
          <div @click.stop.prevent="setMaxMin('addMax')" class="Slider-button">
            <i class="iconfont icon-jia" />
          </div>
          <div @click.stop.prevent="setMaxMin('addMin')" class="Slider-button">
            <i class="iconfont icon-jia" />
          </div>
        </div>
        <div class="Slider-box">
          <span :style="{ 'height': `${heightRatio}%` }" />
        </div>
        <div class="Slider-buttons">
          <div @click.stop.prevent="setMaxMin('reduceMax')" class="Slider-button">
            <i class="iconfont icon-jian" />
          </div>
          <div @click.stop.prevent="setMaxMin('reduceMin')" class="Slider-button">
            <i class="iconfont icon-jian" />
          </div>
        </div>
      </div>
      <div class="Slider-Footer Slider-text">{{ minLevel.toFixed(1) }}</div>
    </div>

  </div>
</template>
 
<style scoped lang="less">
@import url('theme');


.LevelSlider {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: v-bind('UseTheme.theme.var.color');
  font-size: 2rem;

  .Slider-text {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
  }

  .Slider-Top {
    min-height: 32px;
  }

  .Slider-Content {
    flex: auto;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;


    .Slider-buttons {
      height: 100%;
      flex: auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .Slider-button {
        width: 3rem;
        height: 3rem;
        display: flex;
        justify-content: center;
        align-items: center;
        white-space: nowrap;
        border-radius: 50%;
        transition: all .2s;
        box-sizing: border-box;
        margin: 2px;
        cursor: pointer;

        i {
          font-size: 3rem;
        }


        &:hover {
          background-color: v-bind('UseTheme.theme.var.borderColor');
        }

        &:active {
          background-color: v-bind('UseTheme.theme.var.markerColor');
        }
      }
    }

    .Slider-box {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      position: relative;
      border: 1px solid;
      border-color: v-bind('UseTheme.theme.var.borderColor');
      overflow: hidden;
      cursor: pointer;

      span {
        position: absolute;
        display: block;
        bottom: 0;
        width: 100%;
        background-color: v-bind('UseTheme.theme.LevelPillar.levelColor');
      }
    }

    .resetButton {
      width: 100%;
      height: 33px;
      color: aliceblue;
      position: absolute;
      bottom: -33px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      font-size: 20px;
    }
  }

  .Slider-Footer {
    min-height: 32px;
  }

}
</style>
 