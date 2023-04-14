<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-22 13:23:55
 * @Description: 滚动显示信息组件
 * 
-->

<script setup lang="ts">
import { watch, ref, PropType, CSSProperties, StyleValue } from 'vue'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: { type: Array as PropType<Array<{ style?: CSSProperties, message: string } | string>>, default: () => { return [] } },
  maxCount: { type: Number, default: 50 },
  color: { default: UseTheme.theme.var.textInfoColor },
  clear: { type: Boolean, default: false },
  goBottom: { type: Boolean, default: true },
  scrollbar: {
    type: Object as PropType<{ fade: boolean, interactive: boolean }>,
    default: () => { return { fade: true, interactive: true } }
  },
  preventDefault: { type: Boolean, default: false },
  scrollWrapperStyle: {
    type: [Object, String, Array] as PropType<StyleValue | undefined>
  },
  wrapperStyle: {
    type: [Object, String, Array] as PropType<StyleValue | undefined>
  },
  mouseWheel: { type: Boolean, default: true },
  name: { type: String }
})

const root = ref<HTMLDivElement>()

const dataLists = ref<Array<{ style: CSSProperties, message: string }>>([])

watch(() => props.inputData, () => {
  const len = props.inputData.length
  props.inputData.forEach(x => {
    const obj: { style: CSSProperties, message: string } = { style: {}, message: '' }
    if (typeof x === 'string') {
      obj.message = x
    } else {
      if (x.style) obj.style = x.style
      obj.message = x.message
    }
    dataLists.value.push(obj)
    if (dataLists.value.length / len > props.maxCount) {
      dataLists.value.shift()
    }
  })
})

watch(() => props.clear, () => {
  if (props.clear) dataLists.value = []
})

defineExpose({
  root,
  dataLists
})
</script>

<template>
  <div ref="root">
    <div class="wrapper">
      <div class="header">
        <p v-if="name">{{ name }}</p>
        <div class="slot">
          <slot />
        </div>
      </div>
      <div class="scroll-content" :style="wrapperStyle">
        <ZXIScroll
          class="base-scroll"
          :goBottom="goBottom"
          :scrollbar="scrollbar"
          :wrapperStyle="scrollWrapperStyle"
          :preventDefault="preventDefault"
          :mouseWheel="mouseWheel">
          <div class="text">
            <pre v-for="(item, index) in dataLists" :key="index" :style="item.style">{{ item.message }}</pre>
          </div>
        </ZXIScroll>
      </div>
      
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.wrapper{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .header{
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    >p{
      color: v-bind('UseTheme.theme.var.color');
      font-size: @font20;
      background-color: v-bind('UseTheme.theme.var.backgroundColor');
      padding: 0 10px;
    }
    .slot{
      height: 100%;
      flex: auto;
    }
  }
  .scroll-content{
    flex: auto;
    padding: 0 5px 5px 5px;
    box-sizing: border-box;
    .base-scroll{
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      .text{
        width: 100%;
        color: v-bind(color);
        pre{
          padding: 5px 10px;
          letter-spacing: 2px;
          font-size: @font20;;
          box-sizing: border-box;
          width: 100%;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
      }
    }
  }
}
</style>