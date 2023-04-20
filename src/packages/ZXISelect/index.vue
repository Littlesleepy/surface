<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-21 11:38:37
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 09:04:11
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISelect\index.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  inheritAttrs: false,
  name: 'ZXISelect'
}
</script>

<script setup lang="ts">
import { PropType, StyleValue, ref } from 'vue';
import { UseTheme } from '../styles'
import { ElSelect } from 'element-plus'

const props = defineProps({
  name: { type: String },
  class: { type: String },
  style: { type: [Object, String, Array] as PropType<StyleValue | undefined> }
})

const ins = ref<InstanceType<typeof ElSelect>>()

let close = false

function focus() {
  close = !close
  if (close) {
    ins.value!.toggleMenu()
  } else {
    ins.value!.blur()
  }
}

</script>

<template>
  <div :class="class" :style="style">
    <div class="container">
      <!-- 禁用遮罩 -->
      <span class="marker" :style="$attrs.disabled ? { opacity: 1 } : { opacity: 0 }" />
      <!-- 名称 -->
      <div class="name" v-if="name" @click="focus">{{ name }}</div>
      <el-select ref="ins" class="zxi-select" popper-class="zxi-popper-class" v-bind="$attrs" >
        <template #default>
          <slot name="default"/>
        </template>
      </el-select>
    </div>
  </div>
</template>

<style lang="less">
@import url('../assets/styles/theme.less');
.zxi-popper-class {
  .el-select-dropdown__item{
    font-size: @fontSize;
  }
}
</style>

<style scoped lang="less">
@import url('../assets/styles/theme.less');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  padding-left: 1.5rem;
  background-color: v-bind('UseTheme.theme.var.btnBgColor');
  align-items: center;
  box-sizing: border-box;
  position: relative;
  transition: background-color .3s;
  .marker{
    .marker-disabled();
  }
  :deep(.zxi-select){
    width: 0px;
    flex: auto;
    .el-input__wrapper{
      border: none;
      font-size: @fontSize;
      box-shadow: none;
      border-radius: 0;
      background-color: v-bind('UseTheme.theme.var.btnBgColor');
      .el-input__inner{
        text-align: end;
        color: v-bind('UseTheme.theme.var.color');
      }
    }
    .el-input.is-focus .el-input__wrapper{
      box-shadow: none!important;
    }
    .is-focus{
      box-shadow: none!important;
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