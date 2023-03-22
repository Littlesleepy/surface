import { TypedArray, ITextureOptions } from '../Render/WebGl/Shader'
import { Scene } from '../Scene'
import { Public } from '../Tools/Public'
import { WebGl } from '../Render'

export type TypeIndexData = Uint16Array | Uint8Array

export interface IMeshDataBindOptions {
  /**
   * @description: 是否只需绑定一次
   */  
  once: boolean
  /**
   * @description: gl.bufferData相关配置
   */  
  bufferData: {
    /**
     * @description: 指定数据存储区的使用方法
     */    
    useage: string
  },
  /**
   * @description: gl.vertexAttribPointer相关配置
   */
  vertexAttribPointer: {
    /**
     * @description: 当转换为浮点数时是否应该将整数数值归一化到特定的范围。
     */    
    normalized: boolean
    /**
     * @description: 以字节为单位指定连续顶点属性开始之间的偏移量
     */    
    stride: number
    /**
     * @description: 指定顶点属性数组中第一部分的字节偏移量。必须是类型的字节长度的倍数。
     */    
    offset: number
  }
}

export interface IMeshOptions {
  /**
   * @description: 依顶点坐标绘制|顶点索引绘制
   */
  drawArrayOrElements: string
  /**
   * @description: 依顶点坐标绘制gl.drawArrays相关配置
   */  
  drawArrays: {
    /**
     * @description: 指定绘制图元的方式
     */    
    mode: string,
    /**
     * @description: 指定绘制需要使用到多少个点。
     */    
    count: number,
    /**
     * @description: 指定从哪个点开始绘制。
     */    
    first: number
  }
  /**
   * @description: 依顶点索引绘制gl.drawElements相关配置
   */ 
  drawElements: {
    /**
     * @description: 指定绘制图元的方式
     */
    mode: string
    /**
     * @description: 指定要渲染的元素数量。
     */ 
    count: number
    /**
     * @description: 指定元素数组缓冲区中的偏移量。必须是给定类型大小的有效倍数。
     */    
    offset: number
  }
  /**
   * @description: 顶点索引
   */
  dataBindIndex: {
    /**
     * @description: 顶点索引数据
     */    
    indexData: TypeIndexData
    /**
     * @description: gl.bufferData指定数据存储区的使用方法
     */    
    useage: number
  }
}
/**
 * @description: 网格配置
 */
export interface IMeshInputOptions {
  id?: string
  /**
   * @description: 依顶点坐标绘制|顶点索引绘制
   */  
  drawArrayOrElements?: string
  /**
   * @description: 依顶点坐标绘制gl.drawArrays相关配置
   */  
  drawArrays?: {
    /**
     * @description: 指定绘制图元的方式
     */  
    mode: string,
    /**
     * @description: 指定绘制需要使用到多少个点。
     */ 
    count: number,
    /**
     * @description: 指定从哪个点开始绘制。
     */ 
    first?: number
  }
  /**
   * @description: 依顶点索引绘制gl.drawElements相关配置
   */ 
  drawElements?: {
    /**
     * @description: 指定绘制图元的方式
     */
    mode: string
    /**
     * @description: 指定要渲染的元素数量。
     */ 
    count: number
    /**
     * @description: 指定元素数组缓冲区中的偏移量。必须是给定类型大小的有效倍数。
     */
    offset?: number
  }
  /**
   * @description: 顶点索引
   */  
  dataBindIndex?: {
    /**
     * @description: 顶点索引数据
     */
    indexData: TypeIndexData
    /**
     * @description: gl.bufferData指定数据存储区的使用方法
     */
    useage?: string
  }
}

