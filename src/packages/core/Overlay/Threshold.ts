/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-10 11:28:30
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\core\Overlay\Threshold.ts
 * @Description: 
 */
import { IOffsetPosition, Listen } from '../Event'
import { Fence } from '../Fence'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { IPoor, ITagOptions, Tag } from '../ViewHCI'
import { IPositionResult } from '../ViewHCI/types'
import { IInfoTagOptions, InfoTag } from './InfoTag'
import { Overlay, IOverlayOptions } from './Overlay'
import { UseTheme } from '../../styles'

interface ITag  {
  name: string
  instance: Tag
}


export type IThresholdOptions = {
  traceByFence?: boolean
  lock?: boolean
  openInit?: boolean
  centerTag?: {
    show?: boolean
    type?: string
    backgroundColor?: string
    /**
     * @description: 是否可拖拽
     */    
    drag?: boolean
    /**
     * @description: 选中后的颜色
     */    
    selectColor?: string
  }
  infoTag?: IInfoTagOptions & { show?: boolean }
  showTags?: Map<string, {
    backgroundColor: string
    /**
     * @description: 相对于容器左上角向X或Y方向的初始偏移比例[0-1]
     */    
    offset: number
    /**
     * @description: 选中后背景颜色
     */  
    selectColor?: string
  }>,
  scene?: Scene
} & IOverlayOptions

