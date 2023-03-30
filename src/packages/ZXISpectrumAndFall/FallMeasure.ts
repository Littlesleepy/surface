import { IInfoTagOptions, InfoTag, IOffsetPosition, IOverlayOptions,
  isLayersFenceType, LayersFenceType, Listen, Overlay, Public, Scene, UseTheme } from ".."

/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-20 14:29:07
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 09:43:14
 * @FilePath: \zxi-device\src\packages\ZXISpectrumAndFall\FallMeasure.ts
 * @Description: 瀑布图测量工具
 */
export type IFallMeasureOptions =  {
  lock?: boolean
  infoTag?: IInfoTagOptions
  oneRowHeight: number
  intervalY: number
} & IOverlayOptions

export interface IFallMeasurePoint {
  overflow: {
    x: boolean
    y: boolean
  }
  indexX: number
  dataIndexX?: number 
  indexY: number
  dataIndexY?: number 
  active: boolean
  /** 
   * @description: 点中心位置描述
   * @return {*}
   */  
  centerPosition: IOffsetPosition
  el: HTMLSpanElement
}


export class FallMeasure {
  private topRow = 0
  /**
   * @description: 测量结果
   */  
  positionResult: IFallMeasurePoint[] = [{
    overflow: {
      x: false,
      y: false
    },
    indexX: 0,
    indexY: 0,
    active: false,
    centerPosition: { offsetX: 0, offsetY: 0 },
    el: document.createElement('span')
  }, {
    overflow: {
      x: false,
      y: false
    },
    indexX: 0,
    indexY: 0,
    active: false,
    centerPosition: { offsetX: 0, offsetY: 0 },
    el: document.createElement('span')
  }]

  afterTrigger = new Map<string, (positions: IFallMeasurePoint[]) => void>()

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
    infoTag: {
      width: number
      height: number
      backgroundColor: string
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
    oneRowHeight: number
    intervalY: number
  } = {
    lock: true,
    infoTag: {
      width: 410,
      height: 60,
      backgroundColor: UseTheme.theme.var.tipBgColor,
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
    },
    oneRowHeight: 10,
    intervalY: 1
  }

  readonly container: HTMLElement

  private clearButton = document.createElement('i')

  /**
   * @description: 当前交互方式手指|鼠标
   */ 
  private mouseOrTouch = Listen.MOUSE

  private baseOverlay: Overlay

  /**
   * @description: 是否开启
   */
  status = Overlay.CLOSE

  constructor (scene: Scene, options: IFallMeasureOptions) {
    Public.copyValueFromObject(this.options, options)
    
    if (options.infoTag) {
      this.options.infoTag.fixed = options.infoTag.fixed
    }

    this.baseOverlay = new Overlay(this.options)

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.addEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.title = '关闭'

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
    this.wrapper.style.cursor = 'crosshair'

    scene.disposeManager.add(() => { this.dispose() })

    this.infoTag = {
      instance: new InfoTag(this.wrapper, this.options.infoTag),
      removed: true
    }

    this.positionResult.forEach(p => {
      p.el.style.cssText = `
        width: 10px;
        height: 10px;
        background-color: red;
        border-radius: 10px;
        position: absolute;
        display: none;
        cursor: pointer;
      `
      p.el.addEventListener(Listen.CLICK, (e) => {
        e.stopPropagation()
        p.active = false
        p.el.style.display = 'none'
        
        for (const [, fun] of this.afterTrigger) {
          fun(this.positionResult)
        }

        this.showChildren(false)
      })

      p.el.addEventListener(Listen.TOUCHSTART, (e) => {
        e.stopPropagation()
        p.active = false
        p.el.style.display = 'none'

        for (const [, fun] of this.afterTrigger) {
          fun(this.positionResult)
        }

        this.showChildren(false)
      })

      this.wrapper.appendChild(p.el)
    })


    this.scene.fence!.afterZoomOrTrans.add(() => {
      this.setPositionX()
    })

    this.wrapper.addEventListener(Listen.CLICK, this.click)

    this.wrapper.addEventListener(Listen.TOUCHSTART, this.touchstart)

    this.clearButton.classList.add(...['iconfont', 'icon-qingkong'])
    this.clearButton.title = '清除所有测量点'
    this.clearButton.style.cssText = `
      position: absolute;
      display: block;
      cursor: pointer;
      font-size: 40px;
      top: 60px;
      right: 10px;
      zIndex: 100;
      color: ${UseTheme.theme.var.color};
    `
    this.wrapper.appendChild(this.clearButton)

    this.clearButton.addEventListener(Listen.CLICK, this.clear)
    this.clearButton.addEventListener(Listen.TOUCHEND, this.clear)

    this.clearButton.addEventListener(Listen.MOUSEDOWN, (e) => {
      e.stopPropagation()
    })
    this.clearButton.addEventListener(Listen.TOUCHSTART, (e) => {
      e.stopPropagation()
    })
  }
  /**
   * @description: 开启
   */ 
  open () {
    if (this.status === Overlay.CLOSE) {
      this.positionResult.forEach(p => {
        p.active = false
        p.el.style.display = 'none'
      })

      this.showChildren(false)
      
      this.container.appendChild(this.wrapper)

      this.status = Overlay.OPEN

      for (const [, fun] of this.afterOpen) {
        fun()
      }

      for (const [, fun] of this.afterTrigger) {
        fun(this.positionResult)
      }
    }
  }

