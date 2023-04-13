<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-20 11:12:16
 * @Description: 信号标记组件
 * 
-->

<script setup lang="ts">
import { onMounted, PropType, ref, computed, onBeforeUnmount, watchEffect } from 'vue'
import { IAxisYValue, ISpectrumInputData } from '../types'
import { ITargetIcon } from './type'
import TargetIcon from '../assets/imgs/TargetIcon.png'
import { isLayersFenceType, Scene } from '../core'
import { UseTheme } from '../styles'

const props = defineProps({
  axisYValue: {
    type: Object as PropType<IAxisYValue>,
    default: () => { return { max: 90, min: -20 } }
  },
  icons: {
    type: Array as PropType<Array<ITargetIcon>>,
    default: () => []
  },
  step: { type: Number, default: 0 },
  usingData: {
    type: Object as PropType<Float32Array>,
    default: new Float32Array()
  },
  scene: {
    type: Object as PropType<Scene>
  },
  showText: {
    default: true
  }
})

const root = ref<HTMLDivElement>()

const iconsWrapper = ref<any>()

const watchSize = new ResizeObserver(() => {
  setPosition()
})

const iconLists = ref<Array<{ imgUrl: string, message: string, style: any }>>([])

const axisYRange = computed(() => {
  return props.axisYValue.max - props.axisYValue.min
})

watchEffect(() => {
  setPosition()
})

function setPosition () {
  if (props.icons.length === 0 || iconsWrapper.value === undefined ||
    iconsWrapper.value.clientWidth === 0 || props.usingData.length === 0 || props.scene === undefined) {
    iconLists.value = []
    return
  }
  
  const fence = props.scene.fence
  if (fence) {
    const resultArr: Array<{ style: any, message: string, imgUrl: string }> = []
    for (let i = 0, len = props.icons.length; i < len; i++) {
      const item = props.icons[i]
      let dsIndex
      // 判断是否在屏幕内
      if (item.dataIndex <  fence.cutDataStartIndex || item.dataIndex > fence.cutDataStartIndex + fence.cutDataLength) continue

      if (isLayersFenceType(fence)) {
        // 根据不同缩放等级计算
        if (fence.sampling) {
          dsIndex = (item.dataIndex - fence.cutDataStartIndex + 1) / fence.cutDataLength
        } else {
          const fenceIndex = item.dataIndex - fence.cutDataStartIndex + fence.baseFence.visibleIndex.min
          dsIndex = ((fence.baseFence.pieces[fenceIndex] + 1) / 2)
        }
      } else {
        dsIndex = ((fence.baseFence.pieces[item.dataIndex] + 1) / 2)
      }

      //构造标记
      const li: any = {}
      li.message = 'message' in item ? item.message : ''

      // 设置样式
      let peakWidth = 410
      li.style = { width: '410px', color: UseTheme.theme.Icons.color }
      if ('style' in item) {
        if ('width' in item.style!) {
          li.style.width = item.style.width + 'px'
          peakWidth = item.style.width!
        } 
        if ('color' in item.style!) li.style.color = item.style.color
      }
      const dy = iconsWrapper.value.clientHeight * (props.usingData[item.dataIndex] - props.axisYValue.min) / axisYRange.value
      const dx = dsIndex * iconsWrapper.value.clientWidth - peakWidth / 2
      li.style.left = dx + 'px'
      li.style.bottom = dy + 1 + 'px'

      li.imgUrl = 'imgUrl' in item ? item.imgUrl : TargetIcon

      resultArr.push(li)
    }
    iconLists.value = resultArr
  } 
}

onMounted(() => {
  watchSize.observe(iconsWrapper.value!)
})

onBeforeUnmount(() => {
  watchSize.unobserve(iconsWrapper.value!)
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <ul class="target-icon-container" ref="iconsWrapper">
      <li v-for="(item, i) in iconLists" :key="i" :style="item.style">
        <pre v-show="showText">{{ item.message }}</pre>
        <img :src="item.imgUrl">
      </li>
    </ul>
  </div>
</template>

<style scoped lang="less">
@import url("../assets/styles/theme.less");
.target-icon-container{
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  li{
    position: absolute;
    display: flex;
    flex-direction: column;
    pre{
      font-size: @font20;
      margin: 0;
      text-align: center;
    }
    img{
      max-width: 210px;
      margin: 0 auto;
    }
  }
}
</style>