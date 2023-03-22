/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-01 09:31:18
 * @FilePath: \zxi-deviced:\Zzy\project\mcharts\packages\core\Render\WebGl\WebGl.ts
 * @Description: 
 */

import { Public } from '../../Tools'

export class WebGl {
  readonly gl!: WebGLRenderingContext

  readonly canvas!: HTMLCanvasElement

  readonly options: WebGLContextAttributes & {
    backgroundColor: Array<number>
  } = {
    backgroundColor: [0.157, 0.157, 0.157, 1],
    antialias: true,
    preserveDrawingBuffer: true
  }
  
  constructor (canvas: HTMLCanvasElement, options?: WebGLContextAttributes & {
    backgroundColor?: Array<number>
  }) {
    if (!canvas) {
      console.warn('HTMLCanvasElement丢失')
      return this
    }

    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.canvas = canvas
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const gl = canvas.getContext('webgl', this.options)
    if (gl === null) {
      throw new Error('无法初始化WebGL，你的浏览器、操作系统或硬件等可能不支持WebGL。')
    }

    // 上下文不够用强制刷新
    this.canvas.addEventListener('webglcontextlost', () => {
      location.reload()
    }, false)

    this.gl = gl
    this.gl.clearDepth(0)
    this.gl.enable(this.gl.SAMPLE_ALPHA_TO_COVERAGE)
  }
  /**
   * @description: 清空画布
   * @param {*} color 清空后的颜色
   * @return {*}
   */  
  clearScreen (color?: Array<number>) {
    const c = color ?? this.options.backgroundColor
    this.gl.clearColor(c[0], c[1], c[2], c[3] ?? 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }
  /**
   * @description: 画布刷新
   * @return {*}
   */  
  contextRefresh () {
    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    this.gl.viewport(0, 0, canvas.width, canvas.height)
  }
}