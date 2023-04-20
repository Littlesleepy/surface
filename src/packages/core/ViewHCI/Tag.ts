/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-19 17:16:01
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\core\ViewHCI\Tag.ts
 * @Description: 
 */
import { UseTheme } from '../../styles'
import { IOffsetPosition, Listen } from '../Event'
import { Fence, FencesType, isLayersFenceType } from '../Fence'
import { Public } from '../Tools'
import { IPositionResult } from './types'
/**
 * @description: 距离差接口
 */
export interface IPoor {
  x: number
  y: number
}

export interface ITagOptions {
  /**
   * @description: 方向
   */ 
  direction?: string
  /**
   * @description: 厚度
   */ 
  width?: number
  /**
   * @description: 背景颜色
   */ 
  backgroundColor?: string
  /**
   * @description: 选中后背景颜色
   */  
  selectColor?: string
  /**
   * @description: 是否需要拖拽点
   */  
  ddPoint?: {
    show?: boolean
    fontSize?: number
    color?: string
    zIndex?: string
  }
  /**
   * @description: 是否可拖拽
   */  
  drag?: boolean
  /**
   * @description: fence
   */  
  fence?: FencesType
  /**
   * @description: 是否需要设置鼠标样式
   */  
  cursor?: boolean
}

export class Tag {
  /**
   * @description: 方向
   */  
  direction = Fence.VERTICAL
  /**
   * @description: fence索引，如果有fence且方向和fence相反，该数字值存在
   */  
  fenceIndex: number | undefined
  /**
   * @description: 如果fenceIndex存在则dataIndex存在
   */  
  dataIndex: number | undefined
  /**
   * @description: 当前位置相关信息
   */  
  positionResult: IPositionResult
  /**
   * @description: 信息挂载点
   */  
  ddPoint: HTMLElement | undefined
  /**
   * @description: 当前交互方式手指|鼠标
   */  
  mouseOrTouch = Listen.MOUSE
  /**
   * @description: 开始移动前的回电函数集（选中）
   */  
  beforeStart = new Map<string, (positions: IPositionResult) => void>()
  /**
   * @description: 移动后的回调函数集
   */  
  afterMove = new Map<string, (positions: IPositionResult) => void>()
  /**
   * @description: 结束移动后的回调函数集（停止选中）
   */  
  afterEnd = new Map<string, (positions: IPositionResult) => void>()

  readonly container: HTMLElement

  readonly el: HTMLDivElement

  fence: FencesType | undefined

  readonly options = {
    width: 1,
    backgroundColor: UseTheme.theme.var.tagBgColor,
    selectColor: UseTheme.theme.var.tagSelectColor,
    ddPoint: {
      show: false,
      fontSize: 30,
      color: UseTheme.theme.var.tagBgColor,
      zIndex: '100'
    },
    drag: false,
    cursor: false
  }

  private hasActive = false

