<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 17:17:32
 * @FilePath: \zxi-device\src\packages\ZXIToolTipInfo\index.vue
 * @Description: 
 -->

<script setup lang="ts">
import { PropType, computed, ref } from 'vue'

const props = defineProps({
  info: {
    type: Array as PropType<Array<{ key: string, value: string, color: string } & string>>,
    default: () => []
  },
  itemStyle: { type: Object },
  color: {
    type: Array as PropType<Array<string>>,
    default: () => {
      return [
        'rgb(0, 0, 0)',
        'rgb(255, 0, 0)',
        'rgb(0, 255, 64)',
        'rgb(0, 81, 255)',
        'rgb(0, 255, 213)',
        'rgb(234, 0, 255)',
        'rgb(255, 0, 85)',
        'rgb(83, 83, 83)',
        'rgb(109, 99, 240)'
      ]
    }
  }
})

const wrapperDom = ref<HTMLUListElement>()

const useInfo = computed(() => {
  if (typeof props.info[0] === 'string') {
    const info: Array<{ value: string, color: string, key: string }> = []
    for (let i = 0, len = props.info.length; i < len; i++) {
      const obj: { key: string, value: string, color: string } = {
        key: i.toString(),
        value: props.info[i],
        color: props.color[i]
      }
      info[i] = obj
    }
    return info
  }
  return props.info
})
</script>

<template>
  <ul ref="wrapperDom">
    <li :style="itemStyle" v-for="item in useInfo" :key="item.key">
      <span :style=" { backgroundColor: item.color ? item.color : 'rgb(0, 0, 0)' }" />
      <p>{{ item.value }}</p>
    </li>
  </ul>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
ul{
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
  li{
    padding: 3px 0;
    font-size: 12px;
    height: 20px;
    box-sizing: border-box;
    color: rgb(0, 0, 0);
    display: flex;
    span{
      width: 13px;
      height: 13px;
      border-radius: 14px;
      margin-right: 5px;
      color: rgb(0, 0, 0);
    }
    p{
      margin: 0;
      flex: 1;
      width: 0;
      .textOverflow();
    }
  }
}
</style>