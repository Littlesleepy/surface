import { IClientPosition } from '../Overlay/PopupMenu'
import { Tag } from '../ViewHCI'
/**
 * @description: 相对容器偏移
 */
export interface IOffsetPosition {
  /**
   * @description: 相对位置，单位px
   */  
  offsetX: number
  /**
   * @description: 相对位置，单位px
   */ 
  offsetY: number
}

export type IPosition = IOffsetPosition & IClientPosition

export class Listen {
  static readonly MOUSE = 'mouse'

  static readonly TOUCH = 'touch'

  static readonly CLICK = 'click'
   
  static readonly CONTEXTMENU = 'contextmenu'

  static readonly DBLCLICK = 'dblclick'

  static readonly MOUSEDOWN = 'mousedown'

  static readonly MOUSEENTER = 'mouseenter'

  static readonly MOUSELEAVE = 'mouseleave'

  static readonly MOUSEMOVE = 'mousemove'

  static readonly MOUSEOVER = 'mouseover'

  static readonly MOUSEOUT = 'mouseout'

  static readonly MOUSEUP = 'mouseup'

  static readonly WHEEL = 'wheel'

  static readonly KEYDOWN = 'keydown'

  static readonly KEYPRESS = 'keypress'

  static readonly KEYUP = 'keyup'

  static readonly TOUCHSTART = 'touchstart'

  static readonly TOUCHMOVE = 'touchmove'

  static readonly TOUCHEND = 'touchend'

  static readonly TOUCHCANCEL = 'touchcancel'
  /**
   * @description: 屏幕方向改变事件
   */  
  static readonly SCREEN_CHANGE = 'change'
  /**
   * @description: 转换触屏事件
   * @param {TouchEvent} e 触屏事件
   * @param {HTMLElement} container 容器
   * @return {*}
   */  
  static transTouchEvent (e: TouchEvent, container: HTMLElement) {
    const touchPosition = new Map<number, IPosition>()
    const domRect = container.getBoundingClientRect()
    for (let i = 0, len = e.touches.length; i < len; i++) {
      const item = e.touches[i]
      const offsetX = item.clientX - domRect.left
      const offsetY = item.clientY - domRect.top

      if (offsetX >= 0 && offsetX <= container.clientWidth && offsetY >= 0 && offsetY <= container.clientHeight) {
        touchPosition.set(touchPosition.size, { offsetX, offsetY, clientX: item.clientX, clientY: item.clientY })
      }
    }

    return touchPosition
  }

  private container: HTMLElement

  private mananger = new Set<string>([
    Listen.CLICK, Listen.CONTEXTMENU, Listen.DBLCLICK, Listen.MOUSEDOWN, Listen.MOUSEENTER,
    Listen.MOUSELEAVE, Listen.MOUSEMOVE, Listen.MOUSEOVER, Listen.MOUSEOUT,Listen.MOUSEUP,Listen.WHEEL,
    Listen.KEYDOWN, Listen.KEYPRESS, Listen.KEYUP, Listen.TOUCHSTART, Listen.TOUCHMOVE, Listen.TOUCHEND,
    Listen.TOUCHCANCEL
  ])

  mousePosition: IPosition | undefined

  touchPosition: Map<number, IPosition> = new Map()

  constructor (container: HTMLElement) {
    this.container = container

    for (const key of this.mananger) {
      this.container.addEventListener(key, this['_' + key], false)
    }

    screen.orientation.addEventListener(Listen.SCREEN_CHANGE, this._screenChange, false)
  }
  /**
   * @description: 获取鼠标事件偏移位置
   * @param {MouseEvent} e MouseEvent | WheelEvent
   * @return {*}
   */  
  positionTrans (e: MouseEvent | WheelEvent): IPosition {
    const domRect = this.container.getBoundingClientRect()
    return {
      offsetX: e.clientX - domRect.left,
      offsetY: e.clientY - domRect.top,
      clientX: e.clientX,
      clientY: e.clientY
    }
  }
  
  private eventBind(e: MouseEvent | KeyboardEvent | WheelEvent | TouchEvent | Event, name: string, type?: string) {
    for (const event of this[name]) {
      if (type !== undefined) {
        event(e, type)
      } else {
        event(e)
      }
    }
  }