  constructor (container: HTMLElement, options?: ITagOptions) {
    this.container = container

    if (options) {
      Public.copyValueFromObject(this.options, options)

      if (options.direction !== undefined) this.direction = options.direction

      if (options.fence) this.fence = options.fence
    }

    this.el = document.createElement('div')

    if (this.options.ddPoint.show) {
      const ddOptions = this.options.ddPoint
      this.ddPoint = document.createElement('i')
      const ddStyle = this.ddPoint.style
      ddStyle.fontSize = ddOptions.fontSize + 'px'
      ddStyle.color = ddOptions.color
      ddStyle.margin = 'auto'
      ddStyle.position = 'relative'
      ddStyle.zIndex = ddOptions.zIndex
      if (this.options.width <= ddOptions.fontSize) {
        if (this.direction === Fence.TRANSVERSE) {
          ddStyle.top = -(ddOptions.fontSize - this.options.width) / 2 + 'px'
          ddStyle.cursor = 'n-resize'
        } else {
          ddStyle.left = -(ddOptions.fontSize - this.options.width) / 2 + 'px'
          ddStyle.cursor = 'e-resize'

          // 旋转90度
          ddStyle.transform = 'rotate(90deg)'
        }
      }

      this.ddPoint.classList.add(...['iconfont', 'icon-ketuozhuai'])

      this.el.style.display = 'flex'

      this.el.appendChild(this.ddPoint)
    }

    if (this.options.drag) {
      this.el.addEventListener(Listen.MOUSEDOWN, this.mousedown)
      this.el.addEventListener(Listen.TOUCHSTART, this.touchstart)
      this.container.addEventListener(Listen.MOUSEMOVE, this.mousemove)
      this.container.addEventListener(Listen.MOUSEUP, this.mouseup)
      this.container.addEventListener(Listen.TOUCHMOVE, this.touchmove)
      this.container.addEventListener(Listen.TOUCHEND, this.touchend)
    }

    const style = this.el.style
    style.backgroundColor = this.options.backgroundColor
    style.position = 'absolute'

    if (this.direction === Fence.VERTICAL) {
      style.width = `${this.options.width}px`
      style.height = '100%'
      if (this.options.cursor) style.cursor = 'col-resize'
    } else {
      style.width = '100%'
      style.height = `${this.options.width}px`
      if (this.options.cursor) style.cursor = 'row-resize'
    }

    this.positionResult = {
      offsetX: 0,
      offsetPCTX: 0,
      offsetMiddlePCTX: 0,
      offsetY: 0,
      offsetPCTY: 0,
      offsetMiddlePCTY: 0
    }
  }

