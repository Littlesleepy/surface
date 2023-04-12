/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-10-14 09:04:01
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\map\MarkerExtension.ts
 * @Description: 地图标记扩展
 */

import { LngLatLike, Marker, MarkerOptions, PointLike } from 'maplibre-gl'

export class MarkerExtension extends Marker {
  /**
   * @description: marker的label
   */  
  label: Marker | undefined
  /**
   * @description: marker的title
   */  
  title: Marker | undefined

  constructor (options?: MarkerOptions) {
    super(options)  
  }
  /**
   * @description: 设置label
   * @return {*}
   */  
  setLabel (options: {
    content: string
    offset?: PointLike
  }) {
    if (this.label === undefined) {
      const label = document.createElement('pre')
      label.textContent = options.content

      const style = label.style

      style.cssText = `
        background-color: rgb(255, 255, 255);
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 13px;
        color: rgb(0, 0, 0);
      `

      this.label = new Marker({
        element: label,
        offset: options.offset
      }).setLngLat(this._lngLat).addTo(this._map)
    }

    return this
  }
  /**
   * @description: 设置marker的位置
   * @param {LngLatLike} lnglat 位置
   * @return {*}
   */  
  setPosition (lnglat: LngLatLike) {
    this.setLngLat(lnglat)

    if (this.label) {
      this.label.setLngLat(lnglat)
    }

    if (this.title) {
      this.title.setLngLat(lnglat)
    }

    return this
  }
  /**
   * @description: 设置title
   * @return {*}
   */  
  setTitle (options: {
    content: string
    offset?: PointLike
  }) {
    if (this.title === undefined) {
      const title = document.createElement('pre')

      title.textContent = options.content

      title.style.cssText = `
        font-size: 12px;
        color: rgb(255, 255, 255);
        background-color: rgba(0, 0, 0, 0.6);
        padding: 10px;
        border-radius: 5px;
        border: 1px solid rgb(196, 196, 196);
        display: none;
        pointer-events: none;
      `
      this.title = new Marker({
        element: title,
        offset: options.offset,
        anchor: 'top-left'
      }).setLngLat(this._lngLat).addTo(this._map)

      const element = this.getElement()

      element.addEventListener('mouseover', () => {
        title.style.display = 'block'
      })

      element.addEventListener('mouseleave', () => {
        title.style.display = 'none'
      })
      
      element.addEventListener('touchend', () => {
        title.style.display = 'block'
      })

      this._map.on('touchstart', () => {
        title.style.display = 'none'
      })
    }

    return this
  }
  /**
   * @description: 移除marker所有内容
   * @return {*}
   */  
  removeAll () {
    this.remove()
    if (this.label) this.label.remove()
    if (this.title) this.title.remove()
  }
}