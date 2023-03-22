/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 14:06:47
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISpectrumScanAndFall\marker.ts
 * @Description: 
 */

import { ComputedRef, onBeforeUnmount, Ref, ref, watch } from 'vue'
import { Listen, Marker } from '../core'
import { IZXIMenu } from '../ZXIMenu/type'
import { IAxisYValue, IUnitAxis } from '..'
import { UseTheme } from '../styles'

export function createMarker (
  scaleX: ComputedRef<IUnitAxis>,
  params: ComputedRef<{ begin: number, end: number }>,
  step: Ref<number>
) {
  const marker = ref<Marker>()

  const markerManagers = ref<Set<{ dataIndex: number, frequency: number, add: boolean }>>(new Set())

  const markerManagerTrigger = ref<IZXIMenu & { dataIndex: number }>({
    position: { clientX: 0, clientY: 0 },
    mouseOrTouch: '',
    dataIndex: -1
  })

  /** 
   * @description: 添加marker
   * @param {Array} frequencys 如果添加长度为零，则清空所有marker
   * @return {*}
   */  
  function addMarker (frequencys: Array<number>) {
    if (marker.value) {
      if (frequencys.length === 0) {
        return marker.value.clear()
      } else {
        const markers = new Map<number, { el: HTMLElement, properties: { frequency: number } }>()
        const width = 140
        frequencys.forEach(frequency => {
          // 检查frequency超出范围没有
          if (frequency <= params.value.end && frequency >= params.value.begin) {
            const dataIndex = Math.round((frequency - params.value.begin) / step.value)
            const container = document.createElement('div')
            container.style.cssText = `
              width: ${width}px;
              height: 23px;
              left: ${-width / 2}px;
              position: absolute;
              display: flex;
            `
            const span0 = document.createElement('span')
            span0.style.cssText = `
              width: 100%;
              position: absolute;
              padding-top: 0px;
              display: flex;
              justify-content: center;
              color: ${UseTheme.theme.var.color};
              font-size: 14px;
            `

            const p = document.createElement('p')
            p.style.cssText = `
              text-align: center;
              border: 1px solid ${UseTheme.theme.var.tagBgColor};
              background-color: ${UseTheme.theme.var.backgroundColor};
              padding: 3px 5px;
              border-radius: 9px;
              font-size: 12px;
            `

            p.textContent = `${frequency} ${scaleX.value.unit}`
            span0.appendChild(p)

            const i = document.createElement('i')
            i.classList.add(...['iconfont', 'icon-guanbi'])
            i.style.cssText = `
              color: ${UseTheme.theme.var.tagBgColor};
              padding-left: 3px;
              margin: auto 0px;
            `
            span0.appendChild(i)
            container.appendChild(span0)
            markers.set(dataIndex, { el: container, properties: { frequency } })

            i.addEventListener(Listen.MOUSEDOWN, (e) => {
              e.stopPropagation()
            })

            i.addEventListener(Listen.CLICK, (e) => {
              e.stopPropagation()
              if (marker.value) marker.value.remove([dataIndex])
            })
            i.addEventListener(Listen.TOUCHSTART, (e) => {
              e.stopPropagation()
              if (marker.value) marker.value.remove([dataIndex])
            })

            p.addEventListener(Listen.MOUSEDOWN, (e) => {
              e.stopPropagation()
            })

            p.addEventListener(Listen.CLICK, (e) => {
              e.stopPropagation()
              markerManagerTrigger.value = {
                position: {
                  clientX: e.clientX,
                  clientY: e.clientY
                },
                mouseOrTouch: Listen.MOUSE,
                dataIndex
              }
            })

            p.addEventListener(Listen.TOUCHSTART, (e) => {
              e.stopPropagation()
              markerManagerTrigger.value = {
                position: {
                  clientX: e.touches[0].clientX,
                  clientY: e.touches[0].clientY
                },
                mouseOrTouch: Listen.TOUCH,
                dataIndex
              }
            })

            p.addEventListener(Listen.MOUSEMOVE, () => {
              p.style.scale = '1.1'
            })

            p.addEventListener(Listen.MOUSELEAVE, () => {
              p.style.scale = '1'
            })
          }
        })

        return marker.value.add(markers)
      }
    }
  }

  function setMarkerPoints (axisY: IAxisYValue, usingData: Map<string, { data: Float32Array, color?: string }>) {
    if (marker.value) {
      const rangeY = axisY.max - axisY.min
      const sources = new Map<number, Map<string, { value: number, color: string }>>()
      marker.value.manager.forEach((m, index) => {
        const source = new Map<string, { value: number, color: string }>()
        for (const [key, target] of usingData) {
          let value = target.data[index]
          if (value !== undefined) {
            value = 1 - (value - axisY.min) / rangeY
            source.set(key, { value, color: target.color ?? 'red' })
          }
        }
        if (source.size) sources.set(index, source)
      })

      marker.value.setPoints(sources)
    }
  }

  const stop = watch(params, (v) => {
    if (marker.value) {
      const deletes: number[] = []
      for (const [index, m] of marker.value.manager) {
        if (m.properties.frequency < v.begin || m.properties.frequency > v.end) deletes.push(index)
      }

      marker.value.remove(deletes)
    }
  })

  onBeforeUnmount(() => {
    stop()
  })

  return {
    marker,
    markerManagers,
    markerManagerTrigger,
    addMarker,
    setMarkerPoints
  }
}