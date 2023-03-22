<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-02 14:40:33
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 15:59:32
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\App.vue
 * @Description: 
 -->
<script setup lang="ts">

</script>

<template>
  <router-view />
</template>

<style lang="less">
@import url('theme');
/* 设置一些全局样式 */
*{
  font-family: @fontFamily!important;
}
// html.dark {
//   /* 自定义深色背景颜色 */
//   --el-bg-color: #626aef;
// }
body {
  width: 100vw;
  height: 100vh;
}
#app{
  width: 100%;
  height: 100%;
}
</style>
