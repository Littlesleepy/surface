<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 14:13:59
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-21 11:31:31
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseMonitorFrame\BaseMonitorFrame.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseMonitorFrame'
}
</script>

<script setup lang="ts">
import { ESwitchState } from '@/packages';
import { useFrameStore, useMainStore } from '@/store';
import { computed, onBeforeUnmount, ref, toRaw, watch } from 'vue';
import BaseTopFrame from '../BaseTopFrame/BaseTopFrame.vue'
import BaseNavigation from '../BaseNavigation/BaseNavigation.vue'
import { useRoute, useRouter } from 'vue-router';
import { ReceiveData, ReceiveDataOptions } from '@/server';
import { ZAudio, UseTheme } from 'mcharts/index'
import { IServerAudioData, CustomTheme } from '@/types';
import * as Helper from '@/helper'
import { ElMessageBox, ElNotification } from 'element-plus';
import BaseMask from "@/components/BaseMask/BaseMask.vue";

const route = useRoute()

const title = route.meta.title

const frameStore = useFrameStore()

const startBtnClass = computed(() => {
  const classes = frameStore.s_playButton === ESwitchState.off ? 'icon-qidong' : 'icon-zanting'

  return ['iconfont', classes]
})

function handleStart() {
  frameStore.m_playButton()
}
/**.............................表单参数............................. */
const formShow = ref(false)

function handleForm() {
  formShow.value = !formShow.value
}
/**.............................导航............................. */
const navigationShow = ref(false)

function handleNavigation() {
  navigationShow.value = !navigationShow.value
}
// handleMask
const showMask = ref(false)
function handleMask() {
  showMask.value = !showMask.value
}

/**......................................数据接收...................................... */
// 音频播放部分
let audio = new ZAudio()
/**
 * @description: 音频数据播放
 * @param {IServerAudioData} data
 * @return {*}
 */
function audioControl(data: IServerAudioData) {
  if (audio && frameStore.s_playButton === ESwitchState.open) {
    audio.play(toRaw(data.audioData), data.sampleRate, data.channel, data.bits)
  }
}

if (!ReceiveData.manager.has(ReceiveData.key.AUDIO)) {
  // 添加公共数据监听，只能添加一次
  const options: ReceiveDataOptions = new Map([
    [ReceiveData.key.AUDIO, {
      canDelete: false,
      control: audioControl
    }],
    [ReceiveData.key.ERROR, {
      canDelete: false,
      control: (data: any) => {
        ElNotification({ type: 'error', title: '错误', message: data }) // 出错
        frameStore.m_playButton(ESwitchState.off)
      }
    }],
    [ReceiveData.key.WARNING, {
      canDelete: false,
      control: (data: any) => {
        ElNotification({ type: 'warning', title: '警告', message: data })
      }
    }]
  ])

  const optionsChild: ReceiveDataOptions = new Map()
  // 音频数据二层接收
  optionsChild.set(ReceiveData.key.AUDIO, {
    canDelete: false,
    control: audioControl
  })

  options.set('DATA', { children: optionsChild })

  ReceiveData.add(options)
}

watch(() => frameStore.s_playButton, (btn) => {
  if (audio) {
    if (btn === ESwitchState.off) {
      audio.dispose()
    } else {
      audio.activate()
    }
  }
})
// 监测功能开启数据监听，子组件不再需要run
ReceiveData.run()


const mainStore = useMainStore()

onBeforeUnmount(() => {
  mainStore.rootDispose()
})

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
    <BaseDialog v-model="navigationShow" title="控制" width="80%" key="navigation">
      <BaseNavigation class="navigation" />
    </BaseDialog>
    <!-- 头部 -->
    <BaseTopFrame class="header">
      <template #left>
        <!-- 控制区域 -->
        <div class="control">
          <!-- 按钮区域 -->
          <div class="button-area" v-show="!showMask">
            <!-- 导航 -->
            <ZXIButton @click="handleNavigation">
              <i class="iconfont icon-gongneng"></i>
              <span>{{ title }}</span>
            </ZXIButton>
            <!-- 启动 -->
            <ZXIButton @click="handleStart">
              <i :class="startBtnClass" />
            </ZXIButton>
            <!-- 参数表单 -->
            <ZXIButton @click="handleForm">
              <i class="iconfont icon-zhongduancanshuguanli" />
            </ZXIButton>
            <!-- 锁定 -->
            <ZXIButton @click="handleMask">
              <i class="iconfont icon-suoding1" />
            </ZXIButton>
          </div>
          <!-- 插槽 -->
          <div class="header-center" v-show="!showMask">
            <slot name="header-center" />
          </div>
          <div class="button-area button-show" v-show="showMask">
            <!-- 取消锁定 -->
            <ZXIButton @click="handleMask">
              <i class="iconfont icon-jiesuo1" />
            </ZXIButton>

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
      <BaseMask :lock="showMask" />
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');

.set-form {
  width: 100%;
}

.navigation {
  width: 100%;
  height: 65vh;
}

.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');

  .header {
    border-bottom: v-bind('CustomTheme.theme.districtBorder');
  }

  .header-right {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 @btnSpace @btnSpace @btnSpace;

    .slot {
      flex: auto;
    }
  }

  .control {
    height: 100%;
    display: flex;
    -webkit-app-region: none;

    .button-area {
      display: flex;
      padding: @btnSpace 0 @btnSpace @btnSpace;

      :not(:last-child) {
        margin-right: @btnSpace;
      }

      .iconfont {
        margin: auto;
        font-size: 4.5rem;
      }

      span {
        font-size: 2.5rem;
        align-self: center;
      }
    }

    .button-show {
      width: 100%;
      justify-content: center;
    }

    .header-center {
      flex: auto;
    }
  }

  .center {
    position: relative;
    flex: auto;
    z-index: 0;
  }
}</style>