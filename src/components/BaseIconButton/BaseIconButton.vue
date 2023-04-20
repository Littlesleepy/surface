<script setup lang='ts'>
defineProps({
  icon: {
    type: String
  },
  text: {
    type: String
  }
})
</script>
 
<template>
  <div>
    <div class="container">
      <i class="iconfont" :class="icon" />
      <p class="text">{{ text }}</p>
    </div>
  </div>
</template>
 
<style lang="less" scoped>
@import url('theme');
.container {
  width: 100%;
  height: 100%;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  box-sizing: border-box;
  margin: 0 5px;
  .iconfont{
    font-size: 6rem;
  }


  .text{
    min-height:1.8rem ;
    // margin: 5px 0;
    margin-top: @btnSpace;
  }
}
</style>