export class Threshold {
  /**
   * @description: 水平向顶部横线
   */  
  static readonly TOP = 'top'
  /**
   * @description: 水平向底部横线
   */
  static readonly BOTTOM = 'bottom'
  /**
   * @description: 竖向左边横线
   */
  static readonly LEFT = 'left'
  /**
   * @description: 竖向右边横线
   */
  static readonly RIGHT = 'right'
  /**
   * @description: 框选框
   */
  static readonly CENTER = 'center'
  /**
   * @description: 信息显示器
   */
  static readonly INFO_TAG = 'infoTag'
  /**
   * @description: 从上到下
   */  
  static readonly TOP_TO_BOTTOM = 'topToBottom'
  /**
   * @description: 从下到上
   */
  static readonly BOTTOM_TO_TOP = 'bottomToTop'
  /**
   * @description: 从左到右
   */
  static readonly LEFT_TO_RIGHT = 'leftToRight'
  /**
   * @description: 从右到左
   */
  static readonly RIGHT_TO_LEFT = 'rightToLeft'
  /**
   * @description: 上下之间
   */
  static readonly TOP_AND_BOTTOM = 'topAndBottom'
  /**
   * @description: 左右之间
   */
  static readonly LEFT_AND_RIGHT = 'leftAndRight'
  /**
   * @description: 门限默认颜色
   */  
  static readonly MOCK_LINE_COLOR = 'rgb(64, 158, 255)'
  /**
   * @description: 配置
   */  
  options: {
    traceByFence: boolean
    lock: boolean
    openInit: boolean
    centerTag: {
      show: boolean
      type: string
      backgroundColor: string
      drag: boolean
      selectColor: string
    }
    showTags: Map<string, {
      backgroundColor: string
      offset: number
      selectColor: string
    }>
    infoTag: {
      show: boolean
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
    traceByFence: false,
    lock: false,
    openInit: false,
    centerTag: {
      show: true,
      type: Threshold.BOTTOM_TO_TOP,
      backgroundColor: UseTheme.theme.var.markerColor,
      selectColor: UseTheme.theme.var.markerSelectColor,
      drag: false
    },
    infoTag: {
      show: true,
      width: 300,
      height: 36,
      backgroundColor: UseTheme.theme.var.tipBgColor,
      color: UseTheme.theme.var.tipColor,
      borderRadius: '10px'
    },
    showTags: new Map([
      [
        Threshold.BOTTOM,
        {
          backgroundColor: UseTheme.theme.var.tagBgColor,
          offset: 0.5,
          selectColor: UseTheme.theme.var.tagSelectColor
        }
      ]
    ]),
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
  * @description: 框选结果
  */  
  readonly positionResult = new Map<string, IPositionResult>()
  /**
   * @description: 开始移动前的回电函数集（选中）
   */  
  beforeStart = new Map<string, (positions: Map<string, IPositionResult>) => void>()
  /**
   * @description: 打开筛选功能回调函数集
   */
  afterOpen = new Map<string, (positions: Map<string, IPositionResult>) => void>()
  /**
   * @description: 触发筛选回调函数集
   */  
  afterTrigger = new Map<string, (positions: Map<string, IPositionResult>) => void>()
  /**
   * @description: 结束筛选回调函数集
   */  
  afterEnd = new Map<string, (positions: Map<string, IPositionResult>) => void>()
  /**
   * @description: 关闭筛选功能回调函数集
   */  
  afterClose = new Map<string, () => void>()

  /**
   * @description: 当前交互方式手指|鼠标
   */  
  mouseOrTouch = Listen.MOUSE

  readonly scene: Scene | undefined
  /**
   * @description: 外层容器
   */  
  readonly wrapper: HTMLDivElement
  /**
   * @description: 框选框
   */
  readonly centerTag: HTMLDivElement
  /**
   * @description: 信息显示器
   */  
  readonly infoTag?: InfoTag

  readonly container: HTMLElement
  
  readonly tagManager = new Map<string, ITag>()

  readonly baseOverlay: Overlay

  private manager = new Set<string>([Listen.CONTEXTMENU])
  /**
   * @description: 是否开启
   */
  status = Overlay.CLOSE

  private hasInit = false

  private hasActive = false

  private oldPosition: IOffsetPosition | undefined

  constructor (mount: HTMLElement, options?: IThresholdOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
      
      if (options.infoTag) {
        this.options.infoTag.fixed = options.infoTag.fixed
      }

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
    
    if (this.scene) {
      this.scene.disposeManager.add(() => { this.dispose() })
    }

    this.container = mount

    this.wrapper = this.baseOverlay.wrapper

    for (const key of this.manager) {
      this.wrapper.addEventListener(key, this[key], false)
    }

    // 鼠标方向样式
    let cursorDirection = Fence.TRANSVERSE

    for (const [name, option] of this.options.showTags) {
      const tagOption: ITagOptions = {
        direction: undefined,
        width: 1,
        backgroundColor: option.backgroundColor,
        ddPoint: {
          show: true
        },
        drag: true,
        fence: this.scene?.fence,
        cursor: true,
        selectColor: option.selectColor
      }

      if (name === Threshold.TOP || name === Threshold.BOTTOM) {
        tagOption.direction = Fence.TRANSVERSE
        cursorDirection = Fence.VERTICAL
      }

      const instance = new Tag(this.wrapper, tagOption)

      instance.append()
      
      this.tagManager.set(name, {
        name,
        instance
      })
      // tag位置改变回调
      instance.afterMove.set(name, () => {
        this.setRectangleStyle()

        if (this.infoTag) {
          this.infoTag.setPosition(instance.positionResult, instance.mouseOrTouch)
        }

        this.positionResult.set(name, instance.positionResult)

        for (const [, fun] of this.afterTrigger) {
          if (this.positionResult.size === this.tagManager.size) fun(this.positionResult)
        }
      })

      // 结束移动回调
      instance.afterEnd.set(name, () => {
        for (const [, fun] of this.afterEnd) {
          if (this.positionResult.size === this.tagManager.size) fun(this.positionResult)
        }
      })
    }

    // 中间矩形框
    this.centerTag = document.createElement('div')
    this.wrapper.appendChild(this.centerTag)

    const centerTag = this.centerTag.style
    const centerTagOptions = this.options.centerTag
    centerTag.backgroundColor = centerTagOptions.backgroundColor
    centerTag.position = 'absolute'
    centerTag.cursor = cursorDirection === Fence.TRANSVERSE ? 'ew-resize' : 'ns-resize'

    if (centerTagOptions.type === Threshold.BOTTOM_TO_TOP || centerTagOptions.type === Threshold.TOP_TO_BOTTOM
      || centerTagOptions.type === Threshold.TOP_AND_BOTTOM) {
      centerTag.width = '100%'
    } else {
      centerTag.height = '100%'
    }
    
    if (centerTagOptions.drag) {
      this.centerTag.addEventListener(Listen.MOUSEDOWN, this.mousedown)
      this.centerTag.addEventListener(Listen.TOUCHSTART, this.touchstart)
      this.wrapper.addEventListener(Listen.MOUSEMOVE, this.mousemove)
      this.wrapper.addEventListener(Listen.MOUSEUP, this.mouseup)
      this.wrapper.addEventListener(Listen.TOUCHMOVE, this.touchmove)
      this.wrapper.addEventListener(Listen.TOUCHEND, this.touchend)
      this.wrapper.addEventListener(Listen.MOUSELEAVE, this.mouseleave)
    }
    
    // 信息提示框
    if (this.options.infoTag.show) {
      this.infoTag = new InfoTag(this.wrapper, this.options.infoTag)

      this.infoTag.append()
    }

    if (this.scene && this.scene.fence && this.options.traceByFence) {
      const fence = this.scene.fence
      fence.afterZoomOrTrans.add(() => {
        this.traceByFence()
      })
    }
  }

  /**
   * @description: 将一个信息容器挂载到信息显示器，（特别的：如果el为undefined，不会替换默认挂载点，但仍然会调用infoTag.afterMount回调函数集）
   * @param {HTMLElement} el 内容节点
   */  
  mountInfoTag (el?: HTMLElement) {
    if (this.infoTag) this.infoTag.mountInfoTag(el)
  }
  toggleHide (hide = false) {
    if (hide) {
      
    }
  }
  /**
   * @description: 开启
   */ 
  open () {
    if (this.status === Overlay.CLOSE) {
      this.container.appendChild(this.wrapper)

      this.init()

      this.magnet()

      this.showChildren()

      this.status = Overlay.OPEN

      for (const [name, tag] of this.tagManager) {
        this.positionResult.set(name, tag.instance.positionResult)
      }

      for (const [, fun] of this.afterOpen) {
        if (this.positionResult.size === this.tagManager.size) fun(this.positionResult)
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
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    if (this.infoTag) this.infoTag.setContent(content)
  }
  /**
   * @description: 释放资源
   */ 
  dispose () {
    for (const key of this.manager) {
      this.wrapper.removeEventListener(key, this[key], false)
    }

    for (const [, tag] of this.tagManager) {
      tag.instance.dispose()
    }

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close, false)
    }
    if (this.options.centerTag.drag) {
      this.centerTag.removeEventListener(Listen.MOUSEDOWN, this.mousedown)
      this.centerTag.removeEventListener(Listen.TOUCHSTART, this.touchstart)
      this.wrapper.removeEventListener(Listen.MOUSEMOVE, this.mousemove)
      this.wrapper.removeEventListener(Listen.MOUSEUP, this.mouseup)
      this.wrapper.removeEventListener(Listen.TOUCHMOVE, this.touchmove)
      this.wrapper.removeEventListener(Listen.TOUCHEND, this.touchend)
      this.wrapper.removeEventListener(Listen.MOUSELEAVE, this.mouseleave)
    }
  }
  /**
   * @description: 设置某个门限的位置
   * @param {string} name 门限名称
   * @param {IOffsetPosition} position 位置
   * @return {*}
   */  
  setTagPosition (name: string, position: IOffsetPosition) {
    if (this.status === Overlay.OPEN) {
      const tag = this.tagManager.get(name)

      if (tag === undefined) {
        console.warn(`名称为${name}的tag不存在`)
      } else {
        tag.instance.setPosition(position, this.scene?.fence)
      }
    }
  }
  /** 
   * @description: 在刻度尺方向上追踪自己的位置，例如fence缩放后跟随改变门限位置
   * @return {*}
   */  
  traceByFence () {
    const fence = this.scene?.fence
    if (fence && fence.practicalCount !== 0) {
      for (const [, tag] of this.tagManager) {
        tag.instance.setPositionByDataIndex(fence)
      }

      this.setRectangleStyle()
    }
  }

  /** 
   * @description: 磁吸器，可将tag调整到最近的fence刻度位置
   * @return {*}
   */  
  magnet () {
    const fence = this.scene?.fence
    if (fence !== undefined && fence.practicalCount !== 0) {
      for (const [, tag] of this.tagManager) {
        tag.instance.magnet(false)
      }
    }

    this.setRectangleStyle()
  }
  /**
   * @description: 初始化
   * @param {Boolean} useAfterMove  是否触发每一个tag的aftermove回调，默认为false
   */  
  init = (useAfterMove = false) => {
    if (this.options.openInit) this.hasInit = false
    
    if (!this.hasInit) {
      for (const [name] of this.options.showTags) {
        const options = this.options.showTags.get(name)!
        const position: IOffsetPosition = { offsetX: 0, offsetY: 0 }

        if (name === Threshold.TOP || name === Threshold.BOTTOM) {
          position.offsetY = options.offset * this.container.clientHeight
          position.offsetX = this.container.clientWidth / 2
        } else {
          position.offsetX = options.offset * this.container.clientWidth
          position.offsetY = this.container.clientHeight / 2
        }
        
        this.tagManager.get(name)!.instance.setPosition(position, this.scene?.fence, false, useAfterMove)
      }
      this.hasInit = true
    }
  }
  /**
   * @description: 门限变化后设置中间矩形框样式
   */  
  private setRectangleStyle () {
    const rectangleStyle = this.centerTag.style
    let tag: Tag
    switch (this.options.centerTag.type) {
    case Threshold.BOTTOM_TO_TOP: {
      rectangleStyle.bottom = '0px'
      const bottom = this.tagManager.get(Threshold.BOTTOM)
      if (bottom) {
        tag = bottom.instance
        let top =  (tag.positionResult!.offsetPCTY + tag.options.width / this.container.clientHeight)
        top = this.changeP(top)

        rectangleStyle.top = top * 100 + '%'
      } else {
        console.warn('请配置BOTTOM门限')
      }
    }
      break
    case Threshold.TOP_TO_BOTTOM: {
      rectangleStyle.top = '0px'
      const top = this.tagManager.get(Threshold.TOP)
      if (top) {
        tag = top.instance
        let bottom = (1 - tag.positionResult!.offsetPCTY)
        bottom = this.changeP(bottom)

        rectangleStyle.bottom = bottom * 100 + '%'
      } else {
        console.warn('请配置TOP门限')
      }
    }
      break
    case Threshold.TOP_AND_BOTTOM: {
      const bottom = this.tagManager.get(Threshold.BOTTOM)
      const top = this.tagManager.get(Threshold.TOP)
      if (bottom && top) {
        let bottomTag: Tag, topTag: Tag
        if (bottom.instance.positionResult!.offsetMiddlePCTY >= top.instance.positionResult!.offsetMiddlePCTY) {
          bottomTag = bottom.instance
          topTag = top.instance
        } else {
          bottomTag = top.instance
          topTag = bottom.instance
        }

        let top_p = (topTag.positionResult!.offsetPCTY + topTag.options.width / this.container.clientHeight)
        top_p = this.changeP(top_p)
        rectangleStyle.top = top_p * 100 + '%'

        let bottom_p = (1 - bottomTag.positionResult!.offsetPCTY)
        bottom_p = this.changeP(bottom_p)
        rectangleStyle.bottom = bottom_p * 100 + '%'
      } else {
        console.warn('请同时配置BOTTOM和TOP门限')
      }
    }
      break
    case Threshold.LEFT_TO_RIGHT: {
      rectangleStyle.left = '0px'
      const left = this.tagManager.get(Threshold.LEFT)
      if (left) {
        tag = left.instance
        let right = (1 - tag.positionResult!.offsetPCTX)
        right = this.changeP(right)

        rectangleStyle.right = (1 - tag.positionResult!.offsetPCTX) * 100 + '%'
      } else {
        console.warn('请配置LEFT门限')
      }
    }
      break
    case Threshold.RIGHT_TO_LEFT: {
      rectangleStyle.right = '0px'
      const right = this.tagManager.get(Threshold.RIGHT)
      if (right) {
        tag = right.instance
        let left = (tag.positionResult!.offsetPCTX + tag.options.width / this.container.clientWidth)
        left = this.changeP(left)

        rectangleStyle.left = left * 100 + '%'
      } else {
        console.warn('请配置RIGHT门限')
      }
    }
      break
    case Threshold.LEFT_AND_RIGHT: {
      const left = this.tagManager.get(Threshold.LEFT)
      const right = this.tagManager.get(Threshold.RIGHT)
      if (left && right) {
        let rightTag: Tag, leftTag: Tag
        if (right.instance.positionResult!.offsetMiddlePCTX >= left.instance.positionResult!.offsetMiddlePCTX) {
          rightTag = right.instance
          leftTag = left.instance
        } else {
          rightTag = left.instance
          leftTag = right.instance
        }
        
        let left_p = (leftTag.positionResult!.offsetPCTX + leftTag.options.width / this.container.clientWidth)

        left_p = this.changeP(left_p)
        rectangleStyle.left = left_p * 100 + '%'

        let right_p = (1 - rightTag.positionResult!.offsetPCTX)
        right_p = this.changeP(right_p)
        rectangleStyle.right = right_p * 100 + '%'
      } else {
        console.warn('请同时配置LEFT和RIGHT门限')
      }
    }
      break
    }

    
  }

  private changeP (p: number) {
    if (p > 1) p = 1
    if (p < 0) p = 0

    return p
  }

  private showChildren (show = true) {
    if (show && this.infoTag) {
      let instance: Tag
      for (const [, tag] of this.tagManager) {
        // 默认使用第一个的信息
        instance = tag.instance
        break
      }
      const position = {
        // @ts-ignore
        offsetX: instance.positionResult.offsetMiddlePCTX * this.container.clientWidth,
        // @ts-ignore
        offsetY: instance.positionResult.offsetMiddlePCTY * this.container.clientHeight
      }

      // @ts-ignore
      this.infoTag.setPosition(position, instance.mouseOrTouch)

    } 
  }

  private contextmenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  /* ..................................................中间矩形框交互.................................................. */
  private mousedown = (e: MouseEvent) => {
    if (e.buttons === 1) {
      e.stopPropagation()
      this.hasActive = true

      const position = this.positionTrans(e)

      if (position.offsetX > this.container.clientWidth || position.offsetX < 0
        || position.offsetY > this.container.clientHeight || position.offsetY < 0) {
        this.end()
        return
      }

      this.active(position)

      for (const [, fun] of this.beforeStart) {
        fun(this.positionResult)
      }
    }
  }

  private mousemove = (e: MouseEvent) => {
    e.preventDefault()

    if (e.buttons === 1) {
      if (this.hasActive) {
        const position = this.positionTrans(e)

        if (position.offsetX > this.container.clientWidth || position.offsetX < 0
          || position.offsetY > this.container.clientHeight || position.offsetY < 0) {
          this.end()
          return
        }

        this.move(position)
      }
    }
  }

  private mouseup = () => {
    if (this.hasActive) this.end()
  }

  private mouseleave = () => {
    if (this.hasActive) this.end()
  }

  private touchstart = (e: TouchEvent) => {
    this.mouseOrTouch = Listen.TOUCH

    this.hasActive = true

    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      e.stopPropagation()

      const position = result.get(0)!

      this.active(position)

    }
  }

  private touchmove = (e: TouchEvent) => {
    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      if (this.hasActive) {
        e.stopPropagation()

        const position = result.get(0)!

        this.move(position)
      }
    }
  }

