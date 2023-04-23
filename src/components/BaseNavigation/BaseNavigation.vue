<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 14:12:39
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-23 09:08:40
 * @FilePath: \zxi-surface\src\components\BaseNavigation\BaseNavigation.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseNavigation'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { localStorageKey } from 'storage/index'
import { IDeviceFunc } from '@/types'
import { ElMessage, ElNotification } from 'element-plus'
import { UseTheme } from 'mcharts/index'
import BaseTheme from 'cp/BaseTheme/BaseTheme.vue'
import BaseCache from "cp/BaseCache/BaseCache.vue";
import BaseExport from "cp/BaseExport/BaseExport.vue";
interface IIconList {
  id: number
  imgUrl: string
  name: string
  title: string
  goFunc: () => void
  nameEn: string
  index: number
}

defineProps({
  /** 
   * @description: 默认使用导出功能
   */    
  useExport: { default: true }
})

const router = useRouter()

const naviGationLists = ref<Array<IIconList>>([])

function dataInit () {
  const funcsString = localStorage.getItem(localStorageKey.KEY_FUNCTIONS)
  let funcs: Array<IDeviceFunc> = []
  if (funcsString){
    funcs = JSON.parse(funcsString)
  } else {
    ElNotification({ type: 'warning', message: '请先进入登录页初始化程序' })
    return
  }
  let startId = 0
  Config.enableFunction.forEach(name => {
    funcs.forEach(m => {
      if (m.functionKey === name) {
        const item: IIconList = {
          id: startId,
          imgUrl: `imgs/${m.functionKey}.png`,
          name: m.name,
          title: m.description,
          goFunc: () => { handleRoute(m.functionKey) },
          nameEn: m.functionKey,
          index: m.orderIndex
        }

        naviGationLists.value.push(item)
        startId++
      }
    })
  })
}

function handleRoute (name) {
  // 打上已交互标记
  if (router.hasRoute(name)) {
    router.push({ name })
  } else {
    ElMessage.info(name + '功能尚未开发')
    return
  }
}

dataInit()

</script>

<template>
  <ZXIScroll :preventDefault="true" class="base-scroll" :wrapperStyle="{ backgroundColor: 'transparent' }">
    <div class="group">
      <p class="title">设置</p>
      <div class="setting">
        <BaseTheme class="item" />
        <BaseCache class="item"/>
        <BaseExport v-if="useExport" class="item"/>
      </div>
    </div>
    <div class="group" v-if="naviGationLists.length">
      <p class="title">导航</p>
      <ul>
        <li v-for="item in naviGationLists" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
</ZXIScroll>
</template>

<style scoped lang="less">
@import url('theme');
.base-scroll{
  z-index: 20;
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  .group{
    width: 100%;
    margin: 2rem 0;
    padding: 0 0 1rem 0;
    border: 1px solid #202020;
    background-color: v-bind('UseTheme.theme.var.backgroundColor');
    box-sizing: border-box;
    .title{
      padding: 1rem 0 1rem 1rem;
      font-size: 2rem;
      color: v-bind('UseTheme.theme.var.color');
      font-weight: 700;
      background-color: rgba(0, 0, 0, .08);
      margin-bottom: 1rem;
    }
    // 中设置
    .setting{
      display: flex;
      flex-wrap: wrap;
      .item{
        box-sizing: border-box;
        width: 16.66%;
      }
    }
    // 导航
    ul{
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      >li{
        width: 16.66%;
        height: 0px;
        padding-bottom: 13%;
        >div{
          width: 100%;
          text-align: center;
          cursor: pointer;
          position: relative;
          img{
            width: 55%;
            &:hover{
              transform: scale(1.1);
            }
          }
          p{
            padding-top: 0.5rem;
            font-size: 1.8rem;
            color: v-bind('UseTheme.theme.var.color');
          }
        }
      }
    }
    ul:first-child{
      margin-top: 1rem;
    }
  }
}
</style>