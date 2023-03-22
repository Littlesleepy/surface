/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-06 13:49:15
 * @FilePath: \zxi-device\src\packages\core\Render\Canvas\Canvas.ts
 * @Description: 
 */
import { Public } from '../../Tools'

/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:53
 * @LastEditTime: 2022-07-19 09:47:09
 * @Description: 
 * 
 */
export class Canvas {
  readonly canvas!: HTMLCanvasElement
  /**
   * @description: 绘制上下文
   */  
  readonly ctx!: CanvasRenderingContext2D
  /**
   * @description: 渲染资源
   */  
  shareRender: {
    source: HTMLCanvasElement
    color: string
  } | undefined

  private ratio!: number

  readonly options: CanvasRenderingContext2DSettings & {
    backgroundColor: string
  } = {
    backgroundColor: 'rgba(40, 40, 40, 1)',
    alpha: true
  }

  constructor (canvas: HTMLCanvasElement, options?: CanvasRenderingContext2DSettings & {
    backgroundColor?: string
  }) {
    if (!canvas) {
      console.warn('HTMLCanvasElement丢失')
      return this
    }

    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.canvas = canvas
    this.ctx = canvas.getContext('2d', this.options)!
    //@ts-ignore
    const backingStore = this.ctx.backingStorePixelRatio || this.ctx.webkitBackingStorePixelRatio
      //@ts-ignore
      || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio
      //@ts-ignore
      || this.ctx.oBackingStorePixelRatio || 1

    this.ratio = (window.devicePixelRatio || 1) / backingStore
    this.contextRefresh()
  }
  /**
   * @description: 上下文刷新
   */
  contextRefresh () {
    this.canvas.width = this.canvas.clientWidth * this.ratio
    this.canvas.height = this.canvas.clientHeight * this.ratio
    this.ctx.scale(this.ratio, this.ratio)

    if (this.shareRender) this.renderByImages(this.shareRender.source, this.shareRender.color)
  }
  /**
   * @description: 清屏
   * @param {*} color 背景颜色，默认options.backgroundColor
   */  
  clearScreen (color?: string) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = color ?? this.options.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
  /**
   * @description: 将其他场景渲染结果映射到自身
   * @param {HTMLCanvasElement} source 图像资源
   * @param {string} color 清屏后的背景颜色
   * @return {*}
   */   
  renderByImages (source: HTMLCanvasElement, color?: string) {
    const c = color ?? this.options.backgroundColor
     if (this.shareRender === undefined) {
      this.shareRender = { source, color: c }
     } else {
      this.shareRender.source = source
      this.shareRender.color = c
     }
    this.clearScreen(color)
    this.ctx.drawImage(source, 0, 0, this.canvas.clientWidth, this.canvas.clientHeight)
  }
}