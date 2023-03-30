<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-03-21 13:55:51
 * @Description: 图像控制按钮
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, CSSProperties, WatchStopHandle, watch } from 'vue'
import { IBtncontrols, EBtncontrolType } from './type'
import { ElForm, ElFormItem, ElSwitch, ElRadio, ElTooltip, ElInputNumber, Effect } from 'element-plus'
import { Listen } from '../core'
import { UseTheme } from '../styles'

interface IZXIControlBtnProps {
  controls?: Array<IBtncontrols>
  btnValues?: Record<string, any>
  controlStyle?: { wrapper?: CSSProperties, item?: CSSProperties }
  appContainer?: string
}

const props = withDefaults(defineProps<IZXIControlBtnProps>(), {
  controls: () => [],
  btnValues: () => { return {} },
  controlStyle: () => {
    return {
      wrapper: {},
      item: {}
    }
  },
  appContainer: 'app'
})

const root = ref<HTMLDivElement>()

const showForm = ref(false)

const selectsReal = computed(() => props.controls)

const control = ref<HTMLDivElement>()

function hidden (e: MouseEvent | TouchEvent) {
  // 必须来自#app内部
  const paths = e.composedPath()
  const rootEl = document.getElementById(props.appContainer)
  let fromApp = false
  paths.forEach(item => {
    if (item === rootEl) fromApp = true
  })

  if (e.target !== control.value && fromApp) showForm.value = false
}

function click () {
  showForm.value = !showForm.value
}

function mouseleave () {
  showForm.value = false
}

window.addEventListener(Listen.MOUSEDOWN, hidden)
window.addEventListener(Listen.TOUCHSTART, hidden)

const stopWatch: Array<WatchStopHandle> = []

props.controls.forEach(item => {
  if (item.repelName) {
    stopWatch.push(watch(() => props.btnValues[item.paramName], (v) => {
      if (v) {
        item.repelName!.forEach(name => {
          props.btnValues[name] = false
        })
      }
    }, { immediate: true }))
  }
})

// 瀑布图保存加倍
const fallSaveOptions = [{ label: '1倍', value: 1 }, { label: '2倍', value: 2 }, { label: '3倍', value: 3 }, { label: '4倍', value: 4 }, { label: '5倍', value: 5 }]

onBeforeUnmount(() => {
  stopWatch.forEach(stop => stop())
  window.removeEventListener(Listen.MOUSEDOWN, hidden)
  window.removeEventListener(Listen.TOUCHSTART, hidden)
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="container" @click.self="click">
      <i
        ref="control"
        @click="click"
        class="iconfont icon-shezhi-" />
      <div
        class="form-wrapper"
        @mouseleave="mouseleave"
        @mousedown.stop
        @touchstart.stop
        v-show="showForm"
        ref="form">
        <el-form
          :model="btnValues"
          label-width="0px"
          :style="controlStyle.wrapper ? controlStyle.wrapper : {}">
          <el-form-item
            v-for="item in selectsReal"
            :key="item.paramName"
            :prop="item.paramName"
            :style="controlStyle.item ? controlStyle.item : {}">
            <ZXISwitch
              v-if="item.type === EBtncontrolType.switch"
              v-model="btnValues[item.paramName]"
              :style="item.activeColor ? `--el-switch-on-color: ${item.activeColor}` : ''"
              :active-text="item.title" />
            <el-radio
              v-if="item.type === EBtncontrolType.radio"
              v-model="btnValues.radioValue"
              :label="item.value"
              border>
                {{ item.title }}
              </el-radio>
          </el-form-item>
          <el-tooltip :effect="Effect.DARK" :disabled="!btnValues.pubutu" content="瀑布图保存加倍" placement="top">
            <el-form-item prop="pubutusave" :style="controlStyle.item ? controlStyle.item : {}">
              <ZXISelect
                v-show="btnValues.pubutu"
                v-model="btnValues.pubutusave">
                <el-option
                  v-for="(select, i) in fallSaveOptions"
                  :key="i"
                  :label="select.label"
                  :value="select.value" />
              </ZXISelect>
            </el-form-item>
          </el-tooltip>
        </el-form>
        <div>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.container{
  cursor: pointer;
  position: relative;
  background-color: rgb(44, 44, 44);
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0.3rem 0;
  .icon-shezhi-{
    margin: auto;
    color: @color;
    font-size: 3.4rem;
    font-weight: 600;
  }
  .form-wrapper{
    position: absolute;
    top: 0;
    left: calc(100% + 10px);
    display: flex;
    flex-direction: column;
    padding: 1rem;
    // background-color: v-bind('UseTheme.theme.var.tipBgColor');
    background-color: var(--el-bg-color);
    box-shadow: var(--el-box-shadow);
    border-radius: var(--el-border-radius-small);
    :deep(.el-form){
      flex: auto;
      display: flex;
      flex-wrap: wrap;
      box-sizing: border-box;
      >div{
        margin: 5px;
        >div{
          line-height: 3rem!important;
        }
      }
    }
  }
}
</style>