<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-02 10:56:56
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 14:33:24
 * @FilePath: \zxi-device\src\components\BaseLink\BaseLink.vue
 * @Description: 弹出框，接收一个触发器
 -->
<script lang="ts">
export default {
  name: 'BaseLink'
}
</script>

<script setup lang="ts">
import { PropType, ref } from 'vue'
import { Device } from '@/helper'
import { IBaseLink } from './type'
import { useRoute, useRouter } from 'vue-router'
import { IDeviceFunc } from '@/types'
import { localStorageKey } from '@/storage'
import { UseTheme } from 'mcharts/index'

const props = defineProps({
  trigger: {
    type: Object as PropType<IBaseLink>,
    default: () => {
      return {
        value: 0,
        describe: '',
        position: { clientX: 0, clientY: 0 },
        mouseOrTouch: ''
      }
    }
  },
  link: {
    default: () => {
      return {
        key: Device.linkKey.frequency,
        show: true
      }
    }
  },
  closeButtonColor: {
    type: String
  },
  textColor: {
    type: String
  }
})

const router = useRouter()

const route = useRoute()

const funcs:  Array<IDeviceFunc> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONS)!)

const lists = ref(funcs.filter(f => {
  let hasFun = false
  Config.enableFunction.forEach(item => {
    if (item === f.functionKey) hasFun = true
  })
  return Device.linkDescribe.has(f.functionKey) && hasFun
}))

/**
 * @description: 监测跳转
 */
function handleMonitor (f: IDeviceFunc) {
  const describe = Device.linkDescribe.get(f.functionKey)
  const query = {
    linkKey: props.link.key
  }
  if (describe) {
    const content = describe.get(props.link.key)!
    for (const key of content) {
      query[key] = props.trigger.value
    }
  }
  router.push({
    name: f.functionKey,
    query
  })
}

const color = props.textColor ?? UseTheme.theme.var.backgroundColor
</script>

<template>
  <ZXIMenu :trigger="trigger" :closeButtonColor="closeButtonColor">
    <div class="container">
      <p class="title">{{trigger.describe}}</p>
      <hr>
      <div class="slot">
        <slot />
      </div>
      <div class="link" v-if="link.show">
        <div
          class="item"
          v-for="f in lists"
          v-show="!(f.functionKey === route.name && !f.enableTask)"
          :key="f.functionKey">
            <span>{{f.name}}</span>
            <div class="button">
              <el-button type="info" :disabled="f.functionKey === route.name" @click="handleMonitor(f)">监测</el-button>
            </div>
        </div>
      </div>
    </div>
  </ZXIMenu>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  color: v-bind(color);
  .title{
    text-align: center;
    font-size: calc(@font20 * 1.2);
    font-weight: 700;
    height: 2.4rem;
  }
  .slot{
    padding: .5rem 0;
  }
  .link{
    display: flex;
    flex-direction: column;
    .item{
      display: flex;
      justify-content: space-between;
      padding-bottom: 5px;
      >span{
        font-size: @font20;
        margin: auto;
      }
      .button{
        display: flex;
      }
    }
  }
}
</style>