/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-05 11:21:51
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\Overlay\Region.ts
 * @Description: 
 */

import { IOffsetPosition } from '../Event'
import { Fence, FencesType } from '../Fence'
import { Public } from '../Tools'
import { ITagOptions, Tag } from '../ViewHCI/Tag'
import { IPositionResult } from '../ViewHCI/types'

interface ITag  {
  name: string
  instance: Tag
  removed: boolean
}

export type IRegionOptions =  {
  transverseTag?: {
    backgroundColor?: string
    width?: number
  }
  verticalTag?: {
    backgroundColor?: string
    width?: number
  }
  center?: {
    backgroundColor?: string,
    border?: {
      width?: number,
      style?: string,
      color?: string
    }
  }
  showTags?: Set<string>
}

export class Region  {
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
   * @description: 框选结果
   */  
  readonly positionResult = new Map<string, IPositionResult>()
  /**
   * @description: 外层容器
   */  
  readonly container: HTMLElement
  /**
   * @description: 水平向顶部横线
   */  
  readonly top: ITag
  /**
   * @description: 水平向底部横线
   */
  readonly bottom: ITag
  /**
   * @description: 竖向左边横线
   */
  readonly left: ITag
  /**
   * @description: 竖向右边横线
   */
  readonly right: ITag
  /**
   * @description: 框选框
   */
  readonly center: {
    name: string,
    el: HTMLDivElement
    removed: boolean
  }
  /**
   * @description: 配置
   */
  readonly options: {
    transverseTag: {
      backgroundColor: string
      width: number
    }
    verticalTag: {
      backgroundColor: string
      width: number
    }
    center: {
      backgroundColor: string
      border: {
        width: number
        style: string
        color: string
      }
    }
    showTags: Set<string>
  } = {
    transverseTag: {
      backgroundColor: 'rgb(64, 158, 255)',
      width: 1
    },
    verticalTag: {
      backgroundColor: 'rgb(64, 158, 255)',
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
  }

  private tagManager: Map<string, {
    name: string
    instance: Tag
    removed: boolean
  }>

  constructor (container: HTMLElement, options?: IRegionOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.container = container

    const transverseTagOptions: ITagOptions = {
      direction: Fence.TRANSVERSE,
      width: this.options.transverseTag.width,
      backgroundColor: this.options.transverseTag.backgroundColor
    }
    this.top = {
      name: Region.TOP,
      instance: new Tag(this.container, transverseTagOptions),
      removed: true
    }

    this.bottom = {
      name: Region.BOTTOM,
      instance: new Tag(this.container, transverseTagOptions),
      removed: true
    }

    this.left = {
      name: Region.LEFT,
      instance: new Tag(this.container, this.options.verticalTag),
      removed: true
    }

    this.right = {
      name: Region.RIGHT,
      instance: new Tag(this.container, this.options.verticalTag),
      removed: true
    }

    this.center = {
      name: Region.CENTER,
      el: document.createElement('div'),
      removed: true
    }
    this.setRectangleTagStyle()

    this.tagManager = new Map([
      [
        Region.TOP,
        this.top
      ],
      [
        Region.BOTTOM,
        this.bottom
      ],
      [
        Region.LEFT,
        this.left
      ],
      [
        Region.RIGHT,
        this.right
      ]
    ])
  }

  /**
   * @description: 更新配置，针对对UI有调整的需求
   * @param {IRegionOptions} options 配置
   * @return {*}
   */  
  setOptions (options: IRegionOptions) {
    Public.copyValueFromObject(this.options, options)

    if (this.options.showTags.has(Region.LEFT)) this.left.instance.setOptions(this.options.verticalTag)
    if (this.options.showTags.has(Region.RIGHT)) this.right.instance.setOptions(this.options.verticalTag)

    if (this.options.showTags.has(Region.TOP)) this.top.instance.setOptions(this.options.transverseTag)
    if (this.options.showTags.has(Region.BOTTOM)) this.bottom.instance.setOptions(this.options.transverseTag)

    if (this.options.showTags.has(Region.CENTER)) this.setRectangleTagStyle()
  }
  /**
   * @description: 显示框选
   * @param {boolean} show 真显示，假隐藏
   */  
  showChildren (show = true) {
    if (show) {
      for (const [, tag] of this.tagManager) {
        if (this.options.showTags.has(tag.name) && tag.removed) {
          tag.instance.append()
          tag.removed = false
        }
      }

      if (this.options.showTags.has(this.center.name) && this.center.removed) {
        this.container.appendChild(this.center.el)
        this.center.removed = false
      }
    } else {
      for (const [, tag] of this.tagManager) {
        if (!tag.removed) {
          tag.instance.remove()
          tag.removed = true
        }
      }

      if (!this.center.removed) {
        this.container.removeChild(this.center.el)
        this.center.removed = true
      }
    }
  }
  /**
   * @description: 触发框选
   * @param {IOffsetPosition} position 触发位置
   * @param {FencesType} fence fence
   * @return {Map<string, IPositionResult>} 返回一个上下左右边框位置的管理器
   */
  trigger (position: IOffsetPosition, fence?: FencesType) {
    const r1 = this.bottom.instance.setPosition(position, fence)
    this.positionResult.set(this.bottom.name, r1)
    const r2 = this.right.instance.setPosition(position, fence)
    this.positionResult.set(this.right.name, r2)

    this.setRectangleTagStyleAfterSetTag()

    return this.positionResult
  }
  /**
   * @description: 激活框选
   * @param {IOffsetPosition} position 激活的位置
   * @param {FencesType} fence fence
   * @return {Map<string, IPositionResult>} 返回一个上下左右边框位置的管理器
   */  
  active (position: IOffsetPosition, fence?: FencesType) {
    for (const [, tag] of this.tagManager) {
      const r = tag.instance.setPosition(position, fence)

      this.positionResult.set(tag.name, r)
    }

    this.center.el.style.opacity = '0'

    return this.positionResult
  }
  /**
   * @description: 通过fenceIndex设置框选的位置，如果Map中未指定fenceIndex，则使用tag自己的fenceIndex
   * @param {FencesType} fence fence
   * @param {Map} tags 要设置位置的tag Map集
   * @return {Map<string, IPositionResult>} 返回一个上下左右边框位置的管理器
   */  
  setStyleByFenceIndex (fence: FencesType, tags: Map<string, number | undefined>) {
    for (const [name, num] of tags) {
      const tag = this.tagManager.get(name)
      if (tag) {
        const r = tag.instance.setPositionByFenceIndex(fence, num)

        if (r) this.positionResult.set(name, r)
      }
    }

    this.setRectangleTagStyleAfterSetTag()

    return this.positionResult
  }

  /**
   * @description: 通过dataIndex设置框选的位置，如果Map中未指定dataIndex，则使用tag自己的dataIndex
   * @param {FencesType} fence fence
   * @param {Map} tags 要设置位置的tag Map集
   * @return {Map<string, IPositionResult>} 返回一个上下左右边框位置的管理器
   */  
  setStyleByDataIndex (fence: FencesType, tags: Map<string, number | undefined>) {
    for (const [name, num] of tags) {
      const tag = this.tagManager.get(name)
      if (tag) {
        const r = tag.instance.setPositionByDataIndex(fence, num)

        if (r) this.positionResult.set(name, r)
      }
    }

    this.setRectangleTagStyleAfterSetTag()

    return this.positionResult
  }

  /**
   * @description: 获取左小右大，上小下大的框选的边界信息
   * @return {Map<string, Tag>}
   */  
  getRgionValue () {
    const result = new Map<string, Tag>()
    if (this.positionResult.size === 4) {
      if (this.left.instance.positionResult.offsetX <= this.right.instance.positionResult.offsetX) {
        result.set(Region.LEFT, this.left.instance)
        result.set(Region.RIGHT, this.right.instance)
      } else {
        result.set(Region.LEFT, this.right.instance)
        result.set(Region.RIGHT, this.left.instance)
      }

      if (this.top.instance.positionResult.offsetY <= this.bottom.instance.positionResult.offsetY) {
        result.set(Region.TOP, this.top.instance)
        result.set(Region.BOTTOM, this.bottom.instance)
      } else {
        result.set(Region.TOP, this.right.instance)
        result.set(Region.BOTTOM, this.top.instance)
      }
    }

    return result
  }

  /** 
   * @description: 释放资源
   * @return {*}
   */  
  dispose () {
    for (const [, tag] of this.tagManager) {
      tag.instance.dispose()
    }
  }

  private setRectangleTagStyle () {
    const style = this.center.el.style
    const options = this.options.center
    style.backgroundColor = options.backgroundColor
    style.borderWidth = options.border.width + 'px'
    style.borderColor = options.border.color
    style.borderStyle = options.border.style
    style.position = 'absolute'
    style.boxSizing = 'border-box'
  }
  /**
   * @description: 四边tag移动后设置中间框的样式
   */  
  private setRectangleTagStyleAfterSetTag () {
    let left0 = this.left.instance.positionResult!.offsetX
    let right0 = this.right.instance.positionResult!.offsetX
    let top0 = this.top.instance.positionResult!.offsetY
    let bottom0 = this.bottom.instance.positionResult!.offsetY

    const rectangleStyle = this.center.el.style
    rectangleStyle.opacity = '1'
    rectangleStyle.borderWidth = this.options.center.border.width + 'px'

    let left = Math.min(left0, right0)
    let right = Math.max(left0, right0)
    let top = Math.min(top0, bottom0)
    let bottom = Math.max(top0, bottom0)

    const borderWidth = '0px'

    if (left < 0) {
      left = 0
      rectangleStyle.borderLeftWidth = borderWidth
    }

    if (right > this.container.clientWidth) {
      right = this.container.clientWidth
      rectangleStyle.borderRightWidth = borderWidth
    }

    if (top < 0) {
      top = 0
      rectangleStyle.borderTopWidth = borderWidth
    }

    if (bottom > this.container.clientHeight) {
      bottom = this.container.clientHeight
      rectangleStyle.borderBottomWidth = borderWidth
    }

    if (left > this.container.clientWidth || right < 0 || bottom < 0 || top > this.container.clientHeight) {
      rectangleStyle.opacity = '0'
    }

    rectangleStyle.width = `${(right - left + this.options.verticalTag.width) / this.container.clientWidth * 100}%`
    rectangleStyle.height = `${(bottom - top + this.options.transverseTag.width) / this.container.clientHeight * 100}%`
    
    if (right0 > left0) {
      if (left0 < 0) left0 = 0
      rectangleStyle.left = left0 / this.container.clientWidth * 100 + '%'
    } else {
      if (right0 < 0) right0 = 0
      rectangleStyle.left = right0 / this.container.clientWidth * 100 + '%'
    }

    if (bottom0 > top0) {
      if (top0 < 0) top0 = 0
      rectangleStyle.top = top0 / this.container.clientHeight * 100 + '%'
    } else {
      if (bottom0 < 0) bottom0 = 0
      rectangleStyle.top = bottom0 / this.container.clientHeight * 100 + '%'
    }
  }
}