<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-21 10:43:58
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 17:11:47
 * @FilePath: \zxi-device\src\views\CIQStream\components\TimeDomain.vue
 * @Description: 
 -->

<script setup lang="ts">
import { effectScope, PropType, ref, watch, onBeforeUnmount } from 'vue'
import { ESwitchState, Fence, IAxisXValue, ILineData, IPositionResult, ClampForce, ISampleLinesPool, Scene, Threshold, UseTheme, Listen } from 'mcharts/index'
import { ElMessage } from 'element-plus';

const props = defineProps({
  inputData: {
    type: Map as PropType<Map<string, ILineData>>,
    default: () => new Map()
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  },
  defaultValueX: {
    type: Object as PropType<IAxisXValue>,
    default: () => {
      return { max: 90, min: -10 }
    }
  },
  name: { default: '' }
})

const emit = defineEmits<{
  (e: 'result', result: { end: number, begin: number } | undefined): void
}>()

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

const scaleY = {
  unit: 'dBuV',
  parse: (v: number) => {
    return `幅度：${v.toFixed(1)}dBuV`
  },
  transform: (v: number) => {
    return parseFloat(v.toFixed(1))
  }
}

const openClampForce = ref(false)

const scoped = effectScope()

let currentPositions: Map<string, IPositionResult> | undefined

let _scene: Scene<ISampleLinesPool>

let clampForce: ClampForce | undefined

function getScene(scene: Scene<ISampleLinesPool>) {
  _scene = scene

  // 时域截取工具
  clampForce = new ClampForce(scene.container, {
    scene: scene,
    direction: Fence.TRANSVERSE,
    sectionThreshold: {
      openInit: true,
      traceByFence: true,
      tag0: {
        offset: 0.45
      },
      tag1: {
        offset: 0.55
      },
      infoTag: {
        width: 500
      }
    },
    allThreshold: {
      show: false
    }
  })

  // 加重置按钮
  const resetButton = document.createElement('i')
  resetButton.classList.add(...['iconfont', 'icon-shuaxin'])
  resetButton.style.cssText = `
    position: absolute;
    display: block;
    cursor: pointer;
    font-size: 40px;
    top: 60px;
    right: 10px;
    zIndex: 100;
    color: ${UseTheme.theme.var.color};
  `
  clampForce.wrapper.appendChild(resetButton)

  resetButton.addEventListener(Listen.CLICK, () => {
    if (clampForce?.sectionThreshold) {
      clampForce.sectionThreshold.threshold.init(true)
      currentPositions = undefined
      ElMessage.success('重置')
    }
  })

  resetButton.addEventListener(Listen.TOUCHSTART, () => {
    if (clampForce?.sectionThreshold) {
      clampForce.sectionThreshold.threshold.init(true)
      currentPositions = undefined
      ElMessage.success('重置')
    }
  })

  clampForce.afterClose.set('timeDomain', () => {
    openClampForce.value = false

    currentPositions = undefined

    emit('result', undefined)
  })

  scene.disposeManager.add(() => { clampForce!.dispose() })

  if (clampForce.sectionThreshold) {
    const threshold = clampForce.sectionThreshold.threshold

    threshold.afterEnd.set('timeDomain', (positions) => {
      clampForceSection(positions, false)
      currentPositions = positions
      threshold.infoTag!.append()
    })

    threshold.afterTrigger.set('timeDomain', (positions) => {
      clampForceSection(positions, false)
      threshold.infoTag!.remove()
    })
    
    threshold.infoTag!.remove()
  }

  scoped.run(() => {
    watch(openClampForce, (btn) => {
      if (btn) {
        biaozhu.value = false
        clampForce!.open()
        clampForce!.sectionThreshold!.threshold.infoTag!.remove()
      } else {
        clampForce!.close()
      }
    })
  })
}

/**
   * @description: 计算局部夹取工具信息
   */
function clampForceSection(positions: Map<string, IPositionResult>, back = true) {
  if (props.inputData.size > 0 && _scene && clampForce) {
    const pool = _scene.pool!
    // 计算范围
    const leftP = positions.get(Threshold.LEFT)!
    const rightP = positions.get(Threshold.RIGHT)!

    const fence = _scene.fence!

    const leftIndex = fence.getDataIndexByDistance(leftP.offsetMiddlePCTX)
    const rightIndex = fence.getDataIndexByDistance(rightP.offsetMiddlePCTX)

    const beginIndex = Math.min(leftIndex, rightIndex)
    const endIndex = Math.max(leftIndex, rightIndex)

    if (back) {
      emit('result', { end: endIndex, begin: beginIndex })
    }
    const result = new Map<string, { info: string }>()

    const start = parseFloat((pool.step * beginIndex).toFixed(6))
    result.set('0', {
      info: `开始时间：${start}ms | ${parseFloat((start * 1000).toFixed(3))}us`
    })

    const end = parseFloat((pool.step * endIndex).toFixed(6))
    result.set('1', {
      info: `结束时间：${end}ms | ${parseFloat((end * 1000).toFixed(3))}us`
    })

    const dsTime = parseFloat((end - start).toFixed(6))
    result.set('2', {
      info: `时差：${dsTime}ms | ${parseFloat((dsTime * 1000).toFixed(3))}us`
    })

    result.set('3', {
      info: `总点数：${endIndex - beginIndex + 1}个`
    })

    clampForce.sectionThreshold!.threshold.setContent(result)
  }
}

const biaozhu = ref(false)

watch(biaozhu, (v) => {
  if (v) openClampForce.value = false
})

function start() {
  if (currentPositions) {
    clampForceSection(currentPositions)
    clampForce!.sectionThreshold!.threshold.infoTag!.remove()
  } else {
    ElMessage.warning('请先选取时域数据')
  }
}

onBeforeUnmount(() => {
  scoped.stop()
})

</script>

<template>
  <ZXISampleTimeLines
    class="container"
    :name="name"
    v-model:biaozhu="biaozhu"
    :inputData="inputData"
    :switchLever="switchLever"
    :defaultValueX="defaultValueX"
    :capacity="0.1"
    :scaleX="scaleX"
    :scaleY="scaleY"
    :toolTip="{
      width: 460
    }"
    @scene="getScene">
    <div class="control">
      <ZXISwitch name="时域选取" v-model="openClampForce" />
      <BaseButton style="margin-left: 5px;" @click="start">开始分析</BaseButton>
      <ZXISwitch class="biaozhu" name="标注" v-model="biaozhu" />
      <div class="slot">
        <slot />
      </div>
    </div>
  </ZXISampleTimeLines>
</template>

<style scoped lang="less">
@import url('theme');
.control{
  padding-left: 5px;
  display: flex;
  width: 100%;
  .biaozhu{
    padding-left: @btnSpace;
  }
  .slot{
    flex: auto;
  }
}
.container{
  width: 100%;
  height: 100%;
}
</style>