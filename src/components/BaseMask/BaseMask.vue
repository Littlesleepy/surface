<template>
    <div v-if="lock" class="mask"/>
</template>

<script setup lang='ts'>
import { ref } from 'vue';

const props = defineProps<{
  lock:boolean
}>()


// const lock = ref(false)
</script>

<style lang="less" scoped>
.mask{
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 9999;

}
</style>