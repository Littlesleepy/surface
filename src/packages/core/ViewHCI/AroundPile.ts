/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-23 16:20:34
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\ViewHCI\AroundPile.ts
 * @Description: 旋转测量方位角
 */
import { IOffsetPosition, Listen } from '../Event'
import { InfoTag } from '../Overlay'
import { Public } from '../Tools'
import { UseTheme } from '../../styles'

export interface IAroundPileOptions {
  pointer?: {
    backgroundColor?: string
  }
}

export class AroundPile {
  readonly options = {
    pointer: {
      backgroundColor: UseTheme.theme.var.color
    }
  }

  readonly event: Listen

  readonly container: HTMLElement

  readonly pointer: {
    el: HTMLSpanElement
    removed: boolean
    /**
     * @description: 指针实际旋转角度
     */    
    rotateAngle: number
    /**
     * @description: 相对于起始刻度方位角
     */    
    azimuthAngle: number
  }

  readonly infoTag: {
    instance: InfoTag
    removed: boolean
  }

  private manager = new Set<string>([
    Listen.MOUSEDOWN, Listen.MOUSELEAVE, Listen.MOUSEMOVE, Listen.MOUSEUP,
    Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND
  ])

  private hasActive = false

  private labelContent = new Map()

  /**
   * @description: 起始刻度旋转角，正值顺时针旋转，负值逆时针旋转，外部主动设置
   */  
  private offsetAngle: number

  constructor (container: HTMLElement, options?: IAroundPileOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.offsetAngle = 0

    this.container = container
    container.style.touchAction = 'none'

    this.event = new Listen(container)

    this.pointer = {
      el: document.createElement('span'),
      removed: true,
      rotateAngle: 0,
      azimuthAngle: 0
    }

    const pStyle = this.pointer.el.style
    const pointerOptions = this.options.pointer
    pStyle.cssText = `
      position: absolute;
      top: 0px;
      left: calc(50% - 0.5px);
      transform-origin: 0 100%;
      box-sizing: border-box;
      width: 1px;
      height: 50%;
      background-color:${pointerOptions.backgroundColor};
    `
    const circle = document.createElement('span')
    circle.style.cssText = `
      position: absolute;
      top: calc(50% - 5px);
      left: calc(50% - 5px);
      width: 10px;
      height: 10px;
      background-color: ${pointerOptions.backgroundColor};
      border-radius: 10px;
    `
    this.container.appendChild(circle)

    this.infoTag = {
      instance: new InfoTag(this.container, { width: 80, height: 36 }),
      removed: true
    }

    for (const key of this.manager) {
      this.event[key].add(this[key])
    }
  }
  /**
   * @description: 控制指针旋转
   * @param {number} angle 旋转角度(度)
   */ 

  /**
   * @description: 控制指针旋转
   * @param {number} angle 旋转角度(度)
   * @param {string} type 交互类型Listen.MOUSE|Listen.TOUCH，默认Listen.MOUSE
   */  
  rotatePointer (angle: number, type = Listen.MOUSE) {
    if (!this.pointer.removed) {
      const style = this.pointer.el.style
      style.transform = `rotate(${angle}deg)`

      const r = this.pointer.el.clientHeight
      const radian = angle / 180 * Math.PI
      const dx = r * Math.sin(radian)
      const dy = r * Math.cos(radian)

      const position = {
        offsetX: r + dx,
        offsetY: r - dy
      }

      this.infoTag.instance.setPosition(position, type)
      this.labelContent.set('1', { info: angle.toFixed(1) + '°' })
      this.infoTag.instance.setContent(this.labelContent)
    }
  }
  /**
   * @description: 释放资源
   */  
  dispose () {
    this.event.dispose()
  }
  /**
   * @description: 设置起始刻度旋转角
   * @param {number} angle 角度
   */  
  setOffsetAngle (angle: number) {
    this.offsetAngle = angle

    let azimuthAngle = this.pointer.rotateAngle - this.offsetAngle
    if (azimuthAngle < 0) { azimuthAngle += 360 }

    this.pointer.azimuthAngle = azimuthAngle
    if (!this.infoTag.removed) {
      this.labelContent.set('1', { info: azimuthAngle.toFixed(1) + '°' })
      this.infoTag.instance.setContent(this.labelContent)
    }
  }

  private mousedown = (e: MouseEvent) => {
    if (e.buttons === 1) {
      this.start()

      const position = this.event.positionTrans(e)

      this.trigger(position)
    }
  }
  private mousemove = (e: MouseEvent) => {
    if (e.buttons === 1) {
      if (this.hasActive) {
        const position = this.event.positionTrans(e)

        this.trigger(position)
      }
    }
  }
  private mouseup = () => {
    this.end()
  }

  private mouseleave = () => {
    this.end()
  }

  private touchstart = () => {
    if (this.event.touchPosition.size === 1) {
      this.start()

      const position = this.event.touchPosition.get(0)!

      this.trigger(position, Listen.TOUCH)
    }
  }
  private touchmove = () => {
    if (this.hasActive) {
      if (this.event.touchPosition.size === 1) {
        const position = this.event.touchPosition.get(0)!

        this.trigger(position, Listen.TOUCH)
      }

      if (this.event.touchPosition.size === 0) {
        this.end()
      }
    }
  }
  private touchend = () => {
    if (this.event.touchPosition.size === 0) {
      this.end()
    }
  }

  private trigger (position: IOffsetPosition, type = Listen.MOUSE) {
    // 最大半径
    const r = this.container.clientWidth / 2
    const dx = position.offsetX - r
    const dy = position.offsetY - r
    let tan = Math.atan(dx / dy) // 弧度
    if (dx > 0 && dy < 0) { // 一象限
      tan = -tan
    } else if (dx >= 0 && dy >= 0) { // 二象限
      tan = Math.PI - tan
    } else if (dx < 0 && dy > 0) { // 三象限
      tan = Math.PI - tan
    } else { // 四象限
      tan = 2 * Math.PI - tan
    }
    const angle = tan * 180 / Math.PI
    // 指针旋转位置
    const style = this.pointer.el.style
    style.transform = `rotate(${angle}deg)`

    this.pointer.rotateAngle = angle
    let azimuthAngle = angle - this.offsetAngle
    if (azimuthAngle < 0) { azimuthAngle += 360 }

    this.pointer.azimuthAngle = azimuthAngle

    this.infoTag.instance.setPosition(position, type)
    this.labelContent.set('1', { info: azimuthAngle.toFixed(1) + '°' })
    this.infoTag.instance.setContent(this.labelContent)
  }

  private start () {
    this.hasActive = true

    if (this.pointer.removed) {
      this.container.appendChild(this.pointer.el)

      this.pointer.removed = false
    }

    if (this.infoTag.removed) {
      this.infoTag.instance.append()

      this.infoTag.removed = false
    }
  }

  private end () {
    if (this.hasActive) {
      if (!this.infoTag.removed) {
        this.infoTag.instance.remove()
        this.infoTag.removed = true
      }

      if (!this.pointer.removed) {
        this.container.removeChild(this.pointer.el)
        this.pointer.removed = true
      }

      this.hasActive = false
    }
  }
}