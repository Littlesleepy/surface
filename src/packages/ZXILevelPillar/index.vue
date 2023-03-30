<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-07 13:43:51
 * @Description: 瞬时电平柱状图
 * 
-->

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ESwitchState } from '../types'
import { UseTheme } from '../styles';

interface IZXILevelPillarProps {
  inputData: number
  switchLever: ESwitchState
}

const props = withDefaults(defineProps<IZXILevelPillarProps>(), {
  switchLever: ESwitchState.off
})

const root = ref<HTMLDivElement>()

const span = ref<HTMLSpanElement>()

const maxValue = ref(-100)

watch(() => props.inputData, (data) => {
  maxValue.value = Math.max(maxValue.value, data)
  // 绿色柱子
  if (span.value) {
    span.value!.style.height = data / maxValue.value * 100 + '%'
  }
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    maxValue.value = -100
  }
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="container">
      <p>ML:<span>{{maxValue.toFixed(2)}}</span></p>
      <div><span ref="span" /></div>
      <p>NL:<span>{{inputData.toFixed(2)}}</span></p>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.container{
  width: 70px;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 1;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  box-sizing: border-box;
  >p{
    text-align: center;
    color: v-bind('UseTheme.theme.var.color');
    font-size: 12px;
    line-height: 25px;
    >span{
      display: inline-block;
    }
  }
  >div:nth-child(2){
    flex: auto;
    width: 10px;
    margin: auto;
    background-color: v-bind('UseTheme.theme.LevelPillar.backgroundColor');
    position: relative;
    border-radius: 15px;
    >span{
      position: absolute;
      display: block;
      width: 100%;
      background-color: v-bind('UseTheme.theme.LevelPillar.levelColor');
      z-index: 10;
      bottom: 0;
      border-radius: 15px;
    }
  }
}
</style>