  private touchend = () => {
    if (this.hasActive) this.end()
  }

  private active = (position: IOffsetPosition) => {
    this.centerTag.style.backgroundColor = this.options.centerTag.selectColor

    if (this.oldPosition === undefined) {
      this.oldPosition = position
    }

    for (const [, fun] of this.beforeStart) {
      fun(this.positionResult)
    }
  }

  private move = (position: IOffsetPosition) => {
    if (this.oldPosition) {
      let tagF: Tag | undefined
      for (const [, tag] of this.tagManager) {
        tagF = tag.instance
      }
      // 如果fence存在且方向与tag方向相反，则移动量必须大于等于fence.baseFence.eachPieceWidth才能移动
      const fence = this.scene?.fence
      if (fence && tagF && fence.direction !== tagF.direction) {
        if (tagF.direction === Fence.VERTICAL) {
          if (Math.abs(position.offsetX - this.oldPosition.offsetX) < fence.baseFence.eachPieceWidth * this.wrapper.clientWidth) return
        } else {
          if (Math.abs(position.offsetY - this.oldPosition.offsetY) < fence.baseFence.eachPieceWidth * this.wrapper.clientHeight) return
        }
      }

      for (const [, tag] of this.tagManager) {
        const poor: IPoor = { x: 0, y: 0 }
        if (tag.instance.direction === Fence.VERTICAL) {
          poor.x = position.offsetX - this.oldPosition.offsetX
        } else {
          poor.y = position.offsetY - this.oldPosition.offsetY
        }
        tag.instance.setPositionByPoor(poor, this.scene?.fence, true)
      }

      this.oldPosition = position
    }
  }

  private end () {
    this.hasActive = false
    this.centerTag.style.backgroundColor = this.options.centerTag.backgroundColor
    
    this.oldPosition = undefined

    for (const [, fun] of this.afterEnd) {
      if (this.positionResult.size === this.tagManager.size) fun(this.positionResult)
    }
  }

  /**
   * @description: 获取鼠标事件偏移位置
   * @param {MouseEvent} e MouseEvent | WheelEvent
   * @return {*}
   */  
   private positionTrans (e: MouseEvent | WheelEvent) {
    const domRect = this.wrapper.getBoundingClientRect()
    return {
      offsetX: e.clientX - domRect.left,
      offsetY: e.clientY - domRect.top
    }
  }
}