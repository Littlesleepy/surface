/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-23 16:22:58
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXICompass\CompassUI.ts
 * @Description: 
 */
import { ElMessage } from 'element-plus'
import { Public } from '../core'
import * as Helper from '../helper'
import { UseTheme } from '../styles'

interface ISpan {
  style: string
}

export interface ICompassScale {
  el: HTMLDivElement
  span0Dom: HTMLSpanElement
  span1Dom: HTMLSpanElement
}
/**
 * @description: 刻度数值显示配置
 */
export interface ICompassScaleOptions {
  /**
   * @description: 开始端
   */  
  span0Dom?: { 
    content?: string,
    color?: string,
    fontSize?: string
  },
  /**
   * @description: 结束端
   */ 
  span1Dom?: {
    content?: string,
    color?: string,
    fontSize?: string
  }
}

export interface ICompassOptions {
  /**
   * @description: 指南针配置
   */  
  compass?: {
    /**
     * @description: 是否启用
     */    
    enable?: boolean
  }
  /**
   * @description: 外层包裹配置
   */  
  wrapper?: {
    border?: string
    backgroundColor?: string
  },
  el_90_270?: ICompassScaleOptions,
  el_0_180?: ICompassScaleOptions,
  el_45_225?: ICompassScaleOptions,
  el_135_315?: ICompassScaleOptions
}

export class CompassUI {
  options = {
    compass: {
      enable: false
    },
    wrapper: {
      border: `1px solid ${UseTheme.theme.var.borderColor}`,
      backgroundColor: UseTheme.theme.var.backgroundColor
    },
    el_90_270: {
      span0Dom: {
        content: '270',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      },
      span1Dom: {
        content: '90',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      }
    },
    el_0_180: {
      span0Dom: {
        content: '0',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      },
      span1Dom: {
        content: '180',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      }
    },
    el_45_225: {
      span0Dom: {
        content: '225',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      },
      span1Dom: {
        content: '45',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      }
    },
    el_135_315: {
      span0Dom: {
        content: '315',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      },
      span1Dom: {
        content: '135',
        color: UseTheme.theme.var.color,
        fontSize: '12px'
      }
    }

  }
  /**
   * @description: 根部挂载点
   */  
  readonly container: HTMLDivElement
  /**
   * @description: 外层包裹
   */  
  readonly wrapper: HTMLDivElement
  /**
   * @description: canvas挂载点
   */  
  readonly canvasMount: HTMLDivElement
  /**
   * @description: 保持非旋转状态的挂点
   */  
  readonly refusedToRotate: HTMLDivElement | undefined

  readonly el_90_270: ICompassScale

  readonly el_0_180: ICompassScale

  readonly el_45_225: ICompassScale

  readonly el_135_315: ICompassScale
  /**
   * @description: 旋转后的回调函数集
   */  
  readonly afterRotate = new Map<string, (event: DeviceOrientationEvent) => void>()
  /**
   * @description: 指南针N方向旋转角度，正值顺时针旋转，负值逆时针旋转
   */  
  rotationAngle: number

  private resieObserver = new ResizeObserver(() => {
    let size
    if (this.container.clientHeight > this.container.clientWidth) {
      size = this.container.clientWidth
    } else {
      size = this.container.clientHeight
    }

    const style = this.wrapper.style

    style.width = size + 'px'
    style.height = size + 'px'
    style.top = (this.container.clientHeight - size) / 2 + 'px'
    style.left = (this.container.clientWidth - size) / 2 + 'px'
  })

  private canvasWrapper0: HTMLDivElement

