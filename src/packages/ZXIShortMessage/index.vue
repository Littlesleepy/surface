<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 16:59:33
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIShortMessage\index.vue
 * @Description: 短消息组件
 -->

<script setup lang="ts">
import { PropType, ref } from 'vue'
import { IShortMessageData } from './type'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Array as PropType<Array<IShortMessageData>>,
    default: () => []
  },
  name: { type: String }
})
const root = ref<HTMLDivElement>()

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="short-message">
      <p v-if="name">{{name}}</p>
      <ZXIScroll class="message-scroll">
        <div class="message-container" v-for="(item,index) in inputData" :key="index">
          <ul>
            <li>{{item.frequency}}MHz {{item.sender}}</li>
            <li>{{item.sendDate}}</li>
          </ul>
          <p>{{item.msg}}</p>
        </div>
      </ZXIScroll>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
.short-message{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  >p{
    height: @headerHeight;
    line-height: @headerHeight;
    color: v-bind('UseTheme.theme.var.color');
    font-size: 12px;
    background-color: v-bind('UseTheme.theme.var.backgroundColor');
    padding: 0 10px;
  }
  .message-scroll{
    flex: auto;
    width: 100%;
    .message-container{
      display: flex;
      flex-direction: column;
      ul{
        display: flex;
        justify-content: space-between;
      }
      p{
        padding: 5px 0;
      }
    }
  }
}
</style>