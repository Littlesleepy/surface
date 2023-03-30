/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 10:35:30
 * @FilePath: \zxi-device\src\packages\core\Overlay\Regions.ts
 * @Description: 多框框选
 */

import { Fence } from '../Fence'
import { IOffsetPosition, Listen } from '../Event'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { InfoTag } from './InfoTag'
import { IOverlayOptions, Overlay } from './Overlay'
import { Region } from './Region'
import { UseTheme } from '../../styles'

export type IRegionsOptions = {
  lock?: boolean
  region?: {
    backgroundColor?: string,
    border?: {
      width?: number,
      style?: string,
      color?: string
    }
  } & IOverlayOptions
} & IOverlayOptions

interface IRegion {
  id: string
  instance: Region
  select: (e: MouseEvent | TouchEvent) => void
  deleteBtn?: {
    el: HTMLElement
    mousedown: (e: MouseEvent | TouchEvent) => void
  }
}

export class Regions {
  /**
   * @description: 当前框
   */  
  currentRegion: IRegion | undefined

  readonly manager = new Map<string, IRegion>()

  readonly scene: Scene

  readonly wrapper: HTMLElement

  readonly container: HTMLElement
  /**
   * @description: 信息显示器
   */  
  readonly infoTag: {
    regionId: string | undefined
    instance: InfoTag
    removed: boolean
  }

  readonly options: {
    lock: boolean
    region: {
      backgroundColor: string,
      border: {
        width: number,
        style: string,
        color: string
      },
      closeButton: {
        show: boolean
        color: string
        className: string
        fontSize: string
        top: string
        right: string
        zIndex: string
      }
    },
    infoTag: {
      width: number
      height: number
      backgroundColor: string
      color: string
      borderRadius: string
      fixed?: {
        top?: number
        left?: number
      }
    },
    closeButton: {
      show: boolean
      color: string
      className: string
      fontSize: string
      top: string
      right: string
      zIndex: string
    }
  } = {
    lock: true,
    region: {
      backgroundColor: 'rgba(120, 120, 120, .2)',
      border: {
        width: 2,
        style: 'solid',
        color: UseTheme.theme.var.tagBgColor
      },
      closeButton: {
        show: true,
        color: UseTheme.theme.var.color,
        className: 'icon-guanbi',
        fontSize: '30px',
        top: '-32px',
        right: '-32px',
        zIndex: '100'
      }
    },
    infoTag: {
      width: 250,
      height: 96,
      backgroundColor: UseTheme.theme.var.tipBgColor,
      color: UseTheme.theme.var.tipColor,
      borderRadius: '10px'
    },
    closeButton: {
      show: true,
      color: UseTheme.theme.var.color,
      className: 'icon-guanbi',
      fontSize: '40px',
      top: '10px',
      right: '10px',
      zIndex: '100'
    }
  }
  /**
   * @description: 框选触发或者无框选（如果id和pregion为undefined）目标回调
   */  
  afterTrigger = new Map<string, (id: string, region: Region) => void>()
  /**
   * @description: 框选结束回调
   */
  afterEnd = new Map<string, (id: string, region: Region) => void>()
  /**
   * @description: 选中框或者无选中（如果id和pregion为undefined）回调
   */
  afterSelect = new Map<string, (id?: string, region?: Region) => void>()
  /**
   * @description: 关闭框选功能回调
   */
  afterClose = new Map<string, () => void>()
  /**
   * @description: 开启框选功能回调
   */
  afterOpen = new Map<string, () => void>()
  /**
   * @description: 清除所有框选回调
   */
  afterClear = new Map<string, () => void>()

  /**
   * @description: 当前交互方式手指|鼠标
   */ 
  private mouseOrTouch = Listen.MOUSE

  private managerEvent = new Set<string>([
    Listen.MOUSEDOWN, Listen.MOUSEMOVE, Listen.MOUSEUP, Listen.MOUSELEAVE,
    Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND, Listen.CONTEXTMENU
  ])

  private baseOverlay: Overlay

  private status = 'close'

  private mouseActivation = false
  /**
   * @description: 点击后是否移动
   */  
  private isMoveEd = false

