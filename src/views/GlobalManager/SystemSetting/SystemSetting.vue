<script setup lang="ts">
import BaseTheme from 'cp/BaseTheme/BaseTheme.vue'

</script>

<template>
  <div class="container">
    <BaseTheme class="theme" />
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 100%;
  display: flex;
  .theme{
    margin: auto;
  }
}
</style>