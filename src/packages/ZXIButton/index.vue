<script lang="ts">
export default {
  name: 'ZXIButton'
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { UseTheme } from '../styles'

const props = defineProps({
  selected: { default: false },
  selectColor: {
    default: UseTheme.theme.var.btnBgSelectedColor
  }
})

const selectStyle = computed(() => {
  return props.selected ? { backgroundColor: props.selectColor } : {}
})

const buttonColor = ref(UseTheme.theme.var.btnBgColor)

const themeKey = UseTheme.on(() => {
  buttonColor.value = UseTheme.theme.var.btnBgColor
})

onBeforeUnmount(() => {
  UseTheme.off(themeKey)
})
</script>

<template>
  <el-button class="zxi-button" :color="buttonColor" :style="selectStyle">
    <template #default>
      <slot />
    </template>
  </el-button>
</template>

<style scoped lang="less">
.zxi-button{
  box-sizing: border-box;
  border-radius: 0!important;
  border: none;
  padding: 10px!important;
  -webkit-app-region: no-drag;
  height: auto;
}
.el-button+.el-button {
  margin-left: 0;
}
</style>