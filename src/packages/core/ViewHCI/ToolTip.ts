/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-10 10:14:02
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\core\ViewHCI\ToolTip.ts
 * @Description: 
 */
import { Scene } from '../Scene'
import { IOffsetPosition, Listen} from '../Event'
import { Public } from '../Tools'
import { IPositionResult, IViewHCI } from './types'
import { Fence } from '../Fence'
import { IInfoTagOptions, InfoTag } from '../Overlay/InfoTag'
import { Tag, ITagOptions } from './Tag'
import { UseTheme } from '../../styles'

export interface IToolTipOptions {
  lock?: boolean
  lockKey?: string
  type?: string
  transverseTag?: {
    backgroundColor?: string
    width?: number
    lock?: {
      show?: boolean
      icon?: string
      fontSize?: number
      color?: string
    }
  }
  verticalTag?: {
    backgroundColor?: string
    width?: number
    lock?: {
      show?: boolean
      icon?: string
      fontSize?: number
      color?: string
    }
  }
  infoTag?: IInfoTagOptions
  throttle?: number
}

interface ITag  {
  instance: Tag
  removed: boolean
  lock?: HTMLElement
}

export class ToolTip implements IViewHCI {
  /**
   * @description: 横向
   */  
  static readonly TRANSVERSE = 'transverse'
  /**
   * @description: 竖向
   */ 
  static readonly VERTICAL = 'vertical'
  /**
   * @description: 十字
   */ 
  static readonly CROSS = 'cross'

  readonly scene: Scene

  readonly container: HTMLElement

  readonly event: Listen

  readonly transverseTag: ITag | undefined

  readonly verticalTag: ITag | undefined

  readonly infoTag: {
    instance: InfoTag
    removed: boolean
  }

  readonly options: {
    lock: boolean
    lockKey: string
    type: string
    transverseTag: {
      backgroundColor: string
      width: number
      lock: {
        show: boolean
        icon: string
        fontSize: number
        color: string
      }
    }
    verticalTag: {
      backgroundColor: string
      width: number
      lock: {
        show: boolean
        icon: string
        fontSize: number
        color: string
      }
    }
    infoTag: {
      width: number
      height: number
      backgroundColor: string
      borderRadius: string
      color: string
      zIndex: string
      fixed?: {
        top?: number
        left?: number
      }
    }
    throttle: number
  } = {
    lock: true,
    lockKey: 'Control',
    type: ToolTip.VERTICAL,
    transverseTag: {
      backgroundColor: UseTheme.theme.var.color,
      width: 1,
      lock: {
        show: false,
        icon: 'icon-suoding',
        fontSize: 30,
        color: UseTheme.theme.var.tagBgColor
      }
    },
    verticalTag: {
      backgroundColor: UseTheme.theme.var.color,
      width: 1,
      lock: {
        show: false,
        icon: 'icon-suoding',
        fontSize: 30,
        color: UseTheme.theme.var.tagBgColor
      }
    },
    infoTag: {
      width: 420,
      height: 0,
      backgroundColor: UseTheme.theme.var.tipBgColor,
      borderRadius: '10px',
      color: UseTheme.theme.var.tipColor,
      zIndex: '99999'
    },
    throttle: 60
  }

  /**
   * @description: 第一次触发toolTip后的回调函数集合
   */
  afterActive: Map<string, (position: IPositionResult) => void> = new Map()
  /**
   * @description: 触发toolTip后的回调函数集合
   */  
  afterTrigger: Map<string, (position: IPositionResult) => void> = new Map()
  /**
   * @description: 隐藏toolTip后的回调函数集合
   */
  afterHidden: Map<string, () => void> = new Map()

  private valueTags: Map<string, { el: HTMLSpanElement, mountEl: HTMLElement }> = new Map()

  private linkManager: Map<string,  { target: ToolTip, position: (position: IOffsetPosition) => IOffsetPosition }> = new Map()

  private manager = new Set<string>([
    Listen.MOUSEUP, Listen.MOUSEDOWN, Listen.MOUSEMOVE, Listen.MOUSELEAVE,
    Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND
  ])

