<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-17 13:28:22
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-21 17:26:41
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXIInput\index.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  inheritAttrs: false,
  name: 'ZXIInput'
}
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, PropType, StyleValue, useAttrs } from 'vue';
import { Keyboard } from '../ZXIKeyBoard'
import { Listen } from '../core';
import { UseTheme } from '../styles'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  /** 
   * @description: 允许的最大值
   */
  max: { type: Number },
  /** 
   * @description: 允许的最小值
   */
  min: { type: Number },
  /** 
   * @description: 虚拟键盘打开是否设置input的值
   */  
  setInput: { default: false },
  name: { type: String },
  unit: { type: String },
  class: { type: String },
  style: { type: [Object, String, Array] as PropType<StyleValue | undefined> }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: string): void
  (e: 'change', result: string): void
}>()

const attrs = useAttrs()

const currentValue = computed({
  set: (v) => {
    emit('update:modelValue', v.toString())
  },
  get: () => props.modelValue
})

Keyboard.init()


function inputClick(e: PointerEvent | MouseEvent) {
  if (attrs.disabled) return
  
  if (Keyboard.instance) {

    Keyboard.confirm = function (v) {
      currentValue.value = v
      emit('change', v)
    }

    Keyboard.validFn = function (v: string) {
      if (props.max !== undefined && Number(v) > props.max) {
        ElMessage.error(`输入值不可大于${props.max}${props.unit ?? ''}`)
        return false
      }
      if (props.min !== undefined && Number(v) < props.min) {
        ElMessage.error(`输入值不可小于于${props.min}${props.unit ?? ''}`)
        return false
      }

      return true
    }

    const inputValue = props.setInput ? currentValue.value.toString() : ''
    const type = 'pointerType' in e ?
      (e.pointerType === 'mouse' ? Listen.MOUSE : Listen.TOUCH)
      : ('touches' in e ? Listen.TOUCH : Listen.MOUSE)
    Keyboard.open(e, type, inputValue, props.unit)
  }
}


</script>

<template>
  <div :class="class" :style="style">
    <div class="container" @click="inputClick">
      <!-- 禁用遮罩 -->
      <span class="marker" :style="$attrs.disabled ? { opacity: 1 } : { opacity: 0 }" />
      <!-- 名称 -->
      <div class="name" v-if="name">{{ name }}</div>
      <el-input class="zxi-input" v-model="currentValue" v-bind="$attrs">
        <template #suffix>
          <slot name="suffix" />
        </template>
        <template #prefix>
          <slot name="prefix" />
        </template>
      </el-input>
      <!-- 单位 -->
      <div class="unit" v-if="unit">{{ unit }}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme.less');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  padding: 0 1.5rem;
  background-color: v-bind('UseTheme.theme.var.btnBgColor');
  box-sizing: border-box;
  align-items: center;
  position: relative;
  .marker{
    .marker-disabled();
  }
  :deep(.zxi-input){
    width: 0px;
    flex: auto;
    .el-input__wrapper{
      box-sizing: border-box;
      border: none;
      box-shadow: none;
      font-size: @fontSize;
      border-radius: 0;
      background-color: v-bind('UseTheme.theme.var.btnBgColor');
      .el-input__inner{
        text-align: end;
        color: v-bind('UseTheme.theme.var.color');
      }
    }
  }
  .unit {
    color: v-bind('UseTheme.theme.var.color');
    font-size: @fontSize;
  }
  .name{
    color: v-bind('UseTheme.theme.var.color');
    font-size: calc(@fontSize * 0.7);
  }
}
</style>