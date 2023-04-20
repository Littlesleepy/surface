<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-18 16:05:31
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-19 15:59:45
 * @FilePath: \zxi-surface\src\components\BaseCache\BaseCache.vue
 * @Description: 
 -->

<script setup lang='ts'>
import BaseIconButton from "cp/BaseIconButton/BaseIconButton.vue";
import { ElMessageBox, ElNotification } from "element-plus";
import { h } from "vue";

const icon = 'icon-huancun'
const text = '清除缓存'

function cleanCache() {
  ElMessageBox({
    title: '警告',
    type:'warning',
    message: h('p', null, [
      h('span', null, '确认清除缓存?'),
      h('p',{style:'color:teal;font-size:1.5rem'},' (清除缓存后将重启应用)')
    ]),
    confirmButtonText: '确认',
    cancelButtonText:'取消'
  }).then(window.electronAPI.cleanCache)
  
}
</script>

<template>
  <BaseIconButton :icon="icon" :text="text" @click="cleanCache"/>
</template>