  private touchStartSetTime: number | undefined

  private oldTouchMOvePosition: IOffsetPosition | undefined
  /**
   * @description: 已经触屏移动
   */  
  private touchMoved = false
  /**
   * @description: 鼠标激活toolTip
   */  
  private mouseActivation = false
  /**
   * @description: 当前交互方式手指|鼠标
   */ 
  private mouseOrTouch = Listen.MOUSE

  private lockByKeyboard = false

  constructor (scene: Scene, options?: IToolTipOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
      
      if (options.infoTag) {
        this.options.infoTag.fixed = options.infoTag.fixed
      }
    }

    this.scene = scene

    this.container = scene.container

    this.event = scene.event
    
    for (const key of this.manager) {
      this.event[key].add(this[key])
    }

    const verticalTag = {
      instance: new Tag(this.container, this.options.verticalTag),
      removed: true,
      lock: this.createLock(this.options.verticalTag.lock)
    }
    if (verticalTag.lock !== undefined) {
      verticalTag.instance.el.appendChild(verticalTag.lock)
    }
    // 设置为none以免影响双击
    verticalTag.instance.el.style.pointerEvents = 'none'

    const transverseTagOptions: ITagOptions = {
      direction: Fence.TRANSVERSE,
      width: this.options.transverseTag.width,
      backgroundColor: this.options.transverseTag.backgroundColor
    }
    const transverseTag = {
      instance: new Tag(this.container, transverseTagOptions),
      removed: true,
      lock: this.createLock(this.options.transverseTag.lock)
    }
    if (transverseTag.lock !== undefined) {
      transverseTag.instance.el.appendChild(transverseTag.lock)
    }
    // 设置为none以免影响双击
    transverseTag.instance.el.style.pointerEvents = 'none'

    switch (this.options.type) {
    case ToolTip.VERTICAL: {
      this.verticalTag = verticalTag
    }
      break
    case ToolTip.TRANSVERSE: {
      this.transverseTag = transverseTag
    }
      break
    default: {
      this.verticalTag = verticalTag
      this.transverseTag = transverseTag
    }
    }

    this.infoTag = {
      instance: new InfoTag(this.container, this.options.infoTag),
      removed: true
    }

    document.addEventListener('keydown', (e) => {
      if (this.options.lockKey === e.key) {
        this.lockByKeyboard = true
      }
    })

