<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-23 11:33:25
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 17:20:28
 * @FilePath: \zxi-device\src\components\BaseTheme\BaseTheme.vue
 * @Description: 
 -->
<script setup lang="ts">
import { CustomTheme, localStorageKey } from '@/types'
import { ref, watch } from 'vue'
import { UseTheme } from 'mcharts/index'
import { EThemeName } from '.'

defineProps({
  size: { default: 'large' }
})

const theme = ref(false)

function setTheme (name: string) {
  if (name === EThemeName.light) {
    theme.value = true
    CustomTheme.set({
      lineColorOne: 'rgb(0, 200, 0)',
      districtBorder: 'var(--device--districtBorder, 3px solid rgba(40, 40, 40, 0.4))',
      logColor: 'rgb(40, 40, 40)',
      lineColorGreen: 'rgb(0, 0, 0)',
      thresholdColor: [0.157, 0.157, 0.157]
    }, name)

    UseTheme.set({
      global: {
        backgroundColor: [255, 255, 255],
        color: [40, 40, 40],
        scaleColor: [40, 40, 40],
        borderColor: [160, 160, 160],
        tipBgColor: [40, 40, 40],
        tipColor: [220, 220, 220],
        tagBgColor: [40, 40, 40],
        tagSelectColor: [255, 0, 0],
        btnBgColor: [220, 220, 220]
      },
      Dpx: {
        lineColor: [1, 0, 0]
      },
      Eye: {
        lineColor: 'rgb(0, 0, 0)'
      },
      Highlight: {
        markerColor: 'var(--zxi--Highlight--markerColor, rgb(120, 120, 120, .2))'
      },
      IQVector: {
        lineColor: 'rgb(0, 0, 0)',
        pointColor: 'rgb(200, 200, 200)'
      },
      Icons: {
        color: 'var(--zxi--Icons--color, rgb(0, 0, 0))'
      },
      Level: {
        lineColor: 'rgb(0, 0, 0)',
        barColor: [[0, 0, 1], [0, 1, 0], [1, 0, 0]]
      },
      Raindrop: {
        raindropColor: [[1, 1, 1], [0, 0, 0]]
      },
      SpectrumAndFall: {
        baoluotuColor: [0, 0.384, 0.067],
        barColor: [[0, 0, 1], [0, 1, 0], [1, 0, 0]],
        fallAxisYColor: 'rgb(120, 120, 120)'
      },
      StatisticalY: {
        lineColor: 'rgb(0, 0, 0)'
      },
      Compass: {
        lineColor: 'rgb(0, 0, 0)'
      },
      ControlBtn: {
        backgroundColor: 'var(--zxi--ControlBtn--backgroundColor, rgb(200, 200, 200))'
      }
    })
  } else {
    theme.value = false

    CustomTheme.set(CustomTheme.default, name)
    
    UseTheme.set(UseTheme.default)
  }

  localStorage.setItem(localStorageKey.KEY_THEME_NAME, name)
}

const themeName = localStorage.getItem(localStorageKey.KEY_THEME_NAME) ?? EThemeName.dark

setTheme(themeName)

watch(theme, (v) => {
  if (v) {
    setTheme(EThemeName.light)
  } else {
    setTheme(EThemeName.dark)
  }
})
</script>

<template>
  <el-switch
    :size="size"
    v-model="theme"
    inline-prompt
    active-text="白天"
    inactive-text="夜间"
    style="--el-switch-on-color: rgb(160, 160, 160);--el-switch-off-color: rgb(40, 40, 40)" />
</template>