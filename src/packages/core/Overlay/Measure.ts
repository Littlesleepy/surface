/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 10:19:34
 * @FilePath: \zxi-device\src\packages\core\Overlay\Measure.ts
 * @Description: 
 */
import { IOffsetPosition, Listen } from '../Event'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { IInfoTagOptions, InfoTag } from './InfoTag'
import { IPositionResult } from '../ViewHCI/types'
import { Overlay, IOverlayOptions } from './Overlay'
import { IRegionOptions, Region } from './Region'
import { UseTheme } from '../../styles'

export type IMeasureOptions =  {
  lock?: boolean
  region: IRegionOptions
  infoTag?: IInfoTagOptions
} & IOverlayOptions

export class Measure {
  readonly region: Region
  /**
   * @description: 框选结果
   */  
  positionResult = new Map<string, IPositionResult>()

  afterTrigger = new Map<string, (positions: Map<string, IPositionResult>) => void>()

  afterEnd = new Map<string, (positions: Map<string, IPositionResult>) => void>()

  afterClose = new Map<string, () => void>()
  /**
   * @description: 开启框选功能回调
   */
  afterOpen = new Map<string, () => void>()

  readonly scene: Scene
  /**
   * @description: 外层容器
   */  
  readonly wrapper: HTMLDivElement
  /**
   * @description: 信息显示器
   */  
  readonly infoTag: {
    instance: InfoTag
    removed: boolean
  }
  /**
   * @description: 配置
   */
  readonly options: {
    lock: boolean
    region: {
      transverseTag: {
        backgroundColor: string
        selectColor: string
        width: number
      }
      verticalTag: {
        backgroundColor: string
        selectColor: string
        width: number
      }
      center: {
        backgroundColor: string
        border: {
          width: number
          style: string
          color: string
        }
      },
      showTags: Set<string>
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
      transverseTag: {
        backgroundColor: UseTheme.theme.var.tagBgColor,
        selectColor: UseTheme.theme.var.tagSelectColor,
        width: 1
      },
      verticalTag: {
        backgroundColor: UseTheme.theme.var.color,
        selectColor: UseTheme.theme.var.tagSelectColor,
        width: 1
      },
      center: {
        backgroundColor: 'rgba(120, 120, 120, .2)',
        border: {
          width: 2,
          style: 'solid',
          color: 'rgb(120, 120, 120)'
        }
      },
      showTags: new Set([
        Region.CENTER
      ])
    },
    infoTag: {
      width: 250,
      height: 96,
      backgroundColor: UseTheme.theme.var.tipBgColor,
      color:  UseTheme.theme.var.tipColor,
      borderRadius: '10px'
    },
    closeButton: {
      show: true,
      color: UseTheme.theme.var.color,
      className: 'icon-guanbi',
      fontSize: '25px',
      top: '10px',
      right: '10px',
      zIndex: '100'
    }
  }

  readonly container: HTMLElement

  /**
   * @description: 当前交互方式手指|鼠标
   */ 
  private mouseOrTouch = Listen.MOUSE

  private manager = new Set<string>([
    Listen.MOUSEDOWN, Listen.MOUSEMOVE, Listen.MOUSEUP, Listen.MOUSELEAVE,
    Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND, Listen.CONTEXTMENU
  ])

  private mouseActivation = false

  private baseOverlay: Overlay

  /**
   * @description: 是否开启
   */
  status = Overlay.CLOSE

  constructor (scene: Scene, options?: IMeasureOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
      
      if (options.infoTag) {
        this.options.infoTag.fixed = options.infoTag.fixed
      }
    }

    this.baseOverlay = new Overlay(this.options)

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.addEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.addEventListener(Listen.TOUCHEND, this.close, false)

      this.baseOverlay.closeButton.addEventListener(Listen.MOUSEDOWN, (e) => {
        e.stopPropagation()
      })
      this.baseOverlay.closeButton.addEventListener(Listen.TOUCHSTART, (e) => {
        e.stopPropagation()
      })
    }
    
    this.scene = scene

    this.container = scene.container

    this.wrapper = this.baseOverlay.wrapper

    scene.disposeManager.add(() => { this.dispose() })

    for (const key of this.manager) {
      this.wrapper.addEventListener(key, this[key], false)
    }

    this.region = new Region(this.wrapper, this.options.region)

    this.infoTag = {
      instance: new InfoTag(this.wrapper, this.options.infoTag),
      removed: true
    }
  }
  /**
   * @description: 将一个信息容器挂载到信息显示器，（特别的：如果el为undefined，不会替换默认挂载点，但仍然会调用infoTag.afterMount回调函数集）
   * @param {HTMLElement} el 内容节点
   */  
  mountInfoTag (el?: HTMLElement) {
    this.infoTag.instance.mountInfoTag(el)
  }
  /**
   * @description: 开启
   */ 
  open () {
    if (this.status === Overlay.CLOSE) {
      this.container.appendChild(this.wrapper)

      this.status = Overlay.OPEN

      for (const [, fun] of this.afterOpen) {
        fun()
      }
    }
  }
  /**
   * @description: 关闭
   */  
  close = () => {
    if (this.status === Overlay.OPEN) {
      this.showChildren(false)
      this.container.removeChild(this.wrapper)

      for (const [, fun] of this.afterClose) {
        fun()
      }

      this.status = Overlay.CLOSE
    }
  }
  /**
   * @description: 释放资源
   */ 
  dispose = () => {
    for (const key of this.manager) {
      this.wrapper.removeEventListener(key, this[key], false)
    }

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close, false)
    }

    this.region.dispose()
  }

  /**
   * @description: 更新配置，针对对UI有调整的需求
   * @param {IRegionOptions} options 配置
   * @return {*}
   */  
  setOptions (options: IRegionOptions) {
    Public.copyValueFromObject(this.options, options)

    this.region.setOptions(this.options.region)

    this.infoTag.instance.setOptions(this.options.infoTag)
  }
  /**
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    this.infoTag.instance.setContent(content)
  }

  private showChildren (show = true) {
    this.region.showChildren(show)

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
   * @description: 获取鼠标事件偏移位置
   * @param {MouseEvent} e MouseEvent
   * @return {*}
   */  
  private positionTrans = (e: MouseEvent) => {
    const domRect = this.container.getBoundingClientRect()
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
      this.showChildren(false)
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
    this.positionResult = this.region.active(position, this.scene.fence)

    const rightP = this.positionResult.get(Region.RIGHT)!
    const leftP = this.positionResult.get(Region.LEFT)!

    const infoTagPosition = {
      offsetX: rightP.offsetX,
      offsetY: leftP.offsetY
    }

    this.infoTag.instance.setPosition(infoTagPosition, this.mouseOrTouch)

    this.showChildren()

    for (const [, fun] of this.afterTrigger) {
      fun(this.positionResult)
    }
  }

  private move (position: IOffsetPosition) {
    this.positionResult = this.region.trigger(position, this.scene.fence)

    const r1 = this.positionResult.get(Region.BOTTOM)!
    const r2 = this.positionResult.get(Region.RIGHT)!

    const c = this.container

    this.infoTag.instance.setPosition({ offsetX: r2.offsetMiddlePCTX * c.clientWidth, offsetY: r1.offsetMiddlePCTY * c.clientHeight }, this.mouseOrTouch)

    for (const [, fun] of this.afterTrigger) {
      fun(this.positionResult)
    }
  }

  private end () {
    for (const [, fun] of this.afterEnd) {
      fun(this.positionResult)
    }
  }
}