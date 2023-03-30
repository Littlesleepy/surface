<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-24 14:36:55
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXITabs\index.vue
 * @Description: 
 -->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, RendererElement, RendererNode, useSlots, VNode, watch } from 'vue'
import { UseTheme } from '../styles'
interface Item {
  id: number
  tabName: string
  style: any
}

const props = defineProps({
  modelValue: { type: Number },
  wrapperStyle: { type: Object },
  contentStyle: {
    type: Object,
    default: () => { return { backgroundColor: 'rgb(255, 255, 255)' } }
  },
  hidHeader: { default: false }
})

const emit = defineEmits<{
  (e: 'tabClick', result: number): void
  (e: 'update:modelValue', result: number): void
}>()

const slots = useSlots()

const headerText = ref<Array<Item>>([])

const slotWrapper = ref<HTMLDivElement>()

const currentTab = computed({
  get: () => props.modelValue,
  set: (v) => {
    if (v !== undefined) emit('update:modelValue', v)
  }
})

let current: number | undefined = props.modelValue

let Slots: VNode<RendererNode, RendererElement, { [key: string]: any }>[]
if (slots.default) {
  Slots = slots.default()
}

let childs: any

function getHeaderText () {
  if (Slots === undefined) return
  const arr: Array<Item> = []
  const length = Slots.length
  const colors = UseTheme.theme.Tabs

  Slots.forEach((x: any, i: number) => {
    // 统一设置样式
    childs[i].style.position = 'absolute'
    childs[i].style.top = '0px'
    childs[i].style.left = '0px'
    childs[i].style.width = '100%'
    childs[i].style.height = '100%'
    // 构造个别样式
    const obj = { id: i, tabName: x.props.tabName, style: {} }
    if (i === 0) {
      obj.style = {
        backgroundColor: colors.selectBgColor,
        color: colors.selectColor,
        borderBottomColor: colors.selectBgColor,
        borderLeft: '1px solid rgba(0, 0, 0, 0)',
        borderRight: `1px solid ${colors.borderColor}`
      }
      childs[i].style.zIndex = `${length}`
    } else {
      obj.style = {
        backgroundColor: colors.notSelectBgColor,
        color: colors.notSelectColor,
        borderLeft: '1px solid rgba(0, 0, 0, 0)',
        borderRight: '1px solid rgb(0, 0, 0, 0)'
      }
      childs[i].style.zIndex = `${i}`
    }
    arr.push(obj)
  })
  arr.push({
    id: Slots.length,
    tabName: '',
    style: {}
  })
  headerText.value = arr

  if (arr.length > 0 && currentTab.value === undefined) {
    currentTab.value = arr[0].id
    current = arr[0].id
  }
}

// 内容切换
function contentChange (id: number) {
  if (Slots === undefined) return
  if (id === headerText.value.length - 1) return
  const colors = UseTheme.theme.Tabs
  headerText.value.forEach((x: any, i: number) => {
    if (x.id !== headerText.value.length - 1) {
      if (x.id === id) {
        x.style.backgroundColor = colors.selectBgColor
        x.style.color = colors.selectColor
        x.style.borderBottomColor = colors.selectBgColor
        x.style.borderRight = `1px solid ${colors.borderColor}`
        if (id !== 0) {
          x.style.borderLeft = `1px solid ${colors.borderColor}`
        }
        childs[i].style.zIndex = `${headerText.value.length}`
      }
      if (x.id !== id && x.style.backgroundColor === colors.selectBgColor) {
        x.style.backgroundColor = colors.notSelectBgColor
        x.style.color = colors.notSelectColor
        x.style.borderBottomColor = colors.borderColor
        x.style.borderRight = '1px solid rgba(0, 0, 0, 0)'
        x.style.borderLeft = '1px solid rgba(0, 0, 0, 0)'
        childs[i].style.zIndex = `${i}`
      }
    }
  })
  emit('tabClick', id)
  currentTab.value = id
  current = id
}

watch(currentTab, (v) => {
  if (v !== undefined) contentChange(v)
})

onMounted(() => {
  childs = slotWrapper.value!.children
  getHeaderText()
  if (current !== undefined) contentChange(current)
})

const themeKey = UseTheme.on(() => {
  if (current !== undefined) contentChange(current)
})

onBeforeUnmount(() => {
  UseTheme.off(themeKey)
})
</script>

<template>
  <div>
    <div class="base-tabs-container" :style="wrapperStyle">
      <ul class="tabs-header" v-show="!hidHeader">
        <li
          v-for="item in headerText"
          :key="item.id"
          :style="item.style"
          @click="contentChange(item.id)">
          {{item.tabName}}
        </li>
      </ul>
      <div class="base-content" :style="contentStyle">
        <div class="base-content-wrapper" ref="slotWrapper">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url("../assets/styles/theme.less");
.base-tabs-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid v-bind('UseTheme.theme.Tabs.borderColor');
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .12), 0 0 6px 0 rgba(0, 0, 0, .04);
  .tabs-header{
    width: 100%;
    height: 45px;
    display: flex;
    justify-content: flex-start;
    background-color: v-bind('UseTheme.theme.Tabs.notSelectBgColor');
    >li{
      box-sizing: border-box;
      padding: 10px 15px 10px 15px;
      font-size: @font20;
      border-bottom: 1px solid v-bind('UseTheme.theme.Tabs.borderColor');
      cursor: pointer;
      transition: all 0.3s cubic-bezier(.645, .045, .355, 1);
    }
    >li:last-child{
      flex: 1;
    }
  }
  .base-content{
    width: 100%;
    box-sizing: border-box;
    flex: auto;
    .base-content-wrapper{
      width: 100%;
      height: 100%;
      position: relative;
    }
  }
}
</style>