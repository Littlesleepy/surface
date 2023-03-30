/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 15:05:32
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 11:32:26
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\Overlay\Caliper.ts
 * @Description: 
 */
import { FencesType, IInfoTagOptions, InfoTag, IOffsetPosition, IPositionResult, Listen, Scene, Tag } from ".."
import { UseTheme } from "../../styles"
import { Public } from "../Tools"
import { IOverlayOptions, Overlay } from "./Overlay"

export type ICaliperOptions = {
  offset?: number
  scene?: Scene
  infoTag?: IInfoTagOptions & { show?: boolean }
} & IOverlayOptions

export class Caliper {
  readonly options = {
    offset: 0.5,
    infoTag: {
      show: true,
      width: 250,
      height: 36,
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
   * @description: 外层容器
   */  
  readonly wrapper: HTMLDivElement

  private baseOverlay: Overlay

  readonly container: HTMLElement

  readonly scene: Scene | undefined

  readonly tag: {
    instance: Tag
    remove: boolean
  }

  /**
   * @description: 是否开启
   */
  status = Overlay.CLOSE

  private hasInit = false

  /**
   * @description: 打开筛选功能回调函数集
   */
  afterOpen = new Map<string, (positions: IPositionResult) => void>()
  /**
   * @description: 触发筛选回调函数集
   */  
  afterTrigger = new Map<string, (positions: IPositionResult) => void>()
  /**
   * @description: 结束筛选回调函数集
   */  
  afterEnd = new Map<string, (positions: IPositionResult) => void>()
  /**
   * @description: 关闭筛选功能回调函数集
   */  
  afterClose = new Map<string, () => void>()

  positionResult: IPositionResult | undefined

  /**
   * @description: 信息显示器
   */  
  readonly infoTag?: InfoTag

  constructor (mount: HTMLElement, options?: ICaliperOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)

      if (options.scene) this.scene = options.scene
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

    this.wrapper = this.baseOverlay.wrapper

    this.container = mount

    const instance = new Tag(this.wrapper, {
      drag: true,
      ddPoint: {
        show: true
      },
      fence: this.scene?.fence
    })
    if (this.scene) this.scene.afterShareFence.add((fence) => {
      instance.fence = fence
    })
    instance.append()

    instance.afterMove.set('caliper', (position) => {
      if (this.infoTag) {
        this.infoTag.setPosition(position, instance.mouseOrTouch)
      }

      this.positionResult = position
      for (const [, fun] of this.afterTrigger) {
        fun(this.positionResult)
      }
    })

    // 结束移动回调
    instance.afterEnd.set('caliper', (position) => {
      this.positionResult = position
      for (const [, fun] of this.afterEnd) {
        fun(this.positionResult)
      }
    })

    this.tag = {
      instance,
      remove: true
    }

    // 信息提示框
    if (this.options.infoTag.show) {
      this.infoTag = new InfoTag(this.wrapper, this.options.infoTag)

      this.infoTag.append()
    }
  }

  open = () => {
    if (this.status === Overlay.CLOSE) {
      this.container.appendChild(this.wrapper)

      this.status = Overlay.OPEN

      this.init()

      for (const [, fun] of this.afterOpen) {
        fun(this.positionResult!)
      }

      if (this.infoTag) {
        this.infoTag.setPosition(this.positionResult!, this.tag.instance.mouseOrTouch)
      }
    }
  }

  close = () => {
    if (this.status === Overlay.OPEN) {
      this.container.removeChild(this.wrapper)

      this.status = Overlay.CLOSE

      for (const [, fun] of this.afterClose) {
        fun()
      }
    }
  }

  dispose () {
    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close, false)
    }
  }

  /**
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    if (this.infoTag) this.infoTag.setContent(content)
  }

  private init () {
    if (!this.hasInit) {
      const options = this.options
      const position: IOffsetPosition = { offsetX: 0, offsetY: 0 }

      position.offsetX = options.offset * this.container.clientWidth
      position.offsetY = this.container.clientHeight / 2
      
      this.tag.instance.setPosition(position, this.scene?.fence, false, false)
      this.positionResult = this.tag.instance.positionResult
      this.hasInit = true
    }
  }
}