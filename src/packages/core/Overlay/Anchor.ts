import { Scene, Public, Fence, ITagOptions, FencesType, Tag } from '..'
import { UseTheme } from '../../styles'

/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-02 14:34:52
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-20 11:55:54
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\core\Overlay\Anchor.ts
 * @Description: 锚
 */
 export interface IAnchorOptions {
  type?: string
  anchor?: {
    backgroundColor?: string
    width?: number
  }
  anchorPoint?: {
    radius?: number
    backgroundColor?: string
  }
}

export interface IAnchor {
  index: number
  instance: Tag,
  removed: boolean,
  points: Map<string, { point: HTMLSpanElement }>
}

export class Anchor {

  readonly scene: Scene

  readonly container: HTMLElement

  readonly manager = new Map<number, IAnchor>()

  readonly options = {
    type: Fence.VERTICAL,
    anchor: {
      backgroundColor: UseTheme.theme.var.tagBgColor,
      width: 1
    },
    anchorPoint: {
      radius: 6,
      backgroundColor: UseTheme.theme.var.tagBgColor
    }
  }

  constructor (scene: Scene, options?: IAnchorOptions) {
    if (scene.fence === undefined) {
      throw new Error('Anchor初始化要求scene拥有fence成员')
    }

    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.scene = scene

    this.container = scene.container

    scene.disposeManager.add(() => { this.dispose() })

    this.scene.fence!.afterZoomOrTrans.add(() => {
      for (const [, anchor] of this.manager) {
        anchor.instance.setPositionByDataIndex(this.scene.fence!)
      }
    })
  }
  /** 
   * @description: 批量添加锚
   * @param {Array} anchors 添加锚的索引集合
   * @return {*} 返回新添加的锚
   */  
  add (anchors: Map<number, { backgroundColor?: string, width?: number } | undefined>) {
    const adds = new Map<number, IAnchor>()
    const fence = this.scene.fence
    if (fence && fence.practicalCount > 0) {
      anchors.forEach((anchor, index) => {
        if (!this.manager.has(index)) { // 同一位置只能添加一个锚
          adds.set(index, this.createAnchor(index, { backgroundColor: anchor?.backgroundColor, width: anchor?.width }))
        }
      })
    } else {
      console.warn('fence初始化前使用anchor不会生效')
    }

    return adds
  }
  /** 
   * @description: 批量移除锚
   * @param {Array} indexs 移除锚的索引数组
   * @return {*} 返回被移除的锚
   */  
  remove (indexs: Array<number>) {
    const deletes = new Map<number, IAnchor>()
    indexs.forEach(index => {
      const anchor = this.manager.get(index)
      if (anchor) {
        anchor.instance.remove()
        anchor.removed = true
        this.scene.disposeManager.add(() => { anchor.instance.dispose() })

        this.manager.delete(index)

        deletes.set(index, anchor)
      }
    })

    return deletes
  }
  /** 
   * @description: 清空所有锚点
   * @return {*} 返回被移除的锚
   */  
  clear () {
    const deletes = new Map<number, IAnchor>()
    for (const [index, anchor] of this.manager) {
      anchor.instance.remove()
      anchor.removed = true
      deletes.set(index, anchor)
    }

    this.manager.clear()

    return deletes
  }
  /** 
   * @description: 释放资源
   * @return {*}
   */  
  dispose () {
    for (const [, anchor] of this.manager) {
      anchor.instance.dispose()
    }
  }

  /** 
   * @description: 设置数据跟踪标记
   * @param {Map} sources 数据锚点Map<number: 锚的索引, Map<string: 锚上追踪点的key, options>>
   * @return {*}
   */  
  setPoints (sources: Map<number, Map<string, { value: number, color?: string, radius?: number }>>) {
    for (const [index, options] of sources) {
      const tag = this.manager.get(index)
      if (tag) {
        const points = tag.points
        const container = tag.instance.el
        // 对于一个锚点，可能有多个追踪点
        for (const [key, option] of options) {
          // 创建
          let p: HTMLSpanElement
          if (!points.has(key)) {
            p = this.createPoint(option.color, option.radius)
            container.appendChild(p)
            // 加入
            points.set(key, { point: p })
          } else {
            p = points.get(key)!.point
          }
          // 设置样式
          const _radius = option.radius ? option.radius : this.options.anchorPoint.radius
          let off: number
          const style = p.style
          if (this.options.type === Fence.VERTICAL) {
            off = (option.value - _radius / this.container.clientHeight) * 100
            style.top = off + '%'
          } else {
            off = (option.value - _radius / this.container.clientWidth) * 100
            style.left = off + '%'
          }

          if (off > 100 || off < 0) {
            style.opacity = '0'
          } else {
            style.opacity = '1'
          }
          // 删除追踪点
          const deletes: Set<string> = new Set()
          for (const [key] of points) {
            if (!options.has(key)) {
              container.removeChild(p)
              deletes.add(key)
            }
          }

          for (const key of deletes) {
            points.delete(key)
          }
        }
      }
    }
  }

  /** 
   * @description: 创建锚
   * @param {number} index 锚的fence索引
   * @param {} options 锚的可选配置
   * @return {*} 返回创建的锚
   */  
  private createAnchor (
    index: number,
    options?: {
      backgroundColor?: string,
      width?: number
  }) {
    const tagOptions: ITagOptions = {
      backgroundColor: this.options.anchor.backgroundColor,
      width: this.options.anchor.width,
      direction: this.options.type
    }

    if (options) {
      if (options.backgroundColor) tagOptions.backgroundColor = options.backgroundColor
      if (options.width) tagOptions.width = options.width
    }

    const instance = new Tag(this.container, tagOptions)
    instance.setPositionByDataIndex(this.scene.fence!, index)

    instance.append()
    const result = { index, instance, removed: false, points: new Map() }
    this.manager.set(index, result)

    return result
  }
  /** 
   * @description: 创建锚上的数据追踪点
   * @param {string} color 点颜色
   * @param {number} radius 点半径
   * @return {*}
   */    
  private createPoint (color?: string, radius?: number) {
    const span = document.createElement('span')
    span.style.position = 'absolute'
    span.style.backgroundColor = color ? color : this.options.anchorPoint.backgroundColor
    const _radius = radius ? radius : this.options.anchorPoint.radius
    const width =  _radius * 2 + 'px'
    span.style.borderRadius = width
    span.style.width = width
    span.style.height = width

    const off = this.options.anchor.width / 2 - this.options.anchorPoint.radius + 'px' 

    if (this.options.type === Fence.VERTICAL) {
      span.style.left = off
    } else {
      span.style.top = off
    }
    
    return span
  }
}