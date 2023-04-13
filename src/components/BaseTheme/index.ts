/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-24 16:17:15
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-24 16:17:39
 * @FilePath: \zxi-device\src\components\BaseTheme\index.ts
 * @Description: 
 */
export enum EThemeName {
  light = 'light',
  dark = 'dark'
}

import { CustomTheme, localStorageKey } from '@/types'
import { ref, watch } from 'vue'
import { UseTheme } from 'mcharts/index'

export function useTheme() {

  function setTheme(name: string) {
    if (name === EThemeName.light) {
      CustomTheme.set({
        lineColorOne: 'rgb(40, 40, 40)',
        districtBorder: 'var(--device--districtBorder, 2px solid rgba(40, 40, 40, 0.4))',
        logColor: 'rgb(40, 40, 40)',
        lineColorGreen: 'rgb(0, 204, 0)',
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
          btnBgColor: [220, 220, 220],
          btnBgSelectedColor: [172, 172, 172]
        },
        Dpx: {
          lineColor: [1, 0, 0]
        },
        Eye: {
          lineColor: 'rgb(0, 204, 0)'
        },
        Highlight: {
          markerColor: 'var(--zxi--Highlight--markerColor, rgb(120, 120, 120, .2))'
        },
        IQVector: {
          lineColor: 'rgb(40, 40, 40)',
          pointColor: 'rgb(220, 0, 0)'
        },
        Icons: {
          color: 'var(--zxi--Icons--color, rgb(0, 0, 0))'
        },
        Level: {
          lineColor: 'rgb(40, 40, 40)',
          barColor: [[0, 0, 1], [0, 0.7, 0], [1, 0, 0]]
        },
        Raindrop: {
          raindropColor: [[1, 1, 1], [0, 0, 0]]
        },
        SpectrumAndFall: {
          baoluotuColor: [0, 0.8, 0],
          barColor: [[0, 0, 1], [0, 0.7, 0], [1, 0, 0]],
          fallAxisYColor: 'rgb(120, 120, 120)',
          gridColor: [0.5, 0.5, 0.5, 1]
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

      document.documentElement.classList.remove(...['dark'])
    } else {
      CustomTheme.set(CustomTheme.default, name)

      UseTheme.set(UseTheme.default)

      document.documentElement.classList.add(...['dark'])
    }

    localStorage.setItem(localStorageKey.KEY_THEME_NAME, name)
  }

  function toggleTheme() {
    if (themeName.value === EThemeName.dark) {
      themeName.value = EThemeName.light
    } else {
      themeName.value = EThemeName.dark
    }
  }

  const themeName = ref(localStorage.getItem(localStorageKey.KEY_THEME_NAME) ?? EThemeName.dark)

  watch(themeName, (v) => {
    setTheme(v)
  }, { immediate: true })

  return { toggleTheme, themeName }
}