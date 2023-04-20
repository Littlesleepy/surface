<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-23 11:33:25
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 17:20:28
 * @FilePath: \zxi-device\src\components\BaseTheme\BaseTheme.vue
 * @Description: 
 -->
<script setup lang="ts">
import { computed } from 'vue';
import { useTheme, EThemeName } from '.'
import BaseIconButton from "cp/BaseIconButton/BaseIconButton.vue";

const { toggleTheme, themeName } = useTheme()

const icon = computed(() => {
  return themeName.value === EThemeName.dark ? 'icon-icon-taikong2':'icon-taiyang1'
})
const text = computed(() => {
  return themeName.value === EThemeName.dark ? '深色模式' : '浅色模式'
})

</script>

<template>
  <BaseIconButton :icon="icon" :text="text" :icon-size="'7rem'" @click="toggleTheme"/>
</template>