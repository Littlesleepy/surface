<script lang="ts">
export default {
  name: 'BaseButton'
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  selected: { default: false },
  selectColor: {
    default: 'var(--el-button-hover-bg-color)'
  }
})

const selectStyle = computed(() => {
  return props.selected ? { backgroundColor: props.selectColor } : {}
})
</script>

<template>
  <el-button class="zxi-button" color="rgb(44, 44, 44)" :style="selectStyle">
    <template #default>
      <slot />
    </template>
  </el-button>
</template>

<style scoped lang="less">
@import url('theme');
.zxi-button{
  box-sizing: border-box;
  border-radius: 0!important;
  border: none;
  padding: 1rem!important;
  -webkit-app-region: no-drag;
  height: auto;
}
.el-button+.el-button {
  margin-left: 0;
}
</style>