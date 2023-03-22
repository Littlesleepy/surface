/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-24 09:38:23
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\ViewHCI\ZoomTrans.ts
 * @Description: 
 */
import { Scene } from '../Scene'
import { Listen, IOffsetPosition } from '../Event'
import { Fence} from '../Fence'
import { Public, Colors } from '../Tools'
import { IViewHCI } from './types'
import { UseTheme } from '../../styles'

export interface IZoomTransOptions {
  minMoveDistanceForZoom?: number
  touchZoomTag?: {
    backgroundColor?: string
    length?: number
  }
  lock?: boolean
  /** 
   * @description: 按下该键取消所有交互
   * @return {*}
   */  
  lockKey?: string
  throttle?: number
}

export class ZoomTrans implements IViewHCI{
  readonly scene: Scene

  readonly event: Listen

  readonly container: HTMLElement

  readonly options = {
    minMoveDistanceForZoom: 30,
    touchZoomTag: {
      backgroundColor: UseTheme.theme.var.tagBgColor,
      length: 1
    },
    lock: true,
    lockKey: 'Control',
    throttle: 60
  }

  private beforeMoveIndex: number | undefined

  private beforeMoveDistance: number | undefined

  private oldTouchZoomDistance: number | undefined

  private towTouchMiddle: number | undefined

  readonly touchZoomTag: {
    el: HTMLSpanElement
    removed: boolean
   }
  
  private manager = new Set<string>([
    Listen.MOUSEDOWN, Listen.MOUSELEAVE, Listen.MOUSEMOVE, Listen.MOUSEUP,
    Listen.WHEEL, Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND
  ])

  private mouseActivation = false

  private lockByKeyboard = false

