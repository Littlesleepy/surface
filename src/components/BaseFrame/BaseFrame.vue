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
import BaseTopFrame from '../BaseTopFrame/BaseTopFrame.vue'
import BaseNavigation from '../BaseNavigation/BaseNavigation.vue'
import { useRoute } from 'vue-router';
import { UseTheme } from 'mcharts/index'
import { ref } from 'vue';

const route = useRoute()

const title = route.meta.title

/**.............................导航............................. */
const navigationShow = ref(false)

function handleNavigation () {
  navigationShow.value = !navigationShow.value
}

</script>

<template>
  <div class="container">
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
            <BaseButton @click="handleNavigation">
              <i class="iconfont icon-gongneng"></i>
              <span>{{ title }}</span>
            </BaseButton>
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
  height: 65vh;
}
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    border-bottom: 2px solid rgb(96, 96, 96);
  }
  .header-right{
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 5px 5px 5px;
    .slot{
      flex: auto;
    }
  }
  .control{
    height: 100%;
    display: flex;
    -webkit-app-region: none;
    .button-area{
      display: flex;
      padding: 0.5rem 0 0.5rem 0.5rem;
      :nth-child(2n){
        margin: 0 @btnSpace;
      }
      .iconfont{
        margin: auto;
        font-size: 4.5rem;
      }
      span{
        font-size: 2.5rem;
        align-self: center;
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