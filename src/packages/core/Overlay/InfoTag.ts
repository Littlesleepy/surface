/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-02 11:09:23
 * @FilePath: \zxi-device\src\packages\core\Overlay\InfoTag.ts
 * @Description: 
 */
/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:53
 * @LastEditTime: 2022-07-08 14:54:31
 * @Description: 消息框
 * 
 */
import { IOffsetPosition } from '../Event'
import { Public } from '../Tools'
import { UseTheme } from '../../styles'

export interface IInfoTagOptions {
  width?: number
  height?: number
  backgroundColor?: string
  borderRadius?: string
  color?: string
  pointerEvents?: string
  zIndex?: string
  offX?: number
  offY?: number
  fixed?: {
    top?: number
    left?: number
  }
}

export class InfoTag {
  el: HTMLDivElement
  options: {
    width: number
    height: number
    backgroundColor: string
    borderRadius: string
    color: string
    pointerEvents: string
    zIndex: string
    offX: number
    offY: number
    fixed?: {
      top?: number
      left?: number
    }
  } = {
    width: 330,
    height: 94,
    backgroundColor: UseTheme.theme.var.tipBgColor,
    borderRadius: '10px',
    color: UseTheme.theme.var.tipColor,
    pointerEvents: 'auto',
    zIndex: '100',
    offX: 15,
    offY: 15
  }
  /**
   * @description: 挂载点
   */  
  readonly container: HTMLElement
  /**
   * @description: 默认信息容器
   */  
  defaultContent: HTMLUListElement
  /**
   * @description: 每一条信息P元素节点
   */  
  ulPLists = new Map<string, HTMLParagraphElement>()
  /**
   * @description: 每一条容纳信息的li元素节点
   */  
  ulLists = new Map<string, HTMLLIElement>()
  /**
   * @description: 默认每条信息头部颜色标记方案
   */  
  mockColors = [
    'rgb(0, 0, 0)',
    'rgb(255, 0, 0)',
    'rgb(0, 255, 64)',
    'rgb(0, 81, 255)',
    'rgb(0, 255, 213)',
    'rgb(234, 0, 255)',
    'rgb(255, 0, 85)',
    'rgb(83, 83, 83)',
    'rgb(109, 99, 240)'
  ]

  /**
   * @description: 改变信息挂载容器后的回调函数集合
   */
  afterMount: Map<string, () => void> = new Map()

  private useColor = new Map<string, string>()

  constructor (container: HTMLElement, options?: IInfoTagOptions) {
    this.container = container

    if (options) {
      Public.copyValueFromObject(this.options, options)
      
      this.options.fixed = options.fixed
    }

    this.el = document.createElement('div')
    const infoTagStyle = this.el.style

    infoTagStyle.width = `${this.options.width}px`
    infoTagStyle.height = `${this.options.height}px`
    infoTagStyle.color = this.options.color
    infoTagStyle.backgroundColor = this.options.backgroundColor
    infoTagStyle.boxSizing = 'border-box'
    infoTagStyle.borderRadius = this.options.borderRadius
    infoTagStyle.pointerEvents = this.options.pointerEvents
    infoTagStyle.zIndex = this.options.zIndex
    infoTagStyle.position = 'absolute'

    if (this.options.fixed !== undefined) {
      const fixed = this.options.fixed
      infoTagStyle.top = fixed.top + 'px'
      infoTagStyle.left = fixed.left + 'px'
    }

    this.defaultContent = document.createElement('ul')
    const ulStyle = this.defaultContent.style
    ulStyle.cssText = `
      width:100%;
      height:100%;
      display:flex;
      flex-direction:column;
      padding:8px;
      width:100%;
      box-sizing:border-box;
    `
    this.el.appendChild(this.defaultContent)
  }

