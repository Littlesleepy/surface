<script setup lang='ts'>
const props = defineProps({
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
      <!-- <ZXIButton class="button">
        <i class="iconfont" :class="icon" />
      </ZXIButton> -->
      <i class="iconfont" :class="icon" />
      <p class="text">一行文本</p>
    </div>
  </div>
</template>
 
<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  box-sizing: border-box;
  .iconfont{
    font-size: 8rem;
  }

  .button {
    // flex: 1;
    // width: 100%;
    flex: auto;
    display: flex;

    i {
      margin: auto;
      text-align: center;
      font-size: 3rem;
      padding: 0.5rem;
    }
  }
  .text{
    // margin: 5px 0;
  }
}
</style>