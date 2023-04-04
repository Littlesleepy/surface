<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 14:12:39
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 13:24:56
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseNavigation\BaseNavigation.vue
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
interface IIconList {
  id: number
  imgUrl: string
  name: string
  title: string
  goFunc: () => void
  nameEn: string
  index: number
}

const router = useRouter()

const baseLists = ref<Array<IIconList>>([{
  id: 0,
  imgUrl: 'imgs/FilesManager.png',
  name: '文件管理',
  title: '提供多种文件的管理操作',
  goFunc: () => {
    router.push({ name: 'FilesManager' })
  },
  nameEn: 'FilesManager',
  index: 0
}, {
  id: 1,
  imgUrl: 'imgs/GlobalManager.png',
  name: '全局管理',
  title: '提供关于全局的操作',
  goFunc: () => {
    router.push({ name: 'GlobalManager' })
  },
  nameEn: 'GlobalManager',
  index: 1
}
])
/** 
 * @description: 基本功能
 */    
const naviGationListsRX = ref<Array<IIconList>>([])
/** 
 * @description: 专项功能
 */  
const naviGationListsOP = ref<Array<IIconList>>([])
/** 
 * @description: 测向
 */  
const naviGationListsDF = ref<Array<IIconList>>([])
/** 
 * @description: 硬件检测
 */  
const naviGationListsHC = ref<Array<IIconList>>([])
/** 
 * @description: 场景应用
 */    
const naviGationListsAPP = ref<Array<IIconList>>([])

function dataInit () {
  const funcsString = localStorage.getItem(localStorageKey.KEY_FUNCTIONS)
  let funcs: Array<IDeviceFunc> = []
  if (funcsString){
    funcs = JSON.parse(funcsString)
  } else {
    ElNotification({ type: 'warning', message: '请先进入登录页初始化程序' })
    return
  }
  let startId = baseLists.value.length
  funcs.forEach(m => {
    const item: IIconList = {
      id: startId,
      imgUrl: `/imgs/${m.functionKey}.png`,
      name: m.name,
      title: m.description,
      goFunc: () => { handleRoute(m.functionKey) },
      nameEn: m.functionKey,
      index: m.orderIndex
    }
    startId++
    // 屏蔽全景扫描——亚运会
    const disableFunction = new Set(Config.disableFunction)
    if (!disableFunction.has(m.functionKey)) {
      switch (m.subjectionKey) {
      case 'RX': naviGationListsRX.value.push(item)
        break
      case 'OP': naviGationListsOP.value.push(item)
        break
      case 'DF': naviGationListsDF.value.push(item)
        break
      case 'HC': naviGationListsHC.value.push(item)
        break
      case 'APP': naviGationListsAPP.value.push(item)
        break
      }
    }
  })

  // 排序
  funcSort(naviGationListsRX.value)
  funcSort(naviGationListsOP.value)
  funcSort(naviGationListsDF.value)
  funcSort(naviGationListsHC.value)
  funcSort(naviGationListsAPP.value)
}

function funcSort (data: Array<IIconList>) {
  data.sort((f, s) => {
    return f.index - s.index
  })
}

function handleRoute (name) { // 全屏并隐藏头和脚
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
    <div class="group" v-if="baseLists.length">
      <p class="title">管理器</p>
      <ul>
        <li v-for="item in baseLists" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
    <div class="group" v-if="naviGationListsAPP.length">
      <p class="title">场景应用</p>
      <ul>
        <li v-for="item in naviGationListsAPP" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
    <div class="group" v-if="naviGationListsRX.length">
      <p class="title">基本功能</p>
      <ul>
        <li v-for="item in naviGationListsRX" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
    <div class="group" v-if="naviGationListsOP.length">
      <p class="title">专项功能</p>
      <ul>
        <li v-for="item in naviGationListsOP" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
    <div class="group" v-if="naviGationListsDF.length">
      <p class="title">测向</p>
      <ul>
        <li v-for="item in naviGationListsDF" :key="item.id" :title="item.title">
          <div @click="item.goFunc">
            <img :src="item.imgUrl">
            <p>{{item.name}}</p>
          </div>
        </li>
      </ul>
    </div>
    <div class="group" v-if="naviGationListsHC.length">
      <p class="title">硬件检测</p>
      <ul>
        <li v-for="item in naviGationListsHC" :key="item.id" :title="item.title">
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
      color: rgb(31, 128, 255);
      font-weight: 700;
      background-color: rgba(0, 0, 0, .08);
      margin-bottom: 0.5rem;
    }
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