  /**
   * @description: 更新配置，针对对UI有调整的需求
   * @param {IToolTipOptions} options 配置
   * @return {*}
   */  
  setOptions (options: ITagOptions) {
    Public.copyValueFromObject(this.options, options)

    const style = this.el.style
    style.backgroundColor = this.options.backgroundColor

    if (this.ddPoint) {
      const ddStyle = this.ddPoint.style
      const ddOptions = this.options.ddPoint
      ddStyle.zIndex = ddOptions.zIndex
      ddStyle.color = ddOptions.color
      ddStyle.fontSize = ddOptions.fontSize + 'px'
    }

    if (this.direction === Fence.VERTICAL) {
      style.width = `${this.options.width}px`
    } else {
      style.height = `${this.options.width}px`
    }
  }
  /** 
   * @description: 磁吸器，可将tag调整到最近的fence刻度位置
   * @param {boolean} useAfterMove 是否触发aftermove回调，默认为true触发
   * @return {*}
   */  
  magnet (useAfterMove = true) {
    if (this.fence !== undefined && this.fence.practicalCount !== 0) {
      const position: IOffsetPosition = { offsetX: this.positionResult.offsetX, offsetY: this.positionResult.offsetY }
      this.setPosition(position, this.fence, false, useAfterMove)
    }
  }
  /**
   * @description: 磁吸功能
   */
  magnetByMax(fence: FencesType, group: Array<Float32Array> | Array<Array<number>>) {
    if (group.length > 0) {
      const range = fence.options.eachPieceMaxWidth / 2 / fence.expectCount
      // 以当前tag位置为中心，range为半径计算计算落入范围的刻度索引，并计算出他们的最大值所处刻度
      const center = fence.direction === Fence.TRANSVERSE ? this.positionResult.offsetMiddlePCTX : this.positionResult.offsetMiddlePCTY

      let min = (center - range) * 2 - 1, max = (center + range) * 2 - 1
      if (min < -1) min = -1
      if (max > 1) max = 1

      if (this.fenceIndex) {
        // 小边界
        let left = this.fenceIndex
        for (; left >= 0; left--) {
          if (fence.baseFence.pieces[left] < min) {
            left++
            break
          }
        }
        
        // 大边界
        let right = this.fenceIndex, len = fence.baseFence.pieces.length
        for (; right < len; right++) {
          if (fence.baseFence.pieces[right] > max) {
            right--
            break
          }
        }

        if (left < 0) left = 0
        if (left >= len) left = len - 1
        if (right < 0) right = 0
        if (right >= len) right = len - 1

        // 边界内所有组的最大值
        let maxValue: number | undefined, maxIndex = left
        for (let j = 0; j < group.length; j++) {
          const groupItem = group[j]
          if (maxValue === undefined) maxValue = groupItem[left]
          // 当前组最大值
          for (let i = left; i <= right; i++) {
            const item = groupItem[i]
            if (maxValue! < item) {
              maxValue = item
              maxIndex = i
            }
          }
        }

        // 移动tip位置
        const result = this.setPositionByFenceIndex(fence, maxIndex)
        return result
      }
    }
  }
  /**
   * @description: 设置tag位置并返回其位置数据
   * @param {IOffsetPosition} position 要设置的位置（刻度线中心位置）
   * @param {FencesType} fence fence
   * @param {boolean} limit 是否开启区域限制，true则tag位置不会超出容器，undefined或false则无限制
   * @param {boolean} useAfterMove 是否触发aftermove回调，默认为true触发
   * @return {*}
   */  
  setPosition (position: IOffsetPosition, fence?: FencesType, limit?: boolean, useAfterMove = true) {
    if (this.container.clientHeight === 0 || this.container.clientWidth === 0) {
      throw new Error('请确保容器被渲染')
    }

    let offsetX = position.offsetX - this.options.width / 2
    let offsetPCTX = (position.offsetX - this.options.width / 2) / this.container.clientWidth
    let offsetMiddlePCTX = position.offsetX / this.container.clientWidth

    let offsetY = position.offsetY - this.options.width / 2
    let offsetPCTY = (position.offsetY - this.options.width / 2) / this.container.clientHeight
    let offsetMiddlePCTY = position.offsetY / this.container.clientHeight

    let fenceIndex: number | undefined

    // 如果fence存在并且已经刷新
    if (fence !== undefined && fence.practicalCount !== 0) {
      if (this.direction === Fence.VERTICAL) {
        if (fence.direction === Fence.TRANSVERSE) {
          const index = fence.baseFence.getFenceIndexByDistance(offsetMiddlePCTX)
          fenceIndex = index
          offsetMiddlePCTX = fence.baseFence.getFenceMiddlePositionByFenceIndex(index)

          offsetPCTX = offsetMiddlePCTX - this.options.width / 2 / this.container.clientWidth
          
          offsetX = offsetPCTX * this.container.clientWidth
        }
      } else {
        if (fence.direction === Fence.VERTICAL) {
          const index = fence.baseFence.getFenceIndexByDistance(offsetMiddlePCTY)
          fenceIndex = index
          offsetMiddlePCTY = fence.baseFence.getFenceMiddlePositionByFenceIndex(index)

          offsetPCTY = offsetMiddlePCTY - this.options.width / 2 / this.container.clientHeight
          
          offsetY = offsetPCTY * this.container.clientHeight
        }
      }

    }
    // 如果边界开启限制
    if (limit) {
      if (offsetMiddlePCTX < 0 || offsetMiddlePCTX > 1 || offsetMiddlePCTY < 0 || offsetMiddlePCTY > 1) {
        return this.positionResult
      }
    }

    this.fenceIndex = fenceIndex

    this.positionResult.fenceIndex = fenceIndex
    this.positionResult.offsetX = offsetX
    this.positionResult.offsetPCTX = offsetPCTX
    this.positionResult.offsetMiddlePCTX = offsetMiddlePCTX
    this.positionResult.offsetY = offsetY
    this.positionResult.offsetPCTY = offsetPCTY
    this.positionResult.offsetMiddlePCTY = offsetMiddlePCTY

    if (fence && this.fenceIndex !== undefined) {
      if (isLayersFenceType(fence)) {
        this.dataIndex = fence.cutDataIndexArr[this.fenceIndex]
      } else {
        this.dataIndex = this.fenceIndex
      }
    }
    
    if (this.direction === Fence.VERTICAL) {
      this.setPositionByOffSetX(offsetPCTX)
    } else {
      this.setPositionByOffSetY(offsetPCTY)
    }

    if (useAfterMove) {
      for (const [, fun] of this.afterMove) {
        fun(this.positionResult)
      }
    }

    return this.positionResult
  }
  /**
   * @description: 通过距离差设置位置
   * @param {IPoor} poor 距离差[0-1]
   * @param {FencesType} fence fence
   * @param {boolean} limit 是否开启区域限制，true则tag位置不会超出容器，undefined或false则无限制
   * @return {*}
   */  
  setPositionByPoor (poor: IPoor, fence?: FencesType, limit?: boolean) {
    // 计算出新的位置
    const currentPosition = this.positionResult
    const offsetX = currentPosition.offsetMiddlePCTX * this.container.clientWidth
    const offsetY = currentPosition.offsetMiddlePCTY * this.container.clientHeight

    const position: IOffsetPosition = {
      offsetX: offsetX + poor.x,
      offsetY: offsetY + poor.y
    }

    return this.setPosition(position, fence, limit)
  }
  /**
   * @description: 通过fenceIndex设置位置
   * @param {FencesType} fence fence
   * @param {number} index fenceIndex 如果没赋值且自身fenceIndex有效则使用自身fenceIndex
   * @return {*}
   */  
  setPositionByFenceIndex (fence: FencesType, index?: number) {
    if (index) {
      this.positionResult.fenceIndex = index
      this.fenceIndex = index
    }

    const fenceIndex = this.fenceIndex

    if (fenceIndex !== undefined) {
      const offsetMiddle = fence.baseFence.getFenceMiddlePositionByFenceIndex(fenceIndex)

      this.positionResult.fenceIndex = fenceIndex
      this.fenceIndex = fenceIndex

      this.setPositionByOffsetMiddle(offsetMiddle)

      for (const [, fun] of this.afterMove) {
        fun(this.positionResult)
      }
  
      return this.positionResult
    }
  }
  /**
   * @description: 通过dataIndex设置位置
   * @param {FencesType} fence fence
   * @param {number} index dataIndex 如果没赋值且自身dataIndex有效则使用自身dataIndex
   * @return {*}
   */  
  setPositionByDataIndex (fence: FencesType, index?: number) {
    if (index) this.dataIndex = index

    if (this.dataIndex !== undefined) {
      let offsetMiddle: number
      if (isLayersFenceType(fence) && fence.baseFence.eachPieceWidth === fence.baseFence.eachPieceWidthInitial) {
        offsetMiddle = (this.dataIndex - fence.cutDataStartIndex + 1) / fence.cutDataLength
      } else {
        let _index = this.dataIndex - fence.cutDataStartIndex + fence.baseFence.visibleIndex.min
        offsetMiddle = fence.baseFence.getFenceMiddlePositionByFenceIndex(_index)
      }

      if (!isNaN(offsetMiddle)) {

        const fenceIndex = fence.baseFence.getFenceIndexByDistance(offsetMiddle)
        this.positionResult.fenceIndex = fenceIndex
        this.fenceIndex = fenceIndex
        this.setPositionByOffsetMiddle(offsetMiddle)

        for (const [, fun] of this.afterMove) {
          fun(this.positionResult)
        }
      }

      return this.positionResult
    }
  }

