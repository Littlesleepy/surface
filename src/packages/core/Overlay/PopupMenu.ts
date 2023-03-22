/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-20 15:32:11
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\core\Overlay\PopupMenu.ts
 * @Description: 
 */
/*
 * @Author: shiershao
 * @Date: 2022-06-22 11:13:41
 * @LastEditTime: 2022-06-23 15:10:09
 * @Description: 弹出菜单
 * 
 */

import { Listen } from '../Event'
import { Public } from '../Tools'
import { UseTheme } from '../../styles'
/**
 * @description: 相对窗口位置
 */
export interface IClientPosition {
  /**
   * @description: 相对窗口位置X
   */  
  clientX: number
  /**
   * @description: 相对窗口位置y
   */
  clientY: number
}

export interface IPopupMenuOptions {
  width?: number
  height?: number
  backgroundColor?: string
  borderRadius?: string
  closeButton?: boolean
  drag?: boolean
}

export class PopupMenu {
  readonly afterClose = new Map<string, () => void>()

  readonly afterOpen = new Map<string, () => void>()

  readonly container = document.body

  readonly infoTag: {
    instance: HTMLDivElement
    removed: boolean
  }

  readonly closeButton: HTMLElement | undefined

  readonly options = {
    width: 200,
    height: 100,
    backgroundColor: UseTheme.theme.var.tipBgColor,
    borderRadius: '10px',
    closeButton: true,
    zIndex: 9999,
    drag: false
  }

  /**
   * @description: 手指触发菜单后延迟500ms才能移除菜单
   */  
  private canRemove = false
  /** 
   * @description: 是否选中infotag
   */  
  private selectInfotag = false

  private selectPosition: IClientPosition | undefined

  constructor (options?: IPopupMenuOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    const instance = document.createElement('div')
    instance.style.cssText = `
      width: ${this.options.width}px;
      height: ${this.options.height}px;
      background-color: ${this.options.backgroundColor};
      border-radius: ${this.options.borderRadius};
      z-index: ${this.options.zIndex};
      position: fixed;
      box-sizing: border-box;
    `

    if (this.options.closeButton) {
      this.closeButton = document.createElement('i')

      this.closeButton.classList.add(...['iconfont', 'icon-guanbi'])

      this.closeButton.style.cssText = `
        font-size: 20px;
        position: absolute;
        top: -15px;
        right: -15px;
        cursor: pointer;
        z-index: 100;
        color: ${UseTheme.theme.var.tipBgColor};
      `
      instance.appendChild(this.closeButton)

      this.closeButton.addEventListener(Listen.CLICK, this.close)
    }

    this.infoTag = {
      instance,
      removed: true
    }

    instance.addEventListener(Listen.MOUSEDOWN, this.stopPropagation)
    instance.addEventListener(Listen.TOUCHSTART, this.stopPropagation)
    instance.addEventListener(Listen.MOUSEMOVE, this.mouseover)
    instance.addEventListener(Listen.MOUSEDOWN, this.mousedown)
    instance.addEventListener(Listen.MOUSEUP, this.mouseup)
    instance.addEventListener(Listen.TOUCHSTART, this.touchstart)
    instance.addEventListener(Listen.TOUCHEND, this.touchend)

    window.addEventListener(Listen.MOUSEDOWN, this.remove)
    window.addEventListener(Listen.TOUCHSTART, this.remove)

    window.addEventListener(Listen.MOUSEMOVE, this.move)
    window.addEventListener(Listen.TOUCHMOVE, this.move)
  }
  /**
   * @description: 设置菜单内容
   * @param {HTMLElement} el 包含内容的HTMLElement元素
   * @return {*}
   */  
  setContent (el: HTMLElement) {
    this.infoTag.instance.appendChild(el)
  }
  /** 
   * @description: 根据子元素大小设置容器大小
   * @param {*} w 依据子元素宽度计算宽度
   * @param {*} h 依据子元素高度计算高度
   * @return {*}
   */    
  setWidthHeightAsChild (w = true, h = true) {
    const child = this.infoTag.instance.lastChild as HTMLElement
    const style = this.infoTag.instance.style
    if (w) {
      const width = child.clientWidth
      style.width = width + 'px'
      this.options.width = width
    }

    if (h) {
      const height = child.clientHeight
      style.height = height + 'px'
      this.options.height = height
    }
  }

  /**
   * @description: 触发菜单
   * @param {IClientPosition} position 菜单显示位置
   * @param {string} mouseOrTouch 触发方式，鼠标或者手指
   */  
  trigger (position: IClientPosition, mouseOrTouch: string) {
    this.showInfoTag(true)
    this.setWidthHeightAsChild()

    this.setPosition(position, mouseOrTouch)

    if (mouseOrTouch === Listen.TOUCH) {
      this.canRemove = false
      setTimeout(() => {
        this.canRemove = true
      }, 500)
    }

    for (const [, fun] of this.afterOpen) {
      fun()
    }
  }
  /**
   * @description: 关闭菜单
   */  
  close = () => {
    this.showInfoTag(false)
  }

  /**
   * @description: 释放资源
   * @return {*}
   */  
  dispose () {
    const instance = this.infoTag.instance
    instance.removeEventListener(Listen.MOUSEDOWN, this.stopPropagation)
    instance.removeEventListener(Listen.TOUCHSTART, this.stopPropagation)
    instance.removeEventListener(Listen.MOUSEMOVE, this.mouseover)
    instance.removeEventListener(Listen.MOUSEDOWN, this.mousedown)
    instance.removeEventListener(Listen.MOUSEUP, this.mouseup)
    instance.removeEventListener(Listen.TOUCHSTART, this.touchstart)
    instance.removeEventListener(Listen.TOUCHEND, this.touchend)
    
    window.removeEventListener(Listen.MOUSEDOWN, this.remove)
    window.removeEventListener(Listen.TOUCHSTART, this.remove)
    window.removeEventListener(Listen.MOUSEMOVE, this.move)
    window.removeEventListener(Listen.TOUCHMOVE, this.move)

    if (this.closeButton) this.closeButton.removeEventListener(Listen.CLICK, this.close)
  }