    document.addEventListener('keyup', (e) => {
      if (this.options.lockKey === e.key) {
        this.lockByKeyboard = false
      }
    })
  }

  addOrRemove (name: string, disable: boolean) {
    const set = this.event[name]
    if (set === undefined) throw new Error(`${name}事件不存在`)
    if (disable) {
      set.delete(this[name])
    } else {
      set.add(this[name])
    }
  }
   
  addOrRemoveAll (disable: boolean) {
    if (disable) {
      for (const key of this.manager) {
        this.event[key].delete(this[key])
      }
    } else {
      for (const key of this.manager) {
        this.event[key].add(this[key])
      }
    }
  }

  addlink (key: string, source: { target: ToolTip, position: (p: IOffsetPosition) => IOffsetPosition }) {
    this.linkManager.set(key, source)
  }

  removeLink (key: string) {
    return this.linkManager.delete(key)
  }
  /**
   * @description: 将一个信息容器挂载到信息显示器，（特别的：如果el为undefined，不会替换默认挂载点，但仍然会调用infoTag.afterMount回调函数集）
   * @param {HTMLElement} el 内容节点
   */  
  mountInfoTag (el?: HTMLElement) {
    this.infoTag.instance.mountInfoTag(el)
  }
  /**
   * @description: toolTip设置数据跟踪标记，对CROSS类型无效
   * @param {Map} sources 包含所有要设置标记的数据集，value归一化【0-1】
   */  
  setValueTags (sources: Map<string, { value: number, backgroundColor: string }>) {
    if (this.options.type !== ToolTip.CROSS) {

      if (this.options.type === ToolTip.VERTICAL) {
        const left = this.options.verticalTag.width / 2 - 6 + 'px'
        for (const [key, source] of sources) {
          const top = (source.value - 6 / this.container.clientHeight) * 100
          let span: HTMLSpanElement

          if (this.valueTags.has(key)) {
            span = this.valueTags.get(key)!.el
          } else {
            span = this.createValueTag(source.backgroundColor)
            span.style.left =  left
            
            this.verticalTag!.instance.el.appendChild(span)
            this.valueTags.set(key, { el: span, mountEl: this.verticalTag!.instance.el })
          }

          span.style.top = top + '%'
          if (top > 100 || top < 0) {
            span.style.opacity = '0'
          } else {
            span.style.opacity = '1'
          }
        }
      } else {
        const top = this.options.transverseTag.width / 2 - 6 + 'px'
        for (const [key, source] of sources) {
          const left = (source.value - 6 / this.container.clientWidth) * 100 
          let span: HTMLSpanElement

          if (this.valueTags.has(key)) {
            span = this.valueTags.get(key)!.el
          } else {
            span = this.createValueTag(source.backgroundColor)
            span.style.top = top
            this.transverseTag!.instance.el.appendChild(span)
            this.valueTags.set(key, { el: span, mountEl: this.transverseTag!.instance.el })
          }

          span.style.left = left + '%'
          if (left > 100 || left < 0) {
            span.style.opacity = '0'
          } else {
            span.style.opacity = '1'
          }
        }
      }

      const deletes: Set<string> = new Set()
      for (const [key, tag] of this.valueTags) {
        if (!sources.has(key)) {
          tag.mountEl.removeChild(tag.el)
          deletes.add(key)
        }
      }

      for (const key of deletes) {
        this.valueTags.delete(key)
      }
    }
  }
  /**
   * @description: 更新配置，针对对UI有调整的需求
   * @param {IToolTipOptions} options 配置
   * @return {*}
   */  
  setOptions (options: IToolTipOptions) {
    Public.copyValueFromObject(this.options, options)

    if (this.verticalTag !== undefined) {
      this.verticalTag.instance.setOptions(this.options.verticalTag)
    }

    if (this.transverseTag !== undefined) {
      this.transverseTag.instance.setOptions(this.options.transverseTag)
    }

    this.infoTag.instance.setOptions(this.options.infoTag)
  }
  /**
   * @description: 关闭toolTip
   */  
  close () {
    this.end()

    this.endByLink()
  }
  /**
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    this.infoTag.instance.setContent(content)
  }

  private createValueTag (backgroundColor: string ) {
    const span = document.createElement('span')
    span.style.position = 'absolute'
    span.style.backgroundColor = backgroundColor
    span.style.borderRadius = '12px'
    span.style.width = '12px'
    span.style.height = '12px'
    return span
  }

  private mousedown = (e: MouseEvent) => {
    if (this.options.lock || e.buttons !== 1 || this.lockByKeyboard) return
    this.mouseActivation = true

    const _position = this.event.positionTrans(e)
    const position = this.active(_position)

    this.activeLinks(position)
  }

  private mousemove =  Public.throttle((e: MouseEvent) => {
    if (this.options.lock || e.buttons !== 1 || !this.mouseActivation) return
    const _position = this.event.positionTrans(e)
    const position = this.move(_position)

    this.moveByLink(position)
  }, this.options.throttle)

  private mouseleave = (e: MouseEvent) => {
    if (this.options.lock || e.buttons !== 1 || !this.mouseActivation) return
    this.mouseActivation = false

    this.end()

    this.endByLink()
  }

  private mouseup = (e: MouseEvent) => {
    if (this.options.lock || !this.mouseActivation) return
    this.mouseActivation = false

    this.end()

    this.endByLink()
  }

  private touchstart = () => {
    if (this.options.lock) return
    this.mouseOrTouch = Listen.TOUCH

    // if (!this.touchMoved) {
    //   this.end()

    //   this.endByLink()
    // }

    this.end()

    this.endByLink()

    if (this.event.touchPosition.size === 1) {
      const position = this.event.touchPosition.get(0)!
      this.oldTouchMOvePosition = position

      // @ts-ignore
      this.touchStartSetTime = setTimeout(() => {
        if (this.scene.zoomTrans) {
          this.scene.zoomTrans.addOrRemove(Listen.TOUCHMOVE, true)
        }
        position.offsetX = Math.round(position.offsetX)
        position.offsetY = Math.round(position.offsetY)

        const p = this.active(position)

        this.activeLinks(p)
      }, 300)
    } else {
      clearTimeout(this.touchStartSetTime)
      this.end()
      this.endByLink()
      this.oldTouchMOvePosition = undefined

      if (this.scene.zoomTrans) {
        this.scene.zoomTrans.addOrRemove(Listen.TOUCHMOVE, false)
      }
    }
  }

  private touchmove = Public.throttle((e: TouchEvent) => {
    if (this.options.lock || this.oldTouchMOvePosition === undefined) return

    if (this.event.touchPosition.size === 1) {
      if ((this.verticalTag && !this.verticalTag.removed) || (this.transverseTag && !this.transverseTag.removed)) {
        if (this.event.touchPosition.size === 1) {
          const position = this.event.touchPosition.get(0)!
          position.offsetX = Math.round(position.offsetX)
          position.offsetY = Math.round(position.offsetY)

          const p = this.move(position)

          this.moveByLink(p)
        }
      } else {
        clearTimeout(this.touchStartSetTime)
      }
    }

    // 手指移动到容器外
    if (this.event.touchPosition.size === 0) {
      clearTimeout(this.touchStartSetTime)
      this.end()
      this.endByLink()
      this.oldTouchMOvePosition = undefined

      if (this.scene.zoomTrans) {
        this.scene.zoomTrans.addOrRemove(Listen.TOUCHMOVE, false)
      }
    }
  }, this.options.throttle)

  private touchend = () => {
    if (this.options.lock) return

    clearTimeout(this.touchStartSetTime)
    this.oldTouchMOvePosition = undefined

    if (this.touchMoved) {
      // this.end()

      // this.endByLink()
    }

    if (this.scene.zoomTrans) {
      this.scene.zoomTrans.addOrRemove(Listen.TOUCHMOVE, false)
    }
  }
  /**
   * @description:  移除或者添加tag
   * @param {ITag} tag tag对象
   * @param {boolean} add 真添加，假移除
   */  
  private addOrRemoveTag (tag: ITag, add: boolean) {
    if (add) {
      if (tag.removed) {
        tag.instance.append()
        tag.removed = false
      }
    } else {
      if (!tag.removed) {
        tag.instance.remove()
        tag.removed = true
      }
    }
  }

  private active (e: IOffsetPosition) {
    const result = this.calculatePositionByFence(e)

    if (this.verticalTag !== undefined) {
      this.addOrRemoveTag(this.verticalTag, true)
    }

    if (this.transverseTag !== undefined) {
      this.addOrRemoveTag(this.transverseTag, true)
    }

    this.touchMoved = false

    this.setInfoStyle(result)

    for (const [, callBack] of this.afterActive) {
      callBack(result)
    }

    this.setAfterTrigger(result)

    return result
  }

  private move (e: IOffsetPosition) {
    const result = this.calculatePositionByFence(e)

    this.touchMoved = true

    this.setInfoStyle(result)

    this.setAfterTrigger(result)

    return result
  }

  private end () {
    if (this.verticalTag !== undefined) {
      this.addOrRemoveTag(this.verticalTag, false)
    }

    if (this.transverseTag !== undefined) {
      this.addOrRemoveTag(this.transverseTag, false)
    }

    if (!this.infoTag.removed) {
      this.infoTag.instance.remove()
      this.infoTag.removed = true
    }

    for (const [, callBack] of this.afterHidden) callBack()

    for (const [, tag] of this.valueTags) {
      tag.mountEl.removeChild(tag.el)
    }
    this.valueTags.clear()
  }

  private calculatePositionByFence (e: IOffsetPosition) {
    const result: IPositionResult = {
      offsetX: e.offsetX,
      offsetPCTX: 0,
      offsetMiddlePCTX: e.offsetX / this.container.clientWidth,
      offsetY: e.offsetY,
      offsetPCTY: 0,
      offsetMiddlePCTY: e.offsetY / this.container.clientHeight
    }

    if (this.verticalTag !== undefined) {
      const r = this.verticalTag.instance.setPosition(e, this.scene.fence)
      result.offsetX = r.offsetX
      result.offsetPCTX = r.offsetPCTX
      result.offsetMiddlePCTX = r.offsetMiddlePCTX
      if (r.fenceIndex !== undefined) result.fenceIndex = r.fenceIndex
    }

    if (this.transverseTag !== undefined) {
      const r = this.transverseTag.instance.setPosition(e, this.scene.fence)
      result.offsetY = r.offsetY
      result.offsetPCTY = r.offsetPCTY
      result.offsetMiddlePCTY = r.offsetMiddlePCTY
      if (r.fenceIndex !== undefined) result.fenceIndex = r.fenceIndex
    }

    return result
  }

  private setInfoStyle (position: IPositionResult) {
    if (this.options.infoTag.fixed === undefined) {
      const p: IOffsetPosition = {
        offsetX: position.offsetMiddlePCTX * this.container.clientWidth,
        offsetY: position.offsetMiddlePCTY * this.container.clientHeight
      }
      this.infoTag.instance.setPosition(p, this.mouseOrTouch)
    }
  
    if (this.infoTag.removed) {
      this.infoTag.instance.append()
      this.infoTag.removed = false
    }
  }

  private activeLinks (p: IOffsetPosition) {
    for (const [, source] of this.linkManager) {
      const target = source.target
      const position = source.position(p)
      
      const result = target.calculatePositionByFence(position)

      if (target.verticalTag !== undefined) {
        target.addOrRemoveTag(target.verticalTag, true)
      }
  
      if (target.transverseTag !== undefined) {
        target.addOrRemoveTag(target.transverseTag, true)
      }

      target.setInfoStyle(result)

      for (const [, callBack] of target.afterActive) {
        callBack(result)
      }

      target.setAfterTrigger(result)
    }
  }

  private moveByLink (p: IOffsetPosition) {
    for (const [, source] of this.linkManager) {
      const target = source.target
      const position = source.position(p)
      
      const result = target.calculatePositionByFence(position)

      target.setInfoStyle(result)

      target.setAfterTrigger(result)
    }
  }

  private setAfterTrigger (result: IPositionResult) {
    for (const [, callBack] of this.afterTrigger) {
      callBack(result)
    }
  }

  private endByLink () {
    for (const [, source] of this.linkManager) {
      source.target.end()
    }
  }
  /**
   * @description: 创建一个可点击元素
   * @return {*}
   */  
  private createLock(options: {
    show: boolean
    icon: string
    fontSize: number
    color: string
  }) {
    if (options.show) {
      const link = document.createElement('i')
      link.classList.add(...['iconfont', options.icon])
      const bottom = this.options.type === Fence.VERTICAL ? 'bottom' : 'left'
      const left = this.options.type === Fence.VERTICAL ? 'left' : 'top'
      link.style.cssText = `
        color: ${options.color};
        font-size: ${options.fontSize}px;
        position: absolute;
        padding: 10px 10px 0 10px;
        ${bottom}: 0;
        ${left}: -${Math.floor(options.fontSize / 2) + 10}px;
        pointer-events: auto;
      `
      if (this.options.type === Fence.TRANSVERSE) {
        // 旋转锁icon
        link.style.transformOrigin = 'center'
        link.style.transform = 'rotate(90deg)'
      }

      link.addEventListener(Listen.TOUCHSTART, (e) => {
        e.stopPropagation()
      })

      link.addEventListener(Listen.MOUSEDOWN, (e) => {
        e.stopPropagation()
      })

      return link
    }

    return undefined
  }
}