  /**
   * @description: 添加到目标容器
   */  
  append() {
    if (!this.container.contains(this.el)) this.container.appendChild(this.el)
  }
  /**
   * @description: 从目标容器移除
   */
  remove () {
    if (this.container.contains(this.el))  this.container.removeChild(this.el)
  }

  dispose () {
    if (this.options.drag) {
      this.el.removeEventListener(Listen.MOUSEDOWN, this.mousedown)
      this.el.removeEventListener(Listen.TOUCHSTART, this.touchstart)
      this.container.removeEventListener(Listen.MOUSEMOVE, this.mousemove)
      this.container.removeEventListener(Listen.MOUSEUP, this.mouseup)
      this.container.removeEventListener(Listen.TOUCHMOVE, this.touchmove)
      this.container.removeEventListener(Listen.TOUCHEND, this.touchend)
    }
  }

  private setPositionByOffsetMiddle (offsetMiddle: number) {
    if (this.direction === Fence.VERTICAL) {
      this.positionResult.offsetMiddlePCTX = offsetMiddle

      const offsetPCTX = offsetMiddle - this.options.width / 2 / this.container.clientWidth
      this.positionResult.offsetPCTX = offsetPCTX
      this.positionResult.offsetX = offsetPCTX * this.container.clientWidth
      this.setPositionByOffSetX(offsetPCTX)
    } else {
      this.positionResult.offsetMiddlePCTY = offsetMiddle

      const offsetPCTY = offsetMiddle - this.options.width / 2 / this.container.clientHeight
      this.positionResult.offsetPCTY = offsetPCTY
      this.positionResult.offsetY = offsetPCTY * this.container.clientHeight

      this.setPositionByOffSetY(offsetPCTY)
    }
  }

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

