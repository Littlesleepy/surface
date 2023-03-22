<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-01 09:49:23
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-01 11:35:16
 * @FilePath: \zxi-deviced:\Zzy\project\mcharts\packages\ZXISwitchButton\index.vue
 * @Description: 按钮式开关
 -->
<script setup lang="ts">
import { computed } from 'vue'
import { UseTheme } from '../styles'

const props = defineProps({
  modelValue: { default: false }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: boolean): void
}>()

const status = computed({
  get: () => props.modelValue,
  set: (v) => {
    emit('update:modelValue', v)
  }
})

const backgroundColor = computed(() => status.value ? UseTheme.theme.SwitchButton.selectColor : UseTheme.theme.SwitchButton.backgroundColor)

function handleClick () {
  status.value = !status.value
}

</script>

<template>
  <div class="container" @click="handleClick">
    <slot />
  </div>
</template>

<style scoped lang="less">
.container{
  background-color: v-bind('backgroundColor');
  color: v-bind('UseTheme.theme.var.color');
}
</style>