export class Mesh {
  /**
   * @description: 绘制一系列点
   */  
  static readonly POINTS = 'POINTS'
  /**
   * @description: 绘制一个线条。即，绘制一系列线段，上一点连接下一点。
   */ 
  static readonly LINE_STRIP = 'LINE_STRIP'
  /**
   * @description: 绘制一个线圈。即，绘制一系列线段，上一点连接下一点，并且最后一点与第一个点相连。
   */ 
  static readonly LINE_LOOP = 'LINE_LOOP'
  /**
   * @description: 绘制一系列单独线段。每两个点作为端点，线段之间不连接。
   */ 
  static readonly LINES = 'LINES'
  /**
   * @description: 绘制一个三角带
   */ 
  static readonly TRIANGLE_STRIP = 'TRIANGLE_STRIP'
  /**
   * @description: 绘制一个三角扇
   */ 
  static readonly TRIANGLE_FAN = 'TRIANGLE_FAN'
  /**
   * @description: 绘制一系列三角形。每三个点作为顶点
   */ 
  static readonly TRIANGLES = 'TRIANGLES'
  /**
   * @description: 顶点坐标绘制方式
   */  
   static readonly DRAWBYARRAY = 'DRAWBYARRAY'
  /**
   * @description: 顶点坐标索引绘制方式
   */
  static readonly DRAWBYINDEX = 'DRAWBYINDEX'
  /**
   * @description: 抛弃红色、绿色和蓝色组件并读取alpha组件。
   */
  static readonly ALPHA = 'ALPHA'
  /**
   * @description: 抛弃alpha组件，读取红色、绿色和蓝色组件。
   */
  static readonly RGB = 'RGB'
  /**
   * @description: 从颜色缓冲区读取红色、绿色、蓝色和alpha组件。
   */
  static readonly RGBA = 'RGBA'
  /**
   * @description: E每个颜色组件是一个亮度组件，alpha值为1.0。
   */
  static readonly LUMINANCE = 'LUMINANCE'
  /**
   * @description: 每个组件都是亮度/alpha组件。
   */
  static readonly LUMINANCE_ALPHA = 'LUMINANCE_ALPHA'
  /**
   * @description: gl.RGBA每个通道8位
   */
  static readonly UNSIGNED_BYTE = 'UNSIGNED_BYTE'
  /**
   * @description: 5 bits红, 6 bits绿, 5 bits蓝
   */
  static readonly UNSIGNED_SHORT_5_6_5 = 'UNSIGNED_SHORT_5_6_5'
  /**
   * @description: 4 bits红, 4 bits绿, 4 bits蓝, 4 alpha bits.
   */
  static readonly UNSIGNED_SHORT_4_4_4_4 = 'UNSIGNED_SHORT_4_4_4_4'
  /**
   * @description: 5 bits红, 5 bits绿, 5 bits蓝, 1 alpha bit.
   */
  static readonly UNSIGNED_SHORT_5_5_5_1 = 'UNSIGNED_SHORT_5_5_5_1'

  renderCtx: WebGl

  scene: Scene

  gl: WebGLRenderingContext

  id: string
  /**
   * @description: 若干数据绑定GLSL ES集合
   */  
  data: Map<string, number | Array<number> | TypedArray | ITextureOptions>
  /**
   * @description: 依顶点索引绘制时指定元素数组缓冲区中的值的类型
   */  
  drawElementsType: number | undefined
  /**
   * @description: 依顶点索引绘制时指定元素数组每个元素所占用的字节数
   */
  drawElementsPerByteLength: number | undefined
  /**
   * @description: 依顶点索引绘制时顶点索引
   */
  indexBuffer: WebGLBuffer | undefined

  options: IMeshOptions
  /**
   * @description: attribute类型数据绑定
   */  
  attriBindOptions: Map<string, IMeshDataBindOptions>
  /**
   * @description: 哪些变量只需绑定一次
   */  
  onceBindTags: Set<string>