  /**
   * @description: 关闭
   */  
  close = () => {
    if (this.status === Overlay.OPEN) {
      
      this.reset()
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
    this.wrapper.removeEventListener(Listen.CLICK, this.click)
    this.wrapper.removeEventListener(Listen.TOUCHSTART, this.touchstart)

    this.clearButton.removeEventListener(Listen.CLICK, this.clear)
    this.clearButton.removeEventListener(Listen.TOUCHEND, this.clear)

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close, false)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close, false)
    }
  }
  /** 
   * @description: 设置测量点纵向位置
   * @param {number} topRow
   * @return {*}
   */  
  setPositionY (topRow: number) {
    this.topRow = topRow

    if (this.status === Overlay.OPEN) {
      this.positionResult.forEach(p => {
        if (p.dataIndexY !== undefined && p.active) {
          const indexY = p.dataIndexY - this.topRow
          const offsetY = indexY * (this.options.oneRowHeight + this.options.intervalY) + this.options.oneRowHeight / 2
          this.setPointOffsetY(p, offsetY)
        }
      })

      this.setInfoTagPosition()
    }
  }
  /** 
   * @description: 重置
   * @return {*}
   */  
  reset () {
    this.showChildren(false)

    this.positionResult.forEach(p => {
      p.active = false
      p.overflow = {
        x: false,
        y: false
      }
      p.indexX = 0
      p.indexY = 0
      p.active = false
      p.centerPosition = { offsetX: 0, offsetY: 0 }

      p.el.style.display = 'none'
    })

    for (const [, fun] of this.afterTrigger) {
      fun(this.positionResult)
    }
  }

  /**
   * @description: 设置文字内容
   * @param {Map} content 文字内容
   */
  setContent (content: Map<string, { color?: string, info: string }>) {
    this.infoTag.instance.setContent(content)
  }

  private clear = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation()
    this.reset()
  }
  /** 
   * @description: 缩放引起移动小球位置
   * @return {*}
   */  
  private setPositionX () {
    if (this.status === Overlay.OPEN) {
      this.positionResult.forEach(p => {
        if (p.dataIndexX !== undefined && p.active) {
          const fence = this.scene.fence!
          let offsetMiddle: number
          if (isLayersFenceType(fence) && fence.baseFence.eachPieceWidth === fence.baseFence.eachPieceWidthInitial) {
            offsetMiddle = (p.dataIndexX - fence.cutDataStartIndex + 1) / fence.cutDataLength
          } else {
            let _index = p.dataIndexX - fence.cutDataStartIndex + fence.baseFence.visibleIndex.min
            offsetMiddle = fence.baseFence.getFenceMiddlePositionByFenceIndex(_index)
          }

          if (!isNaN(offsetMiddle)) {
            this.setPointOffsetX(p, offsetMiddle * this.wrapper.clientWidth)
          } else {
            p.overflow.x = true
            p.el.style.display = 'none'
          }
        }
      })

      this.setInfoTagPosition()
    }
  }

  /** 
   * @description: 设置信息框位置
   * @return {*}
   */  
  private setInfoTagPosition () {
    const p1 = this.positionResult[0]
    const p2 = this.positionResult[1]

    let p: IFallMeasurePoint | undefined
    if (!p1.overflow.x && !p1.overflow.y && !p2.overflow.x && !p2.overflow.y) { // 两个点都显示，用靠近右边的点
      p = p1.centerPosition.offsetX < p2.centerPosition.offsetX ? p2 : p1
    } else if (!p1.overflow.x && !p1.overflow.y && (p2.overflow.x || p2.overflow.y)) {
      p = p1
    } else if (!p2.overflow.x && !p2.overflow.y && (p1.overflow.x || p1.overflow.y)) {
      p = p2
    } else { // 两个点都不显示
      p = undefined
    }

    if (p && p1.active && p2.active) {
      this.showChildren()
      const position = {
        offsetX: p.centerPosition.offsetX,
        offsetY: p.centerPosition.offsetY
      }
      this.infoTag.instance.setPosition(position, this.mouseOrTouch)
    } else {
      this.showChildren(false)
    }
  }

  private setPointOffsetX (p: IFallMeasurePoint, offset: number) {
    const ds = offset - 5
    if (ds <= -10 || ds >= this.wrapper.clientWidth) {
      p.overflow.x = true
    } else {
      p.overflow.x = false
    }

    if (p.overflow.x || p.overflow.y) {
      p.el.style.display = 'none'
    } else {
      p.el.style.display = 'block'
    }
    p.centerPosition.offsetX = offset
    p.el.style.left = ds / this.wrapper.clientWidth * 100 + '%'
  }

  private setPointOffsetY (p: IFallMeasurePoint, offset: number) {
    const ds = offset - 5
    if (ds <= -10 || ds >= this.wrapper.clientHeight) {
      p.overflow.y = true
    } else {
      p.overflow.y = false
    }

    if (p.overflow.x || p.overflow.y) {
      p.el.style.display = 'none'
    } else {
      p.el.style.display = 'block'
    }
    p.centerPosition.offsetY = offset
    p.el.style.top = ds / this.wrapper.clientHeight * 100 + '%'
  }


  private showChildren (show = true) {
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

  private click = (e: MouseEvent) => {
    if (this.options.lock) return
    this.mouseOrTouch = Listen.MOUSE

    e.preventDefault()

    if (e.buttons === 0) {

      const position = this.positionTrans(e)

      this.active(position)
    }
  }

  private touchstart = (e: TouchEvent) => {
    if (this.options.lock) return
    this.mouseOrTouch = Listen.TOUCH
    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      const position = result.get(0)!

      this.active(position)
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

  private active (position: IOffsetPosition) {
    const fence = this.scene.fence! as LayersFenceType
    // 位置加工，位置离散
    const indexX = fence.baseFence.getFenceIndexByDistance(position.offsetX / this.wrapper.clientWidth)
    const offsetX = fence.baseFence.getFenceMiddlePositionByFenceIndex(indexX) * this.wrapper.clientWidth

    const ds = this.options.oneRowHeight + this.options.intervalY
    const indexY = Math.floor(position.offsetY / ds)
    const offsetY = indexY * ds + this.options.oneRowHeight / 2

    const p1 = this.positionResult[0]
    const p2 = this.positionResult[1]

    let p: IFallMeasurePoint
    if (p1.active) {
      p = p2
    } else {
      p = p1
    }

    p.active = true
    p.overflow.x = false
    p.overflow.y = false
    p.centerPosition.offsetX = offsetX
    p.centerPosition.offsetY = offsetY
    p.indexX = indexX
    p.dataIndexX = fence.cutDataIndexArr[indexX]
    p.indexY = indexY
    p.dataIndexY = this.topRow + indexY

    p.el.style.top = (offsetY - 5) / this.wrapper.clientHeight * 100 + '%'
    p.el.style.left = (offsetX - 5) / this.wrapper.clientWidth * 100 + '%'

    const infoTagPosition = {
      offsetX,
      offsetY
    }

    this.infoTag.instance.setPosition(infoTagPosition, this.mouseOrTouch)

    if (p1.active && p2.active) {
      this.showChildren()
    } else {
      this.showChildren(false)
    }

    if (p1.active) p1.el.style.display = 'block'
    if (p2.active) p2.el.style.display = 'block'

    for (const [, fun] of this.afterTrigger) {
      fun(this.positionResult)
    }
  }
}