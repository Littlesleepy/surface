<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 14:13:59
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 16:59:21
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseFrame\BaseFrame.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseFrame'
}
</script>

<script setup lang="ts">
import { ESwitchState } from '@/packages';
import { useFrameStore } from '@/store';
import { computed, ref } from 'vue';
import BaseTopFrame from '../BaseTopFrame/BaseTopFrame.vue'
import BaseNavigation from '../BaseNavigation/BaseNavigation.vue'
import { useRoute } from 'vue-router';
import { ReceiveData } from '@/server';

const route = useRoute()

const title = route.meta.title

const frameStore = useFrameStore()

const startBtnClass = computed(() => {
  const classes = frameStore.s_playButton === ESwitchState.off ? 'icon-qidong' : 'icon-zanting'

  return ['iconfont', classes]
})

function handleStart () {
  frameStore.m_playButton()
}
/**.............................表单参数............................. */
const formShow = ref(false)

function handleForm () {
  formShow.value = !formShow.value
}
/**.............................导航............................. */
const navigationShow = ref(false)

function handleNavigation () {
  navigationShow.value = !navigationShow.value
}

// 监测功能开启数据监听，子组件不再需要run
ReceiveData.run()

</script>

<template>
  <div class="container">
    <!-- 参数弹出框 -->
    <BaseDialog v-model="formShow" title="参数设置" width="80%" key="form">
      <div class="set-form">
        <slot name="set">
          <BaseParams />
        </slot>
      </div>
    </BaseDialog>
    <!-- 导航弹出框 -->
    <BaseDialog v-model="navigationShow" title="功能选取" width="80%" key="navigation" delay>
      <BaseNavigation class="navigation" />
    </BaseDialog>
    <!-- 头部 -->
    <BaseTopFrame class="header">
      <template #left>
        <!-- 控制区域 -->
        <div class="control">
          <!-- 按钮区域 -->
          <div class="button-area">
            <!-- 导航 -->
            <button @click="handleNavigation">
              <i class="iconfont icon-gongneng"></i>
              <span>{{ title }}</span>
            </button>
            <!-- 参数表单 -->
            <button @click="handleForm">
              <i class="iconfont icon-zhongduancanshuguanli" />
            </button>
            <!-- 启动 -->
            <button @click="handleStart">
              <i :class="startBtnClass" />
            </button>
          </div>
          <!-- 插槽 -->
          <div class="header-center">
            <slot name="header-center" />
          </div>
        </div>
      </template>
      <template #right>
        <div class="header-right">
          <!-- 导航 -->
          <!-- <button @click="handleNavigation">
            <i class="iconfont icon-gongneng" />
          </button> -->
          <div class="slot">
            <slot name="header-right" />
          </div>
        </div>
      </template>
    </BaseTopFrame>
    <!-- 内容区域 -->
    <div class="center">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.set-form{
  width: 100%;
}
.navigation{
  width: 100%;
  height: 400px;
}
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: @mainColor;
  .header{
    border-bottom: 2px solid rgb(96, 96, 96);
  }
  .header-right{
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 5px 5px 5px;
    >button{
      display: flex;
      .btnStyle();
      padding: 0px;
      .iconfont{
        margin: auto;
        font-size: 20px;
      }
    }
    .slot{
      flex: auto;
    }
  }
  .control{
    height: 100%;
    display: flex;
    .button-area{
      display: flex;
      padding: 5px;
      :nth-child(2n){
        margin: 0 @btnSpace;
      }
      >button{
        display: flex;
        .btnStyle();
        padding: 0 8px 0 8px;
        .iconfont{
          margin: auto;
          font-size: 60px;
        }
        span{
          font-size: 40px;
          align-self: center;
        }
      }
    }
    .header-center{
      flex: auto;
    }
  }
  .center{
    flex: auto;
  }
}
</style>