  /**
   * @description: 设置tag位置
   * @param {IOffsetPosition} position 位置
   * @param {string} type 事件类型，Listen.TOUCH | Listen.MOUSE
   */  
  setPosition (position: IOffsetPosition, type: string) {
    if (this.options.fixed !== undefined) return

    const infoTagOptions = this.options
    const style = this.el.style
    const offsetX = position.offsetX
    const offsetY = position.offsetY

    const containerPosition = this.container.getBoundingClientRect()

    let resultX: number | undefined = offsetX + infoTagOptions.width + this.options.offX

    if (resultX + containerPosition.left > window.innerWidth) {
      resultX = offsetX - infoTagOptions.width - this.options.offX
      if (resultX < 0 && resultX + containerPosition.left < 0) {
        resultX = undefined
      }
    } else {
      resultX -= infoTagOptions.width
    }

    let resultY: number | undefined
    if (type === 'mouse') {
      resultY = offsetY + infoTagOptions.height + this.options.offY
      if (resultY + containerPosition.top > window.innerHeight) {
        resultY = offsetY - infoTagOptions.height - this.options.offY
        if (resultY < 0 && resultY + containerPosition.top < 0) {
          resultY = undefined
        }
      } else {
        resultY -= infoTagOptions.height
      }
    } else {
      resultY = offsetY - infoTagOptions.height - this.options.offY
      if (resultY < 0 && resultY + containerPosition.top < 0) {
        resultY = offsetY + this.options.offY
        if (resultY + containerPosition.top > window.innerHeight) {
          resultY = undefined
        }
      }
    }

    if (resultX === undefined) {
      resultX = this.container.clientWidth / 2 - infoTagOptions.width / 2
      resultY = offsetY - infoTagOptions.height - this.options.offY
    }

    if (resultY === undefined) {
      resultY = this.container.clientHeight / 2 - infoTagOptions.height / 2
    }

    const min_left = -(this.options.offX + infoTagOptions.width)
    if (resultX < min_left) resultX = min_left
    const max_left = this.options.offX + this.container.clientWidth
    if (resultX > max_left) resultX = max_left
    style.left = resultX / this.container.clientWidth * 100 + '%'

    const min_top = -(this.options.offY + infoTagOptions.height)
    if (resultY < min_top) resultY = min_top
    const max_top = this.options.offY + this.container.clientHeight
    if (resultY > max_top) resultY = max_top
    style.top = resultY / this.container.clientHeight * 100 + '%'
  }
  /**
   * @description: 更新配置，针对对UI有调整的需求
   * @param {IInfoTagOptions} options 配置
   * @return {*}
   */  
  setOptions (options: IInfoTagOptions) {
    Public.copyValueFromObject(this.options, options)

    const infoTagStyle = this.el.style
    const infoTagOptions = this.options
    infoTagStyle.width = `${infoTagOptions.width}px`
    infoTagStyle.height = `${infoTagOptions.height}px`
    infoTagStyle.backgroundColor = infoTagOptions.backgroundColor
    infoTagStyle.borderRadius = infoTagOptions.borderRadius
    infoTagStyle.color = infoTagOptions.color
    infoTagStyle.zIndex = infoTagOptions.zIndex


    if (this.options.fixed !== undefined) {
      const fixed = this.options.fixed
      infoTagStyle.top = fixed.top + 'px'
      infoTagStyle.left = fixed.left + 'px'
    }
  }
  /**
   * @description: 将一个信息容器挂载到信息显示器，（特别的：如果el为undefined，不会替换默认挂载点，但仍然会调用afterMount回调函数集）
   * @param {HTMLElement | undefined} el
   */  
  mountInfoTag (el?: HTMLElement) {
    if (el !== undefined) {
      this.el.replaceChildren()
      this.el.appendChild(el)
    }
    for (const [, fun] of this.afterMount) fun()
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
  remove() {
    if (this.container.contains(this.el)) this.container.removeChild(this.el)
  }
  /**
   * @description: 设置默认文字内容，如果InfoTag.el内默认挂载点被外部替换，则该方法失效
   * @param {Map} content 文字内容
   */  
  setContent (content: Map<string, { color?: string, info: string }>) {
    if (this.defaultContent === this.el.children[0]) {
      // 自动调整高度
      const height = content.size * 26 + 16
      this.el.style.height = `${height}px`
      this.options.height = height

      for (const [key, value] of content) {
        if (!this.ulLists.has(key)) {
          const li = document.createElement('li')
          li.style.cssText = `
            padding: 3px 0;
            font-size: 20px;
            height: 26px;
            box-sizing: border-box;
            display: flex;
          `
          const span = document.createElement('span')
          span.style.cssText = `
            width: 13px;
            height: 13px;
            border-radius: 14px;
            margin-right: 5px;
            background-color: rgb(0, 0, 0)';
          `
          if (value.color) {
            span.style.backgroundColor = value.color
          } else {
            let color = this.useColor.get(key)
            
            if (color === undefined) color = this.mockColors[this.useColor.size]
            if (color === undefined) color = 'rgb(0, 0, 0)'
            
            this.useColor.set(key, color)
            if (color) span.style.backgroundColor = color
          }

          const p = document.createElement('p')
          p.style.cssText = `
            margin: 0;
            flex: 1;
            width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `
          p.textContent = value.info

          li.appendChild(span)
          li.appendChild(p)

          this.defaultContent.appendChild(li)

          this.ulPLists.set(key, p)
          this.ulLists.set(key, li)
        } else {
          const p = this.ulPLists.get(key)!
          p.textContent = value.info
        }
      }
      // 清除元素文字内容
      const deletes = new Set<string>()
      for (const [key] of this.ulLists) {
        if (!content.has(key)) {
          deletes.add(key)
        }
      }

      for (const key of deletes) {
        this.defaultContent.removeChild(this.ulLists.get(key)!)
        this.ulLists.delete(key)
        this.ulPLists.delete(key)
      }
    }
  }
}