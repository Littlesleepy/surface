<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-21 13:27:30
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-21 17:29:17
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISwitch\index.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  inheritAttrs: false,
  name: 'ZXISwitch'
}
</script>

<script setup lang="ts">
import { PropType, StyleValue, computed } from 'vue';
import { UseTheme } from '../styles'

const props = defineProps({
  name: { type: String },
  modelValue: {
    type: Boolean,
    default: false
  },
  class: { type: String },
  style: { type: [Object, String, Array] as PropType<StyleValue | undefined> }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: boolean): void
  (e: 'change', result: boolean): void
}>()

const currentValue = computed({
  set: (v) => {
    emit('update:modelValue', v)
    emit('change', v)
  },
  get: () => props.modelValue
})

function handleClick () {
  currentValue.value = !currentValue.value
}

</script>

<template>
  <div :class="class" :style="style">
    <div class="container" @click="() => { if (!$attrs.disabled) handleClick() }">
      <!-- 禁用遮罩 -->
      <span class="marker" :style="$attrs.disabled ? { opacity: 1 } : { opacity: 0 }" />
      <!-- 名称 -->
      <div class="name" v-if="name">{{ name }}</div>
      <el-switch class="zxi-switch" v-model="currentValue" v-bind="$attrs" />
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
  align-items: center;
  box-sizing: border-box;
  position: relative;
  .marker{
    .marker-disabled();
  }
  :deep(.zxi-switch) {
    pointer-events: none;
    .el-switch__core{
      border-radius: 0;
      .el-switch__action{
        border-radius: 0;
      }
    }
    .el-switch__label{
      color: v-bind('UseTheme.theme.var.color');
    }
  }
  :deep(.el-switch--large .el-switch__label *){
    font-size: 20px!important;
  }
  .name{
    padding-right: 11px;
    color: v-bind('UseTheme.theme.var.color');
    font-size: calc(@fontSize * 0.7);
  }
}
</style>