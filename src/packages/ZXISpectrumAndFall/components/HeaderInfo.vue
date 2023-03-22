<!--
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:54
 * @LastEditTime: 2023-02-02 13:50:37
 * @Description: 
 * 
-->

<script setup lang="ts">
import { computed, PropType, ref, watch } from 'vue'
import * as Helper from '../../helper/index'
import { EAxisXType, ISpectrumParams } from '../../types'
import { UseTheme } from '../../styles'

const props = defineProps({
  params: {
    type: Object as PropType<ISpectrumParams>,
    default: () => {
      return {
        begin: 0,
        end: 0
      }
    },
    required: true
  },
  // MHz
  step: { type: Number, default: 0 },
  xScaleType: { type: Number as PropType<EAxisXType>, default: EAxisXType.symmetry }
})

const leftValue = ref('')

const dataStep = computed(() => {
  const step = Number(props.step)
  return Helper.Device.unitFormatChangeForStep(step)
})

function getDataLeftLists () {
  if (props.xScaleType === EAxisXType.symmetry) {
    if (props.params.bandwidth !== undefined) { 
      const center = props.params.begin + props.params.bandwidth / 2
      leftValue.value = `中心频率：${parseFloat(center.toFixed(6))}MHz 带宽：${props.params.bandwidth * 1000}kHz 分辨率：${dataStep.value}`
    } else {
      console.warn('请配置params.bandwidth')
    }
  } else {
    leftValue.value = `开始频率：${props.params.begin}MHz 结束频率：${props.params.end}MHz 分辨率：${dataStep.value}`
  }
}


watch(() => props.params, getDataLeftLists, { immediate: true, deep: true })

watch(dataStep, getDataLeftLists)
</script>

<template>
  <div>
    <p class="runstate-container">{{leftValue}}</p>
  </div>
</template>

<style scoped lang="less">
.runstate-container{
  height: 25px;
  color: v-bind('UseTheme.theme.var.color');
  box-sizing: border-box;
  font-size: 12px;
  overflow: hidden;
  line-height: 25px;
  margin: 0;
}
</style>