  /**
   * @description: 设置tag位置
   * @param {IPosition} position 位置
   * @param {string} type 事件类型，Listen.TOUCH | Listen.MOUSE
   */  
  private setPosition (position: IClientPosition, type: string) {
    const infoTagOptions = this.options
    const style = this.infoTag.instance.style
    const off = 15
    const clientX = position.clientX
    const clientY = position.clientY

    const containerPosition = this.container.getBoundingClientRect()

    let resultX: number | undefined = clientX + infoTagOptions.width + off

    if (resultX + containerPosition.left > window.innerWidth) {
      resultX = clientX - infoTagOptions.width - off
      if (resultX < 0 && resultX + containerPosition.left < 0) {
        resultX = undefined
      }
    } else {
      resultX -= infoTagOptions.width
    }

    let resultY: number | undefined
    if (type === 'mouse') {
      resultY = clientY + infoTagOptions.height + off
      if (resultY + containerPosition.top > window.innerHeight) {
        resultY = clientY - infoTagOptions.height - off
        if (resultY < 0 && resultY + containerPosition.top < 0) {
          resultY = undefined
        }
      } else {
        resultY -= infoTagOptions.height
      }
    } else {
      resultY = clientY - infoTagOptions.height - off
      if (resultY < 0 && resultY + containerPosition.top < 0) {
        resultY = clientY + off
        if (resultY + containerPosition.top > window.innerHeight) {
          resultY = undefined
        }
      }
    }

    if (resultX === undefined) {
      resultX = this.container.clientWidth / 2 - infoTagOptions.width / 2
    }

    if (resultY === undefined) {
      resultY = this.container.clientHeight / 2 - infoTagOptions.height / 2
    }

    const min_left = -(off + infoTagOptions.width)
    if (resultX < min_left) resultX = min_left
    const max_left = off + this.container.clientWidth
    if (resultX > max_left) resultX = max_left
    style.left = resultX / this.container.clientWidth * 100 + '%'

    const min_top = -(off + infoTagOptions.height)
    if (resultY < min_top) resultY = min_top
    const max_top = off + this.container.clientHeight
    if (resultY > max_top) resultY = max_top
    style.top = resultY / this.container.clientHeight * 100 + '%'
  }

  private stopPropagation = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation()
  }

  private remove = (e: MouseEvent | TouchEvent) => {
    if (!this.infoTag.removed) {
      // 手指激发后500ms才能移除
      if ('touches' in e) {
        if (this.canRemove) {
          this.selectInfotag = false
          document.body.removeChild(this.infoTag.instance)
          this.infoTag.removed = true
          for (const [, fun] of this.afterClose) {
            fun()
          }
        }
      } else {
        this.selectInfotag = false
        document.body.removeChild(this.infoTag.instance)
        this.infoTag.removed = true
        for (const [, fun] of this.afterClose) {
          fun()
        }
      }
    }
  }

  private showInfoTag (show: boolean) {
    if (show && this.infoTag.removed) {
      this.infoTag.instance.append()
      document.body.appendChild(this.infoTag.instance)
      this.infoTag.removed = false
    }

    if (!show && !this.infoTag.removed) {
      document.body.removeChild(this.infoTag.instance)
      this.infoTag.removed = true

      for (const [, fun] of this.afterClose) {
        fun()
      }
    }
  }
  
  private mouseover = () => {
    this.infoTag.instance.style.cursor = 'grab'
  }

  private mousedown = (e: MouseEvent) => {
    if (!this.options.drag) return
    this.selectInfotag = true
    this.selectPosition = { clientX: e.clientX, clientY: e.clientY }
    this.infoTag.instance.style.cursor = 'grabbing'
  }

  private mouseup = () => {
    this.selectInfotag = false
    this.selectPosition = undefined
    this.infoTag.instance.style.cursor = 'grab'
  }

  private touchstart = (e: TouchEvent) => {
    if (!this.options.drag) return
    this.selectInfotag = true
    const touch = e.touches[0]
    this.selectPosition = { clientX: touch.clientX, clientY: touch.clientY }
  }

  private touchend = () => {
    this.selectInfotag = false
    this.selectPosition = undefined
  }


  private move = (e: MouseEvent | TouchEvent) => {
    if (this.selectInfotag && this.selectPosition) {
      this.infoTag.instance.style.cursor = 'grabbing'
      const type = ('touches' in e) ? Listen.TOUCH : Listen.MOUSE
      const p: IClientPosition = { clientX: 0, clientY: 0 }
      if (type === Listen.MOUSE) {
        const ev = e as MouseEvent
        p.clientX = ev.clientX
        p.clientY = ev.clientY
      } else {
        const ev = e as TouchEvent
        const touch = ev.touches[0]
        p.clientX = touch.clientX
        p.clientY = touch.clientY
      }

      const dsX = p.clientX - this.selectPosition.clientX
      const dsY = p.clientY - this.selectPosition.clientY

      const instance = this.infoTag.instance

      const offsetX = (instance.offsetLeft + dsX) / this.container.clientWidth * 100 +'%'
      const offsetY = (instance.offsetTop + dsY) / this.container.clientHeight * 100 +'%'

      instance.style.left = offsetX
      instance.style.top = offsetY

      this.selectPosition = p
    }
  }
}