  constructor (scene: Scene, options?: IRegionsOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    scene.disposeManager.add(() => { this.dispose() })

    this.baseOverlay = new Overlay(this.options)

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.addEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.addEventListener(Listen.TOUCHEND, this.close, false)

      if (this.baseOverlay.closeButton) {
        this.baseOverlay.closeButton.addEventListener(Listen.MOUSEDOWN, (e) => {
          e.stopPropagation()
        })
        this.baseOverlay.closeButton.addEventListener(Listen.TOUCHSTART, (e) => {
          e.stopPropagation()
        })
      }
    }

    this.scene = scene

    this.container = scene.container

    this.wrapper = this.baseOverlay.wrapper

    for (const key of this.managerEvent) {
      this.wrapper.addEventListener(key, this[key], false)
    }

    this.infoTag = {
      instance: new InfoTag(this.wrapper, this.options.infoTag),
      removed: true,
      regionId: undefined
    }

    const fence = scene.fence
    if (fence) {
      fence.afterZoomOrTrans.add(this.afterZoomOrTrans)
    }
  }
  /**
   * @description: 清空所有框选
   */  
  clear () {
    for (const [, item] of this.manager) {
      this.showRegion(item, false)
      const deleteBtn = item.deleteBtn
      if (deleteBtn) {
        deleteBtn.el.removeEventListener(Listen.MOUSEDOWN, deleteBtn.mousedown)
        deleteBtn.el.removeEventListener(Listen.TOUCHSTART, deleteBtn.mousedown)
      }
    }

    this.manager.clear()
    this.currentRegion = undefined

    for (const [, fun] of this.afterSelect) {
      fun()
    }

    this.showInfoTag(false)
    this.infoTag.regionId = undefined

    for (const [, fun] of this.afterClear) {
      fun()
    }
  }
  /**
   * @description: 开启
   */ 
  open () {
    if (this.status === 'close') {
      this.container.appendChild(this.wrapper)

      this.status = 'open'

      for (const [, fun] of this.afterOpen) {
        fun()
      }
    }
  }
  /**
   * @description: 关闭
   */  
  close = () => {
    if (this.status === 'open') {
      this.clear()

      this.container.removeChild(this.wrapper)

      for (const [, fun] of this.afterClose) {
        fun()
      }

      this.status = 'close'
    }
  }

  /**
   * @description: 释放资源
   */ 
  dispose = () => {
    this.clear()

    for (const key of this.managerEvent) {
      this.wrapper.removeEventListener(key, this[key], false)
    }

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close, false)
    }

    if (this.currentRegion) this.currentRegion.instance.dispose()
  }
  /**
   * @description: 将一个信息容器挂载到信息显示器，（特别的：如果el为undefined，不会替换默认挂载点，但仍然会调用infoTag.afterMount回调函数集）
   * @param {HTMLElement} el 内容节点
   */  
  mountInfoTag (el?: HTMLElement) {
    this.infoTag.instance.mountInfoTag(el)
  }
  /**
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    this.infoTag.instance.setContent(content)
  }
  /**
   * @description: 缩放或者平移后重新设置所有框选的大小
   */  
  private afterZoomOrTrans = () => {
    const fence = this.scene.fence
    if (fence) {
      const tags = new Map()
      if (fence.direction === Fence.TRANSVERSE) {
        tags.set(Region.LEFT, undefined)
        tags.set(Region.RIGHT, undefined)
      } else {
        tags.set(Region.TOP, undefined)
        tags.set(Region.BOTTOM, undefined)
      }

      for (const [, item] of this.manager) {
        item.instance.setStyleByDataIndex(fence, tags)
      }

      // 设置infotag位置
      if (this.infoTag.regionId) this.showInfoTag()
      
      if (!this.infoTag.removed && this.currentRegion) {
        // 检查当前选中框选，是否隐藏infotag
        if (this.infoTag.regionId) {
          const region = this.currentRegion.instance
          const tags = region.getRgionValue()

          const left = tags.get(Region.LEFT)!.positionResult.offsetX
          const right = tags.get(Region.RIGHT)!.positionResult.offsetX
          const top = tags.get(Region.TOP)!.positionResult.offsetY
          const bottom = tags.get(Region.BOTTOM)!.positionResult.offsetY

          if (left > this.container.clientWidth || right < 0 || bottom < 0 || top > this.container.clientHeight) {
            this.showInfoTag(false)
          }
        }
        // 右下角位置
        this.setInfoTagPosition(this.currentRegion.instance, Listen.MOUSE)
      }
    }
  }

  /**
   * @description: 获取鼠标事件偏移位置
   * @param {MouseEvent} e MouseEvent
   * @return {*}
   */  
  private positionTrans = (e: MouseEvent) => {
    const domRect = this.wrapper.getBoundingClientRect()
    return {
      offsetX: e.clientX - domRect.left,
      offsetY: e.clientY - domRect.top
    }
  }

  private contextmenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  private mousedown = (e: MouseEvent) => {
    if (this.options.lock) return
    this.mouseActivation = true

    e.preventDefault()

    if (e.buttons === 1) {
      e.stopPropagation()

      const position = this.positionTrans(e)

      this.active(position)
    }
  }

  private mousemove = (e: MouseEvent) => {
    if (this.options.lock || !this.mouseActivation) return
    e.preventDefault()

    if (e.buttons === 1) {
      e.stopPropagation()

      const position = this.positionTrans(e)

      this.move(position)
    }
  }

  private mouseup = (e: MouseEvent) => {
    if (this.options.lock || !this.mouseActivation) return
    this.mouseActivation = false

    this.end()
  }

  private mouseleave = (e: MouseEvent) => {
    if (this.options.lock || !this.mouseActivation) return
    this.mouseActivation = false

    this.end()
  }

  private touchstart = (e: TouchEvent) => {
    if (this.options.lock) return

    this.mouseOrTouch = Listen.TOUCH

    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      e.stopPropagation()

      const position = result.get(0)!

      this.active(position)
    } else {
      this.showInfoTag(false)
      this.infoTag.regionId = undefined

      if (this.currentRegion) {
        this.showRegion(this.currentRegion, false)

        this.currentRegion = undefined
        for (const [, fun] of this.afterSelect) {
          fun()
        }
      }
    }
  }

  private touchmove = (e: TouchEvent) => {
    if (this.options.lock) return

    if (e.touches.length === 1) {
      e.stopPropagation()
    }

    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      const position = result.get(0)!

      this.move(position)
    }
  }

  private touchend = (e: TouchEvent) => {
    if (this.options.lock) return

    this.end()
  }

  private active (position: IOffsetPosition) {
    this.isMoveEd = false
    // 创建框选
    const {instance, id, select }  = this.createRegion()

    this.currentRegion = { id, instance, select }

    this.infoTag.regionId = id

    this.manager.set(id, this.currentRegion)

    const positionResult = instance.active(position, this.scene.fence)

    const rightP = positionResult.get(Region.RIGHT)!
    const leftP = positionResult.get(Region.LEFT)!

    const infoTagPosition = {
      offsetX: rightP.offsetX,
      offsetY: leftP.offsetY
    }
    this.infoTag.instance.setPosition(infoTagPosition, this.mouseOrTouch)

    instance.showChildren()
    this.showInfoTag(false)

    for (const [, fun] of this.afterSelect) {
      fun()
    }
  }

  private move (position: IOffsetPosition) {
    if (this.currentRegion) {
      this.isMoveEd = true

      this.showInfoTag()

      this.currentRegion.instance.trigger(position, this.scene.fence)

      this.setInfoTagPosition(this.currentRegion.instance, this.mouseOrTouch)

      for (const [, fun] of this.afterTrigger) {
        fun(this.currentRegion.id, this.currentRegion.instance)
      }
    }
  }

  private end () {
    if (this.currentRegion) {
      if (!this.isMoveEd) {
        this.showRegion(this.currentRegion, false)

        const deleteBtn = this.currentRegion.deleteBtn
        if (deleteBtn) {
          deleteBtn.el.removeEventListener(Listen.MOUSEDOWN, deleteBtn.mousedown)
          deleteBtn.el.removeEventListener(Listen.TOUCHSTART, deleteBtn.mousedown)
        }

        this.showInfoTag(false)
        this.infoTag.regionId = undefined
      } else {
        for (const [, fun] of this.afterEnd) {
          fun(this.currentRegion.id, this.currentRegion.instance)
        }
      }
    }
  }
  /**
   * @description: 创建框选
   */  
  private createRegion (): IRegion {
    if (this.currentRegion) {
      const region = this.currentRegion.instance
      region.center.el.style.borderColor = region.options.center.border.color
    }
    // 创建框选
    const instance = new Region(this.wrapper, {
      center: this.options.region,
      showTags: new Set([Region.CENTER])
    })
    instance.center.el.style.borderColor = UseTheme.theme.var.tagSelectColor

    const id = Public.guid()

    // 选中框选框
    const select = (e: MouseEvent | TouchEvent) => {
      let type = Listen.MOUSE

      if ('touches' in e) {
        e.stopPropagation()

        type = Listen.TOUCH
      } else {
        if (e.buttons === 1) e.stopPropagation()
      }

      this.infoTag.regionId = id
      this.showInfoTag()

      this.setInfoTagPosition(instance, type)

      if (this.currentRegion) {
        const region = this.currentRegion.instance
        region.center.el.style.borderColor = region.options.center.border.color
      }

      instance.center.el.style.borderColor = UseTheme.theme.var.tagSelectColor
      this.currentRegion = result
      // 选中执行回调
      for (const [, fun] of this.afterSelect) {
        fun(this.currentRegion.id, this.currentRegion.instance)
      }
    }

    instance.center.el.addEventListener(Listen.MOUSEDOWN, select)
    instance.center.el.addEventListener(Listen.TOUCHSTART, select)

    const result: IRegion = {
      id,
      instance,
      select
    }

    // 添加删除按钮
    const btnOptions = this.options.region.closeButton
    if (btnOptions.show) {
      const deleteBtn = document.createElement('i')
      deleteBtn.classList.add(...['iconfont', btnOptions.className])
      deleteBtn.style.cssText = `
        position: absolute;
        display: block;
        cursor: pointer;
        color:${btnOptions.color};
        font-size:${btnOptions.fontSize};
        top:${btnOptions.top};
        right:${btnOptions.right};
        zIndex:${btnOptions.zIndex};
      `
      instance.center.el.appendChild(deleteBtn)

      const mousedown = (e: MouseEvent | TouchEvent) => {
        e.stopPropagation()

        this.showRegion(result, false)

        deleteBtn.removeEventListener(Listen.MOUSEDOWN, mousedown)
        deleteBtn.removeEventListener(Listen.TOUCHSTART, mousedown)

        if (this.currentRegion && id === this.currentRegion.id) {
          this.currentRegion = undefined

          for (const [, fun] of this.afterSelect) {
            fun()
          }
        }

        if (this.infoTag.regionId === id) {
          this.infoTag.regionId = undefined
          this.showInfoTag(false)
        }
      }

      deleteBtn.addEventListener(Listen.MOUSEDOWN, mousedown)
      deleteBtn.addEventListener(Listen.TOUCHSTART, mousedown)

      result.deleteBtn = {
        el: deleteBtn,
        mousedown
      }
    }

    return result
  }

  private showInfoTag (show = true) {
    if (show) {
      if (this.infoTag.removed) {
        this.infoTag.instance.append()
        this.infoTag.removed = false
      }
    } else {
      if (!this.infoTag.removed) {
        this.infoTag.instance.remove()
        this.infoTag.removed = true
      }
    }
  }
  /**
   * @description: 将infotag设置到框选右下角
   * @param {Region} region
   * @param {string} type
   * @return {*}
   */  
  private setInfoTagPosition (region: Region, type: string) {
    const positionResult = region.positionResult

    const r1 = positionResult.get(Region.BOTTOM)!
    const r2 = positionResult.get(Region.RIGHT)!

    const c = this.container

    this.infoTag.instance.setPosition({ offsetX: r2.offsetMiddlePCTX * c.clientWidth, offsetY: r1.offsetMiddlePCTY * c.clientHeight }, type)
  }
  /**
   * @description: 显示和隐藏region
   * @param {IRegion} region
   * @param {*} show
   * @return {*}
   */  
  private showRegion (region: IRegion, show = true) {
    region.instance.showChildren(show)
    if (!show) {
      this.manager.delete(region.id)
      region.instance.center.el.removeEventListener(Listen.MOUSEDOWN, region.select)
      region.instance.center.el.removeEventListener(Listen.TOUCHSTART, region.select)
    }
  }
}
