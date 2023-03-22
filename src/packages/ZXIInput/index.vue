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
import { computed } from 'vue';
import { Keyboard } from '../ZXIkeyboard'

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
  unit: { type: String }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: string): void
  (e: 'change', result: string): void
}>()


const currentValue = computed({
  set: (v) => {
    emit('update:modelValue', v.toString())
  },
  get: () => props.modelValue
})

Keyboard.init()


function inputClick (e: MouseEvent) {
  if (Keyboard.instance) {

    Keyboard.confirm = function (v) {
      currentValue.value = v
      emit('change', v)
    }

    Keyboard.validFn = function (v: string) {
      if (props.max !== undefined && Number(v) > props.max) {
        ElMessage.error(`输入值不可大于${props.max}`)
        return false
      }
      if (props.min !== undefined && Number(v) < props.min) {
        ElMessage.error(`输入值不可小于于${props.min}`)
        return false
      }

      return true
    }

    const inputValue = props.setInput ? currentValue.value.toString() : ''
    
    Keyboard.open(e, 'mouse', inputValue)
  }
}


</script>

<template>
  <div class="container" @click="inputClick">
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
</template>

<style scoped lang="less">
@import url('../assets/styles/them.less');
.container{
  width: 100%;
  display: flex;
  padding: 0 10px;
  background-color: @btnBgColor;
  box-sizing: border-box;
  :deep(.zxi-input){
    width: 0px;
    flex: auto;
    .el-input__wrapper{
      box-sizing: border-box;
      border: none;
      box-shadow: none;
      font-size: @fontSize;
      .el-input__inner{
        text-align: end;
      }
    }
  }
  .unit {
    color: @color;
    font-size: @fontSize;
  }
  .name{
    color: @color;
  }
}
</style>