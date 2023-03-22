<!--
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:54
 * @LastEditTime: 2023-02-02 15:55:58
 * @Description: 
 * 
-->

<script setup lang="ts">
import { PropType, ref, watchEffect } from 'vue'
import { LayersFenceType, Scene } from '../../core'
import { UseTheme } from '../../styles'

const props = defineProps({
  index: { type: Number, default: 0, required: true },
  scene: {
    type: Object as PropType<Scene>
  }
})

const iconDom = ref<HTMLSpanElement>()

const wrapper = ref<HTMLDivElement>()

watchEffect(() => {
  let left = 0
  if (iconDom.value && wrapper.value) {
    if (props.scene && props.scene.fence) {
      const fence = props.scene.fence as LayersFenceType

      const ds = 7 / wrapper.value.clientWidth

      const dsCount = props.index - fence.cutDataStartIndex

      if (fence.sampling) {
        left = (dsCount / fence.cutDataLength - ds) * 100
      } else {
        const fenceIndex = dsCount + fence.baseFence.visibleIndex.min

        if (fenceIndex > fence.baseFence.visibleIndex.max || fenceIndex < fence.baseFence.visibleIndex.min) {
          left = 101
        } else {
          left = (fence.baseFence.getFenceMiddlePositionByFenceIndex(fenceIndex) - ds) * 100
        }
      }
    }

    if (left < 0 || left > 100) {
      iconDom.value.style.display = 'none'
    } else {
      iconDom.value.style.display = 'block'
      iconDom.value.style.left = left + '%'
    }
  }
})
</script>

<template>
  <div>
    <div class="scan-pointer-container" ref="wrapper">
      <span ref="iconDom"><i class="iconfont icon-sanjiaoxing" /></span>
    </div>
  </div>
</template>

<style scoped lang="less">
.scan-pointer-container{
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  >span{
    position: absolute;
    top: 0;
    i{
      color: v-bind('UseTheme.theme.var.color');
      font-size: 14px;
    }
  }
}
</style>