  private setMouseEvent (e: MouseEvent | WheelEvent) {
    e.preventDefault()
    this.mousePosition = this.positionTrans(e)
  }

  private setTouchEvent (e: TouchEvent) {
    if (e.cancelable) e.preventDefault()
    
    this.touchPosition = Listen.transTouchEvent(e, this.container)
  }

  click = new Set<(e: MouseEvent) => void>()
  private _click = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.CLICK)
  }

  private _contextmenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  dblclick = new Set<(e: MouseEvent | TouchEvent, type: string) => void>()

  private _dblclick = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.DBLCLICK, Listen.MOUSE)
  }

  mousedown = new Set<(e: MouseEvent) => void>()
  private _mousedown = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.MOUSEDOWN)
  }

  mouseenter = new Set<(e: MouseEvent) => void>()
  private _mouseenter = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.MOUSEENTER)
  }

  mouseleave = new Set<(e: MouseEvent) => void>()
  private _mouseleave = (e: MouseEvent) => {
    this.mousePosition = undefined

    this.eventBind(e, Listen.MOUSELEAVE)
  }

  mousemove = new Set<(e: MouseEvent) => void>()
  private _mousemove = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.MOUSEMOVE)
  }

  mouseover = new Set<(e: MouseEvent) => void>()
  private _mouseover = (e: MouseEvent) => {
    this.setMouseEvent(e)

    this.eventBind(e, Listen.MOUSEOVER)
  }

  mouseout = new Set<(e: MouseEvent) => void>()
  private _mouseout = (e: MouseEvent) => {
    this.mousePosition = undefined

    this.eventBind(e, Listen.MOUSEOUT)
  }

  mouseup = new Set<(e: MouseEvent) => void>()
  private _mouseup = (e: MouseEvent) => {
    this.mousePosition = undefined

    this.eventBind(e, Listen.MOUSEUP)
  }

  wheel = new Set<(e: WheelEvent) => void>()
  private _wheel = (e: WheelEvent) => {
    this.setMouseEvent(e)
    
    this.eventBind(e, Listen.WHEEL)
  }

  keydown = new Set<(e: KeyboardEvent) => void>()
  private _keydown = (e: KeyboardEvent) => {
    this.eventBind(e, Listen.KEYDOWN)
  }

  keypress = new Set<(e: KeyboardEvent) => void>()
  private _keypress = (e: KeyboardEvent) => {
    this.eventBind(e, Listen.KEYPRESS)
  }

  keyup = new Set<(e: KeyboardEvent) => void>()
  private _keyup = (e: KeyboardEvent) => {
    this.eventBind(e, Listen.KEYUP)
  }
  
  private touchStartTime: number | undefined = undefined
  touchstart = new Set<(e: TouchEvent) => void>()
  private _touchstart = (e: TouchEvent) => {
    this.setTouchEvent(e)

    this.eventBind(e, Listen.TOUCHSTART)

    // 双击
    const now = new Date().getTime()
    if (this.touchPosition.size === 1) {
      if (this.touchStartTime === undefined) {
        this.touchStartTime = now
      } else {
        if (now - this.touchStartTime < 300) {
          this.eventBind(e, Listen.DBLCLICK, Listen.TOUCH)
          this.touchStartTime = undefined
        } else {
          this.touchStartTime = now
        }
      }
    }
  }

  touchmove = new Set<(e: TouchEvent) => void>()
  private _touchmove  =(e: TouchEvent) => {
    this.setTouchEvent(e)

    this.eventBind(e, Listen.TOUCHMOVE)
  }

  touchend = new Set<(e: TouchEvent) => void>()
  private _touchend = (e: TouchEvent) => {
    this.setTouchEvent(e)

    this.eventBind(e, Listen.TOUCHEND)
  }

  touchcancel = new Set<(e: TouchEvent) => void>()
  private _touchcancel = (e: TouchEvent) => {
    this.setTouchEvent(e)

    this.eventBind(e, Listen.TOUCHEND)
  }

  screenChange = new Set<(e: Event) => void>()
  private _screenChange = (e: Event) => {
    this.eventBind(e, 'screenChange')
  }

  dispose () {
    for (const key of this.mananger) {
      this.container.removeEventListener(key, this['_' + key], false)
    }

    screen.orientation.removeEventListener(Listen.SCREEN_CHANGE, this._screenChange, false)
  }
}