  constructor (scene: Scene, options?: IMeshInputOptions) {
    this.scene = scene
    this.renderCtx = scene.renderCtx as WebGl
    this.gl = this.renderCtx.gl
    this.data = new Map()
    this.attriBindOptions = new Map()
    this.onceBindTags = new Set()

    this.options = {
      drawArrayOrElements: Mesh.DRAWBYARRAY,
      drawArrays: {
        mode: Mesh.LINE_STRIP,
        count: 0,
        first: 0
      },
      drawElements: {
        mode: Mesh.LINE_STRIP,
        count: 0,
        offset: 0
      },
      dataBindIndex: {
        indexData: new Uint8Array(),
        useage: this.gl.STATIC_DRAW
      }
    }
    
    if (options) {
      this.id = options.id ?? Public.guid()

      Public.copyValueFromObject(this.options, options)

      if (options.dataBindIndex) {
        const indexDataType = Object.prototype.toString.apply(options.dataBindIndex.indexData)
    
        let drawType: number | undefined = undefined
        this.drawElementsPerByteLength = options.dataBindIndex.indexData.BYTES_PER_ELEMENT
        if (indexDataType.includes('Uint16Array')) drawType = this.gl.UNSIGNED_SHORT
        if (indexDataType.includes('Uint8Array')) drawType = this.gl.UNSIGNED_BYTE
        if (drawType === undefined) throw new Error('dataBindIndex绑定数据类型必须是Uint16Array|Uint8Array')
        this.drawElementsType = drawType

        if (this.indexBuffer === undefined) {
          const buffer = this.gl.createBuffer()
          if (buffer === null) throw new Error(`创建${this.id}顶点索引缓冲区失败`)
          this.indexBuffer = buffer
        }

        if (options.dataBindIndex.useage) {
          this.options.dataBindIndex.useage = this.gl[this.options.dataBindIndex.useage]
        } 
      }
    } else {
      this.id = Public.guid()
    }
  }
  /**
   * @description: 网格GLSL ES各个变量数据绑定
   * @param {string} variableName GLSL ES变量名称
   * @param {number} data 要绑定的数据
   * @return {*}
   */  
  setData (variableName: string, data: number | Array<number> | TypedArray | ITextureOptions) {
    this.data.set(variableName, data)

    return this
  }
  /**
   * @description: 设置GLSL ES变量绑定配置
   * @return {*}
   */   
  setAttriBindOptions (variableName: string, options?: {
    /**
     * @description: 是否只需绑定一次
     */ 
    once?: boolean
    /**
     * @description: gl.bufferData相关配置
     */ 
    bufferData?: {
      /**
       * @description: 指定数据存储区的使用方法
       */ 
      useage: string
    },
    /**
     * @description: gl.vertexAttribPointer相关配置
     */
    vertexAttribPointer?: {
      /**
       * @description: 当转换为浮点数时是否应该将整数数值归一化到特定的范围。
       */
      normalized?: boolean
      /**
       * @description: 以字节为单位指定连续顶点属性开始之间的偏移量
       */
      stride?: number
      /**
       * @description: 指定顶点属性数组中第一部分的字节偏移量。必须是类型的字节长度的倍数。
       */ 
      offset?: number
    }
  }) {
    const _options: IMeshDataBindOptions = {
      once: false,
      bufferData: {
        useage: Scene.STATIC_DRAW
      },
      vertexAttribPointer: {
        normalized: false,
        stride: 0,
        offset: 0
      }
    }

    if (options) {
      Public.copyValueFromObject(_options, options)
    }

    this.attriBindOptions.set(variableName, _options)
  }
  /**
   * @description: 获取GLSL ES变量绑定配置
   * @param {string} variableName GLSL ES变量名称
   * @return {*}
   */  
  getAttriBindOptions (variableName: string) {
    return this.attriBindOptions.get(variableName)
  }
  /**
   * @description: 标记GLSL ES变量只需绑定一次
   * @param {string} variableName GLSL ES变量名称
   * @return {*}
   */  
  tagForOnceBind (variableName: string) {
    this.onceBindTags.add(variableName)
  }
  /**
   * @description: 检查GLSL ES变量是否只需绑定一次
   * @param {string} variableName
   * @return {*}
   */  
  hasOnceBind (variableName: string) {
    return this.onceBindTags.has(variableName)
  }
  /**
   * @description: 移除GLSL ES变量绑定
   * @param {string} variableName GLSL ES变量名称
   * @return {*}
   */  
  remove (variableName: string) {
    return this.data.delete(variableName)
  }
  /**
   * @description: 刷新，清空所有绑定
   */  
  refresh () {
    this.data.clear()
    this.attriBindOptions.clear()
    this.onceBindTags.clear()
  }
}