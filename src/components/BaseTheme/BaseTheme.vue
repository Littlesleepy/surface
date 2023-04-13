<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-23 11:33:25
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 17:20:28
 * @FilePath: \zxi-device\src\components\BaseTheme\BaseTheme.vue
 * @Description: 
 -->
<script setup lang="ts">
import { useTheme, EThemeName } from '.'

const { toggleTheme, themeName } = useTheme()


</script>

<template>
  <div>
    <div class="container" @click="toggleTheme">
      <ZXIButton class="button" v-if="themeName === EThemeName.dark"><i class="iconfont icon-yejian" /></ZXIButton>
      <ZXIButton class="button" v-if="themeName === EThemeName.light"><i class="iconfont icon-tianqitaiyangqichuang" /></ZXIButton>
    </div>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .button{
    flex: 1;
    display: flex;
    i {
      margin: auto;
      text-align: center;
      font-size: 3rem;
      padding: 0.5rem;
    }
  }
}
</style>