/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-05 16:10:20
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-03 11:51:31
 * @FilePath: \zxi-device\src\packages\core\Overlay\Marker.ts
 * @Description: Marker类
 */
import { Colors, Fence, Scene, Anchor, IAnchor, Listen, Public } from '..'
import { UseTheme } from '../../styles'

export interface IMarker {
  index: number
  anchor: IAnchor
  link?: HTMLElement
  el?: HTMLElement
  properties?: any
}

export type IMarkerOptions = {
  link?: {
    show?: boolean
    icon?: string
    /** 
     * @description: 单位px
     */    
    fontSize?: number
    color?: string
  }
  chain: {
    color: string
    thickness: string
    offSet: number
  }
} & IAnchor

export class Marker {
  readonly anchor: Anchor

  readonly scene: Scene

  readonly afterAdd = new Map<string, (markers: Map<number, IMarker>) => void>()

  readonly afterRemove = new Map<string, (markers: Map<number, IMarker>) => void>()

  readonly afterLink = new Map<string, (start: IMarker, end: IMarker) => void>()

  readonly closeButton: HTMLElement

  readonly chain: {
    cache?: IMarker
    start?: IMarker,
    end?: IMarker,
    el: HTMLDivElement
    removed: boolean
  }

  readonly options = {
    type: Fence.VERTICAL,
    anchor: {
      backgroundColor: UseTheme.theme.var.color,
      width: 1
    },
    anchorPoint: {
      radius: 6,
      backgroundColor: UseTheme.theme.var.color
    },
    link: {
      show: true,
      icon: 'icon-suoding',
      /** 
       * @description: 单位px
       */    
      fontSize: 30,
      color: UseTheme.theme.var.tagBgColor
    },
    chain: {
      color: UseTheme.theme.var.tagBgColor,
      thickness: '1px',
      offSet: 0.6
    }
  }

  readonly manager = new Map<number, IMarker>()

  private closeButtonRemoved = true

  constructor (scene: Scene, options?: IMarkerOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }
    this.anchor = new Anchor(scene, this.options)

    this.scene = scene

    this.closeButton = document.createElement('i')
    this.closeButton.classList.add(...['iconfont', 'icon-qingkong'])
    this.closeButton.style.cssText = `
      position: absolute;
      display: block;
      cursor: pointer;
      font-size: 40px;
      top: 10px;
      right: 10px;
      zIndex: 100;
      color: ${UseTheme.theme.var.color};
    `
    this.closeButton.title = '清除所有信号标记'
    this.closeButton.addEventListener(Listen.MOUSEDOWN, (e) => {
      e.stopPropagation()
    })

    this.closeButton.addEventListener(Listen.TOUCHSTART, (e) => {
      e.stopPropagation()
    })

    this.closeButton.addEventListener(Listen.CLICK, () => {
      this.dispose()
    })

    this.closeButton.addEventListener(Listen.TOUCHEND, () => {
      this.dispose()
    })

    this.afterAdd.set('built-in', () => {
      if (this.manager.size > 0 && this.closeButtonRemoved) {
        this.scene.container.appendChild(this.closeButton)
        this.closeButtonRemoved = false
      }
    })
    this.afterRemove.set('built-in', (deletes) => {
      if (this.manager.size === 0 && !this.closeButtonRemoved) {
        this.scene.container.removeChild(this.closeButton)
        this.closeButtonRemoved = true
      }

      deletes.forEach(marker => {
        if ((this.chain.start && marker.index === this.chain.start.index) || (this.chain.end && marker.index === this.chain.end.index)) {
          this.removeChain()
        }

        if (this.chain.cache && this.chain.cache.index === marker.index) {
          this.chain.cache = undefined
        }
      })
    })
    
