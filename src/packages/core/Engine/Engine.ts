/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-10 16:22:28
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\core\Engine\Engine.ts
 * @Description: 
 */

import { Listen } from '../Event'

export class Engine {
  static readonly WEBGL = 'webgl'

  static readonly CANVAS = 'canvas'

  container: HTMLDivElement

  canvas: HTMLCanvasElement

  constructor (container: HTMLDivElement) {

    this.container = container
    this.canvas = document.createElement('canvas')
    if (container.style.position !== 'absolute') {
      container.style.position = 'relative'
    }
    container.style.boxSizing = 'border-box'

    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.canvas.style.position = 'absolute'

    const childs = this.container.childNodes
    if (childs.length > 0) {
      container.insertBefore(this.canvas, childs[0])
    } else {
      container.insertBefore(this.canvas, null)
    }

    const children = this.container.children
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].addEventListener(Listen.CONTEXTMENU, (e) => {
        e.preventDefault()
      })
    }
  }
}