  constructor (scene: Scene, options?: IZoomTransOptions) {
    this.scene = scene
    
    if (this.scene.fence === undefined) throw new Error('scene缺少fence')

    if (scene.zoomTrans === undefined) scene.zoomTrans = this

    this.container = scene.container

    const event = this.event = this.scene.event

    this.touchZoomTag = {
      el: document.createElement('span'),
      removed: true
    }
    const style = this.touchZoomTag.el.style
    style.position = 'absolute'
    style.backgroundColor = this.options.touchZoomTag.backgroundColor

    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    for (const key of this.manager) {
      event[key].add(this[key])
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

  private wheel = (e: WheelEvent) => {
    if (this.options.lock || this.lockByKeyboard) return
    e.stopPropagation()

    const multiple = e.deltaY < 0 ? 2 : 0.5
    const position = this.event.positionTrans(e)
    const distance = this.getDistanceByPosition(position)
    this.scene.fence!.zoomFromDistance(multiple, distance)
  }
  
  private mousemove = Public.throttle((e: MouseEvent) => {
    if (this.options.lock || !this.mouseActivation) return
    
    if (e.buttons === 2) {
      const position = this.event.positionTrans(e)
      this.trans(position)
    }
  }, this.options.throttle)

  private mousedown = (e: MouseEvent) => {
    if (this.options.lock || this.lockByKeyboard) return
    this.mouseActivation = true
    
    if (e.buttons === 2) {
      const position = this.event.positionTrans(e)
      this.start(position)
    }
  }

  private mouseup = () => {
    if (this.options.lock || !this.mouseActivation) return
    this.mouseActivation = false
    
    this.end()
  }

  private mouseleave = () => {
    if (this.options.lock || !this.mouseActivation) return
    this.mouseActivation = false
    
    this.end()
  }

  private touchstart = () => {
    if (this.options.lock) return
    
    if (this.event.touchPosition.size === 1) {
      const position = this.event.touchPosition.get(0)!
      this.start(position)
    }

    if (this.event.touchPosition.size === 2) {
      this.touchZoomStart()
    }
  }

  private touchmove = Public.throttle(() => {
    if (this.options.lock) return

    if (this.event.touchPosition.size === 1) {
      if (!this.touchZoomTag.removed) {
        this.oldTouchZoomDistance = undefined
        this.towTouchMiddle = undefined
        this.container.removeChild(this.touchZoomTag.el)
        this.touchZoomTag.removed = true
        // 重新计算当前单指位置，切换为单指移动
        const position = this.event.touchPosition.get(0)!
        this.start(position)
      }

      const position = this.event.touchPosition.get(0)!
      this.trans(position)
    }

    if (this.event.touchPosition.size === 2) {
      this.touchZoomMove()
    }
  }, this.options.throttle)

  private touchend = () => {
    if (this.options.lock) return

    if (this.event.touchPosition.size === 0) {
      this.end()
      this.endTouchZoom()
    }

    if (this.event.touchPosition.size === 1) {
      this.endTouchZoom()
      // 重新计算当前单指位置，切换为单指移动
      const position = this.event.touchPosition.get(0)!
      this.start(position)
    }
  }

  private getDistanceByPosition (position: IOffsetPosition) {
    const distance = this.scene.fence!.direction === Fence.TRANSVERSE ?
      position.offsetX / this.container.clientWidth : position.offsetY / this.container.clientHeight
    return distance
  }

  private getDsByPosition (nowP: IOffsetPosition, oldP: IOffsetPosition) {
    const ds = this.scene.fence!.direction === Fence.TRANSVERSE ?
      nowP.offsetX - oldP.offsetX : nowP.offsetY - oldP.offsetY
    return ds
  }

  private trans (currentPosition: IOffsetPosition) {
    if (this.beforeMoveIndex !== undefined && this.beforeMoveDistance !== undefined) {
      const fence = this.scene.fence!
      const baseFence = fence.baseFence
      const distance = this.getDistance(currentPosition)

      const dsTrans = (distance - this.beforeMoveDistance) * 2

      const currentIndexFromMin = baseFence.getFenceIndexByDistance(distance) - baseFence.visibleIndex.min

      // if ('sampling' in fence && !fence.sampling) {
      //   if ((trans > 0 && baseFence.visibleIndex.min === 0) || (trans < 0 && baseFence.visibleIndex.max === baseFence.count - 1)) {
      //     this.scene.fence!.transByDistance(trans)
      //     this.beforeMoveIndex = currentIndexFromMin
  
      //   } else {
      //     const transCount = currentIndexFromMin - this.beforeMoveIndex
      //     // 节流
      //     if (Math.abs(transCount) >= 1) {
      //       this.beforeMoveIndex = currentIndexFromMin
      //       this.scene.fence!.transByCount(transCount)
      //     }
      //   }
      // } else {
      //   const transCount = currentIndexFromMin - this.beforeMoveIndex
      //   // 节流
      //   if (Math.abs(transCount) >= 1) {
      //     this.beforeMoveIndex = currentIndexFromMin
      //     this.scene.fence!.transByCount(transCount)
      //   }
      // }

      const transCount = currentIndexFromMin - this.beforeMoveIndex

      // 节流
      if (Math.abs(transCount) >= 1) {
        this.beforeMoveIndex = currentIndexFromMin
        this.scene.fence!.transByCount(transCount)
      }

      this.beforeMoveDistance = distance
    }
  }

  private start (currentPosition: IOffsetPosition) {
    const baseFence = this.scene.fence!.baseFence
    const distance = this.getDistance(currentPosition)
    this.beforeMoveIndex = baseFence.getFenceIndexByDistance(distance) - baseFence.visibleIndex.min
    this.beforeMoveDistance = distance
  }

  private end () {
    this.beforeMoveIndex = undefined
    this.beforeMoveDistance = undefined
  }

  private endTouchZoom () { 
    this.oldTouchZoomDistance = undefined
    this.towTouchMiddle = undefined
    if (!this.touchZoomTag.removed) {
      this.container.removeChild(this.touchZoomTag.el)
      this.touchZoomTag.removed = true
    }
  }

  private touchZoomStart () {
    const baseFence = this.scene.fence!.baseFence

    const first = this.event.touchPosition.get(0)!
    const second = this.event.touchPosition.get(1)!

    const style = this.touchZoomTag.el.style
    if (this.scene.fence!.direction === Fence.TRANSVERSE) {
      this.towTouchMiddle = (first.offsetX + second.offsetX) / 2 / this.container.clientWidth
      const middle = baseFence.getFenceMiddlePositionByDistance(this.towTouchMiddle)
      style.left = middle * 100 + '%'
      style.bottom = '0%'
      style.height =  this.options.touchZoomTag.length * 100 + '%'
      style.width = '1px'
    } else {
      this.towTouchMiddle = (first.offsetY + second.offsetY) / 2 / this.container.clientHeight
      const middle = baseFence.getFenceMiddlePositionByDistance(this.towTouchMiddle)
      style.left = '0%'
      style.top = middle * 100 + '%'
      style.height = '1px'
      style.width = this.options.touchZoomTag.length * 100 + '%'
    }

    this.container.appendChild(this.touchZoomTag.el)
    this.touchZoomTag.removed = false

    this.oldTouchZoomDistance = this.getTowTouchesDistance()
  }

  private touchZoomMove () {
    if (this.oldTouchZoomDistance !== undefined && this.towTouchMiddle !== undefined) {
      const currentDistance = this.getTowTouchesDistance()
      const ds = currentDistance - this.oldTouchZoomDistance

      if (ds > this.options.minMoveDistanceForZoom) {
        this.scene.fence!.zoomFromDistance(2, this.towTouchMiddle)
        this.oldTouchZoomDistance = currentDistance
      }

      if (ds < -this.options.minMoveDistanceForZoom) {
        this.scene.fence!.zoomFromDistance(0.5, this.towTouchMiddle)
        this.oldTouchZoomDistance = currentDistance
      }
    }
  }

  private getTowTouchesDistance () {
    const first = this.event.touchPosition.get(0)!
    const second = this.event.touchPosition.get(1)!

    const dx = first.offsetX - second.offsetX
    const dy = first.offsetY - second.offsetY

    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  }

  private getDistance (position: IOffsetPosition) {
    return this.scene.fence!.direction === Fence.TRANSVERSE ? position.offsetX / this.container.clientWidth : position.offsetY / this.container.clientHeight
  }
}