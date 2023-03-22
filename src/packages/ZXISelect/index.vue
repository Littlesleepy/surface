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
const props = defineProps({
  name: { type: String },
  unit: { type: String }
})
</script>

<template>
  <div class="container">
    <!-- 名称 -->
    <div class="name" v-if="name">{{ name }}</div>
    <el-select class="zxi-select" popper-class="zxi-popper-class" v-bind="$attrs" >
      <template #default>
        <slot name="default"/>
      </template>
    </el-select>
    <!-- 单位 -->
    <div class="unit" v-if="unit">{{ unit }}</div>
  </div>
</template>

<style lang="less">
@import url('../assets/styles/them.less');
.zxi-popper-class {
  .el-select-dropdown__item{
    font-size: @fontSize;
  }
}
</style>

<style scoped lang="less">
@import url('../assets/styles/them.less');

.container{
  width: 100%;
  display: flex;
  padding: 0 10px;
  background-color: @btnBgColor;
  :deep(.zxi-select){
    width: 0px;
    flex: auto;
    .el-input .el-input__wrapper{
      border: none;
      box-shadow: none!important;
      font-size: @fontSize;
      .el-input__inner{
        text-align: end;
      }
    }
    .is-focus{
      box-shadow: none!important;
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