    // 连接区容器
    const chain = document.createElement('div')
    // 厚度
    const thickness = this.options.type === Fence.VERTICAL ? 'height' : 'width'
    const direction = this.options.type === Fence.VERTICAL ? 'right' : 'bottom'
    const repeat = this.options.type === Fence.VERTICAL ? 'repeat-x' : 'repeat-y'
    const size = this.options.type === Fence.VERTICAL ? `8px ${this.options.chain.thickness};` : `${this.options.chain.thickness} 8px;`
    chain.style.cssText = `
      position: absolute;
      display: flex;
      ${thickness}: ${this.options.chain.thickness};
      background-image: linear-gradient(to ${direction}, ${this.options.chain.color} 0%, ${this.options.chain.color} 50%, transparent 50%);
      background-size: ${size};
      background-repeat: ${repeat};
    `
    this.chain = { el: chain, removed: true }
    if (this.scene.fence) {
      this.scene.fence.afterZoomOrTrans.add(() => {
        this.setChainPosition()
      })
    }
  }

  /** 
   * @description: 批量添加marker
   * @param {Array} anchors 添加锚的索引集合
   * @return {*} 返回添加marker
   */  
  add (
    anchors: Map<number, {
    backgroundColor?: string
    width?: number
    el?: HTMLElement
    properties?: any
  } | undefined>) {
    const adds = this.anchor.add(anchors)
    
    const addMarker = new Map<number, IMarker>()
    for (const [index, anchor] of adds) {
      const container = anchor.instance.el
      container.style.cursor = 'pointer'

      // 自定义挂载
      const option = anchors.get(index)
      const marker: IMarker = { index, anchor, el: option?.el }
      if (option) {
        if (option.el) container.appendChild(option.el)
        marker.properties = option.properties
      }

      // 创建连接锁
      const link = this.createLink(marker)
      if (link) {
        marker.link = link
        container.appendChild(link)
      }
      // 添加marker
      addMarker.set(index, marker)
      this.manager.set(index, marker)
    }

    for (const [, fun] of this.afterAdd) {
      fun(addMarker)
    }

    return addMarker
  }
  /** 
   * @description: 批量移除marker
   * @param {Array} indexs 移除锚的索引数组
   * @return {*} 返回被移除的marker
   */
  remove (indexs: Array<number>) {
    const deletes = this.anchor.remove(indexs)
    const deletesMarker = new Map<number, IMarker>()
    deletes.forEach((anchor, index) => {
      const marker = this.manager.get(index)
      this.manager.delete(index)
      if (marker) deletesMarker.set(index, marker)
    })

    for (const [, fun] of this.afterRemove) {
      fun(deletesMarker)
    }

    return deletesMarker
  }
  /** 
   * @description: 清空所有marker
   * @return {*} 返回被移除的marker
   */
  clear () {
    const deletes = this.anchor.clear()
    const deletesMarker = new Map<number, IMarker>()
    deletes.forEach((anchor, index) => {
      const marker = this.manager.get(index)
      this.manager.delete(index)
      if (marker) deletesMarker.set(index, marker)
    })

    for (const [, fun] of this.afterRemove) {
      fun(deletesMarker)
    }

    return deletesMarker
  }

  dispose () {
    this.anchor.dispose()
    this.clear()
  }
  /** 
   * @description: 设置数据跟踪标记
   * @param {Map} sources 数据锚点Map<number: 锚的索引, Map<string: 锚上追踪点的key, { value: 归一化[0-1] }>>
   * @return {*}
   */ 
  setPoints (sources: Map<number, Map<string, { value: number, color?: string, radius?: number }>>) {
    this.anchor.setPoints(sources)
  }
  /** 
   * @description: 连接两个marker
   * @param {number} marker1 marker1
   * @param {number} marker2 marker2
   * @return {*}
   */  
  linkMarker (marker1: IMarker, marker2: IMarker) {
    const start = marker1.index < marker2.index ? marker1 : marker2
    const end = marker1.index > marker2.index ? marker1 : marker2
    this.chain.start = start
    this.chain.end = end

    this.manager.forEach(m => {
      if (m.link) m.link.style.color = this.options.link.color
    })

    if (start.link) start.link.style.color = 'red'
    if (end.link) end.link.style.color = 'red'
    this.setChainPosition()

    for (const [, fun] of this.afterLink) {
      fun(start, end)
    }
  }
  /** 
   * @description: 取消marker连接
   */  
  removeChain () {
    this.scene.container.removeChild(this.chain.el)
    this.chain.removed = true

    this.chain.start = undefined
    this.chain.end = undefined
    this.chain.cache = undefined
    this.manager.forEach(m => {
      if (m.link) m.link.style.color = this.options.link.color
    })
  }

  private handlAddLink = (link: HTMLElement, marker: IMarker) => {
    // 如果已经处于连接状态则取消连接
    if (!this.chain.removed) {
      this.removeChain()
    }

    if (this.chain.cache === undefined) {
      this.chain.cache = marker
      link.style.color = UseTheme.theme.var.tagSelectColor
    } else {
      if (this.chain.cache === marker) { // 选中同一个marker，取消
        link.style.color = this.options.link.color
      } else {
        this.linkMarker(this.chain.cache, marker)
      }
      this.chain.cache = undefined
    }
  }

  private createLink (marker: IMarker) {
    const linkOp = this.options.link
    if (linkOp.show) {
      const link = document.createElement('i')
      link.classList.add(...['iconfont', linkOp.icon])
      const bottom = this.options.type === Fence.VERTICAL ? 'bottom' : 'left'
      const left = this.options.type === Fence.VERTICAL ? 'left' : 'top'
      link.style.cssText = `
        color: ${linkOp.color};
        font-size: ${linkOp.fontSize}px;
        position: absolute;
        padding: 10px 10px 0 10px;
        ${bottom}: 0;
        ${left}: -${Math.floor(linkOp.fontSize / 2) + 10}px;
      `
      if (this.options.type === Fence.TRANSVERSE) {
        // 旋转锁icon
        link.style.transformOrigin = 'center'
        link.style.transform = 'rotate(90deg)'
      }

      link.title = '选中两把锁可连接对应标注'

      link.addEventListener(Listen.CLICK, () => {
        this.handlAddLink(link, marker)
      })

      // link.addEventListener(Listen.TOUCHEND, () => {
      //   this.handlAddLink(link, marker)
      // })

      return link
    }

    return undefined
  }
  /** 
   * @description: 设置link对之间链条的位置
   * @return {*}
   */  
  private setChainPosition () {
    if (this.chain.start && this.chain.end) {
      const style = this.chain.el.style
      const startPosition = this.chain.start.anchor.instance.positionResult
      const endPosition = this.chain.end.anchor.instance.positionResult

      style.display = 'flex'
      if (this.options.type === Fence.VERTICAL) {
        style.top = (1 - this.options.chain.offSet) * 100 + '%'
        let left = startPosition.offsetMiddlePCTX
        if (left < 0) left = 0
        if (left > 1) left = 1
        style.left = left * 100 + '%'
        let right = 1 - endPosition.offsetMiddlePCTX
        if (right < 0) right = 0
        if (right > 1) right = 1
        style.right = right * 100 + '%'

        if (Math.abs(right - left) === 1) style.display = 'none'
      } else {
        style.left = (1 - this.options.chain.offSet) * 100 + '%'
        let top = startPosition.offsetMiddlePCTY
        if (top < 0) top = 0
        if (top > 1) top = 1
        style.top = top * 100 + '%'
        let bottom = 1 - endPosition.offsetMiddlePCTY
        if (bottom < 0) bottom = 0
        if (bottom > 1) bottom = 1
        style.bottom = bottom * 100 + '%'
        if (Math.abs(bottom - top) === 1) style.display = 'none'
      }

      if (this.chain.removed) {
        this.scene.container.appendChild(this.chain.el)
        this.chain.removed = false
      }
    }
  }
}