  constructor (container: HTMLDivElement, options?: ICompassOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.container = container

    this.container.style.cssText = `
      position: relative;
      box-sizing: border-box;
      display: flex;
    `
    // 外层包裹
    this.wrapper = document.createElement('div')
    this.wrapper.style.cssText = `
      position: absolute;
      box-sizing: border-box;
      border: ${this.options.wrapper.border};
      background-color: ${this.options.wrapper.backgroundColor};
      border-radius: 100%;
    `
    this.container.appendChild(this.wrapper)

    // canvas包裹
    this.canvasWrapper0 = document.createElement('div')
    this.canvasWrapper0.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      left: 20px;
      bottom: 20px;
      background-size: 100%;
      background-repeat: no-repeat;
      display: flex;
      border-radius: 100%;
    `
    this.wrapper.appendChild(this.canvasWrapper0)

    const canvasWrapper1 = document.createElement('div')
    canvasWrapper1.style.cssText = `
      margin: auto;
      width: 89%;
      height: 89%;
      position: relative;
    `
    this.canvasWrapper0.appendChild(canvasWrapper1)

    this.canvasMount = document.createElement('div')
    this.canvasMount.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
    `
    canvasWrapper1.appendChild(this.canvasMount)

    // 大刻度
    const publicStyle0 = `
      position: absolute;
      top: calc(50% - 8px);
      width: 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: space-between;
      height: 16px;
      transform-origin: center center;
      pointer-events: none;
    `
    const publicStyleSpan = `
      height: 100%;
      width: 30px;
      line-height: 16px;
      color: rgb(255, 255, 255);
    `

    this.el_90_270 = this.createScale(
      'el_90_270',
      publicStyle0,
      { style: publicStyleSpan + 'text-align: right;' },
      { style: publicStyleSpan + 'text-align: left;' }
    )

    const style_0_180 = `
      position: absolute;
      left: calc(50% - 15px);
      width: 30px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
    `
    const style_0_180_span = `
      padding-top: 17px;
      text-align: center;
      width: 100%;
      height: 30px;
      color: #ffffff;
    `

    this.el_0_180 = this.createScale(
      'el_0_180',
      style_0_180,
      { style: style_0_180_span },
      { style: style_0_180_span }
    )

    this.el_45_225 = this.createScale(
      'el_45_225',
      publicStyle0 + 'transform: rotate(-45deg);',
      { style: publicStyleSpan + 'text-align: right;' },
      { style: publicStyleSpan + 'text-align: left;' }
    )

    this.el_135_315 = this.createScale(
      'el_135_315',
      publicStyle0 + 'transform: rotate(45deg);',
      { style: publicStyleSpan + 'text-align: right;' },
      { style: publicStyleSpan + 'text-align: left;' }
    )

    this.resieObserver.observe(this.container)

    // 指南针
    if (this.options.compass.enable) {
      const whichSystem = Helper.Sundry.whichOS()
     
      if (whichSystem.isAndroid) {
        // 陀螺仪授权
        if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientation', (event) => {
            this.rotate(event)
          })
        } else {
          ElMessage.warning('设备不支持罗盘功能')
        }
      }

      // 构造一个不随外包围旋转而旋转的挂载位置与canvasMount同为兄弟元素
      this.refusedToRotate = document.createElement('div')
      this.refusedToRotate.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
      `
      canvasWrapper1.appendChild(this.refusedToRotate)
    }

    this.rotationAngle = 0

  }

  dispose  = () => {
    this.resieObserver.unobserve(this.container)
  }

  private rotate (event: DeviceOrientationEvent) {
    if (event.alpha) {
      this.rotationAngle = event.alpha

      const wStyle = this.wrapper.style

      wStyle.transform = `rotate(${this.rotationAngle}deg)`

      if (this.refusedToRotate) {
        this.refusedToRotate.style.transform = `rotate(${-this.rotationAngle}deg)`
      }

      for (const [, fun] of this.afterRotate) {
        fun(event)
      }
    }
  }

  private createScale (name: string, elStyle: string, span0: ISpan, span1: ISpan) {
    const el = document.createElement('div')
    el.style.cssText = elStyle
    const span0Dom = document.createElement('span')

    const options = this.options[name] as {
      span0Dom: {
        content: string,
        color: string,
        fontSize: string
      },
      span1Dom: {
        content: string,
        color: string,
        fontSize: string
      }
    }

    span0Dom.style.cssText = span0.style
    span0Dom.innerText = options.span0Dom.content
    span0Dom.style.color = options.span0Dom.color
    span0Dom.style.fontSize = options.span0Dom.fontSize
    el.appendChild(span0Dom)

    const span1Dom = document.createElement('span')
    span1Dom.style.cssText = span1.style
    span1Dom.innerText = options.span1Dom.content
    span1Dom.style.color = options.span1Dom.color
    span1Dom.style.fontSize = options.span1Dom.fontSize
    el.appendChild(span1Dom)
    this.wrapper.appendChild(el)

    return {el, span0Dom, span1Dom}
  }
}