      this.el.style.backgroundColor = this.options.selectColor

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
        this.setPosition(position, this.fence)
      }
    }
  }

  private mouseup = () => {
    if (this.hasActive) this.end()
  }

  private touchstart = (e: TouchEvent) => {
    this.mouseOrTouch = Listen.TOUCH

    this.hasActive = true

    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      e.stopPropagation()

      this.el.style.backgroundColor = this.options.selectColor

      for (const [, fun] of this.beforeStart) {
        fun(this.positionResult)
      }
    }
  }

  private touchmove = (e: TouchEvent) => {
    const result = Listen.transTouchEvent(e, this.container)

    if (result.size === 1) {
      if (this.hasActive) {
        e.stopPropagation()

        const position = result.get(0)!

        this.setPosition(position, this.fence)
      }
    }
  }

  private touchend = () => {
    if (this.hasActive) this.end()
  }

  private end () {
    this.hasActive = false
    this.el.style.backgroundColor = this.options.backgroundColor
    
    for (const [, fun] of this.afterEnd) {
      fun(this.positionResult)
    }
  }

  /**
   * @description: 获取鼠标事件偏移位置
   * @param {MouseEvent} e MouseEvent | WheelEvent
   * @return {*}
   */  
  private positionTrans (e: MouseEvent | WheelEvent) {
    const domRect = this.container.getBoundingClientRect()
    return {
      offsetX: e.clientX - domRect.left,
      offsetY: e.clientY - domRect.top
    }
  }

  private setPositionByOffSetX (offsetPCTX: number) {
    this.el.style.opacity = '1'
    if (offsetPCTX > 1) {
      if (this.ddPoint) {
        this.el.style.left = '100%'
      } else {
        this.el.style.opacity = '0'
        this.el.style.left = offsetPCTX * 100 + '%'
      }
    }
    if (offsetPCTX < 0) {
      if (this.ddPoint) {
        this.el.style.left = '0%'
      } else {
        this.el.style.opacity = '0'
        this.el.style.left = offsetPCTX * 100 + '%'
      }
    }
    if (offsetPCTX <= 1 && offsetPCTX >= 0) this.el.style.left = offsetPCTX * 100 + '%'
  }

  private setPositionByOffSetY (offsetPCTY: number) {
    this.el.style.opacity = '1'
    if (offsetPCTY > 1) {
      if (this.ddPoint) {
        this.el.style.top = '100%'
      } else {
        this.el.style.opacity = '0'
        this.el.style.top = offsetPCTY * 100 + '%'
      }
    }
    if (offsetPCTY < 0) {
      if (this.ddPoint) {
        this.el.style.top = '0%'
      } else {
        this.el.style.opacity = '0'
        this.el.style.top = offsetPCTY * 100 + '%'
      }
    }
    if (offsetPCTY <= 1 && offsetPCTY >= 0) this.el.style.top = offsetPCTY * 100 + '%'
  }
}