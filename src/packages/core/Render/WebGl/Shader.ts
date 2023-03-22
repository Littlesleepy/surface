import { WebGl } from './WebGl'
import { Scene } from '../../Scene'
import { GLSLES } from './GLSLES'
import { IMeshDataBindOptions } from '../../Mesh'
export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array

export interface ITextureOptions {
  /**
   * @description: 使用的纹理单元
   */  
  textureUnitIndex?: number
  /**
   * @description: 指定使用的纹理对象
   */  
  texImage2D: {
    /**
     * @description: 指定纹理中的颜色组件
     */    
    internalformat: string
    /**
     * @description: 纹理宽度
     */    
    width?: number
    /**
     * @description: 纹理高度
     */
    height?: number
    /**
     * @description: 像素源
     */    
    pixels: ArrayBufferView | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap
  }
}

export interface IAttributeResolver {
  /**
   * @description: GLSL ES变量类型
   */  
  variableType: string
  /**
   * @description: GLSL ES变量名称
   */
  variableName: string
  /**
   * @description: 一个GLSL ES变量需要传入的数据个数
   */
  oneGroupCount: number
  /**
   * @description: attribute或者uniform类型变量
   */  
  attriOrUni: string
  /**
   * @description: 有关GLSL ES变量的数据绑定位置
   */  
  aboutLocation: {
    /**
     * @description: GLSL ES变量的数据绑定位置
     */
    location: number | undefined
    /**
     * @description: 获取绑定GLSL ES变量数据绑定位置（location）的的方法
     */    
    method: (param: WebGLProgram) => void
  }
  /**
   * @description: attribute变量绑定相关配置
   */  
  dataBind: {
    /**
     * @description: 数据缓冲区WebGLBuffer
     */    
    buffer: WebGLBuffer
    /**
     * @description: 写入缓冲区的数据类型
     */    
    dataType: number | undefined
    /**
     * @description: 向缓冲区写入数据的方法
     */    
    method: (data: TypedArray, options: IMeshDataBindOptions) => void
  }
}

export interface IUniformResolver {
  /**
   * @description: GLSL ES变量类型
   */
  variableType: string
  /**
   * @description: GLSL ES变量名称
   */
  variableName: string
  /**
   * @description: attribute或者uniform类型变量
   */ 
  attriOrUni: string
  /**
   * @description: 一个uniform数组类型数组的长度
   */  
  arrayLength?: number
  /**
   * @description: 一个uniform类型变量数据总的数据长度
   */  
  dataLenth: number
  /**
   * @description: 有关GLSL ES变量的数据绑定位置
   */  
  aboutLocation: {
    /**
     * @description: GLSL ES变量的数据绑定位置
     */
    location: WebGLUniformLocation | undefined
    /**
     * @description: 获取绑定GLSL ES变量数据绑定位置（location）的的方法
     */
    method: (param: WebGLProgram) => void
  }
  /**
   * @description: uniform变量绑定相关配置
   */
  dataBind: {
    /**
     * @description: uniform类型变量数据绑定方法的名称
     */    
    name: string | undefined
    /**
     * @description: 纹理
     */    
    texImgeTexture: WebGLTexture | undefined
    /**
     * @description: uniform类型变量写入数据的方法
     */    
    method: (data: number | Array<number> | TypedArray | ITextureOptions) => void
  }
}

export class Shader {
  /**
   * @description: 顶点着色器类型
   */
  static readonly VERTEX_SHADER = 'VERTEX_SHADER'
  /**
   * @description: 片段着色器类型
   */
  static readonly FRAGMENT_SHADER = 'FRAGMENT_SHADER'
  /**
   * @description: attribute变量
   */
  static readonly ATTRIBUTE = 'attribute'
  /**
   * @description: uniform变量
   */
  static readonly UNIFORM = 'uniform'
  /**
  * @description: 该值等同于背景颜色
  */  
  static readonly BACKGROUND_COLOR = -999999
  /**
   * @description: 着色器
   */  
  shader: WebGLShader
  
  renderCtx: WebGl

  scene: Scene

  gl: WebGLRenderingContext
  /**
   * @description: 顶点着色器或者片元着色器
   */  
  type: number
  /**
   * @description: GLSL ES程序字符串
   */  
  source: string
  /**
   * @description: attribute变量解析管理器
   */  
  attributeManager: Map<string, IAttributeResolver>
  /**
   * @description: uniform变量解析管理器
   */ 
  uniformManager: Map<string, IUniformResolver>

  constructor (scene: Scene, type: string, source: string) {
    this.scene = scene
    this.renderCtx = scene.renderCtx as WebGl
    this.gl = this.renderCtx.gl
    this.type = this.gl[type]
    this.source = source
    this.attributeManager = new Map()
    this.uniformManager = new Map()

    const shader = this.gl.createShader(this.type)
    if (shader === null) {
      throw new Error('创建着色器失败')
    }

    this.shader = shader
    this.gl.shaderSource(this.shader, source)
    this.gl.compileShader(this.shader)

    this.reslove()
  }

  private reslove () {
    // 解析
    const regexp = /(?<attriOrUni>attribute|uniform) +(?<variableType>[A-z2-4]{3,11}) +(?<variableName>.+);/g
    const results = [...this.source.matchAll(regexp)]

    for (let i = 0, len = results.length; i < len; i++) {
      const result = results[i]

      if (result.groups) {
        const groups = result.groups
        const arrayLengthResult = groups.variableName.match(/\w+(?=])/g)
        let arrayLength: number | undefined
        if (arrayLengthResult !== null && arrayLengthResult.length === 1) {
          arrayLength = Number(arrayLengthResult[0])
          // 去掉数组[**]
          groups.variableName = groups.variableName.replace(`[${arrayLength}]`, '')
        }

        if (this.attributeManager.has(groups.variableName) || this.uniformManager.has(groups.variableName)) {
          throw new Error(`着色器变量${groups.variableName}重复创建`)
        }

        if (groups.attriOrUni === GLSLES.VARIABLE_TYPES.ATTRIBUTE) {
          const buffer = this.gl.createBuffer()
          if (buffer === null) throw new Error(`为${groups.variableName}创建buffer失败`)

          let count: number | undefined
          if (groups.variableType === GLSLES.VARIABLE_TYPES.FLOAT) count = 1
          const findCount = groups.variableType.match(/(?<name>vec|mat)(?<num>[2-4])/)
          if (findCount !== null && findCount.groups) {
            if (findCount.groups.name === 'vec') count = Number(findCount.groups.num)
            if (findCount.groups.name === 'mat') count = Math.pow(Number(findCount.groups.num), 2)
          }
          if (count === undefined) throw new Error(`着色器中${groups.variableName}的类型出错`)

          const resolver: IAttributeResolver = {
            variableType: groups.variableType,
            variableName: groups.variableName,
            attriOrUni: groups.attriOrUni,
            oneGroupCount: count,
            aboutLocation: {
              location: undefined,
              method: (program: WebGLProgram) => {
                resolver.aboutLocation.location = this.gl.getAttribLocation(program, resolver.variableName)
              }
            },
            dataBind: {
              buffer,
              dataType: undefined,        
              method: (data: TypedArray, options: IMeshDataBindOptions) => {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, resolver.dataBind.buffer)
                this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl[options.bufferData.useage])

                const location = resolver.aboutLocation.location
                if (location === undefined) throw new Error(`着色程序还未指定${resolver.variableName}要修改的顶点属性的索引`)

                const oneByteLen = data.BYTES_PER_ELEMENT
                // dataType自动识别
                if (resolver.dataBind.dataType === undefined) {
                  const name = Object.prototype.toString.apply(data)
                  let dataType: number | undefined
                  if (name.includes('Int8Array')) dataType = this.gl.BYTE
                  if (name.includes('Uint8Array') || name.includes('Uint8ClampedArray')) dataType = this.gl.UNSIGNED_BYTE
                  if (name.includes('Int16Array')) dataType = this.gl.SHORT
                  if (name.includes('Uint16Array')) dataType = this.gl.UNSIGNED_SHORT
                  if (name.includes('Float32Array')) dataType = this.gl.FLOAT
                  if (dataType === undefined) throw new Error('输入顶点着色器数据只能是Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Float32Array当中一种')
                  resolver.dataBind.dataType = dataType
                }
                const vertexAttribPointer = options.vertexAttribPointer

                this.gl.vertexAttribPointer(location, resolver.oneGroupCount, resolver.dataBind.dataType, vertexAttribPointer.normalized, vertexAttribPointer.stride * oneByteLen, vertexAttribPointer.offset * oneByteLen)
                this.gl.enableVertexAttribArray(location)
              }
            }
          }

          this.attributeManager.set(groups.variableName, resolver)
        } else {
          const resolver: IUniformResolver = {
            variableType: groups.variableType,
            variableName: groups.variableName,
            attriOrUni: groups.attriOrUni,
            dataLenth: 0,
            aboutLocation: {
              location: undefined,
              method: (program: WebGLProgram) => {
                const location = this.gl.getUniformLocation(program, resolver.variableName)
                if (location === null) throw new Error(`获取统一变量${resolver.variableName}在GPU中的位置失败`)
                resolver.aboutLocation.location = location
              }
            },
            dataBind: {
              name: undefined,
              texImgeTexture: undefined,
              method: (data: number | Array<number> | TypedArray | ITextureOptions) => {
                const location = resolver.aboutLocation.location
                if (location === undefined) throw new Error(`着色程序还未获取统一变量${resolver.variableName}在GPU中的位置`)
                if (resolver.dataBind.name === undefined) {
                  // uniform[1234][fi]v()识别
                  let count: number | undefined
                  if (groups.variableType.includes('b')) throw new Error(`着色器中${groups.variableName}不接受bool类型传入`)
                  if (groups.variableType === GLSLES.VARIABLE_TYPES.FLOAT || groups.variableType === GLSLES.VARIABLE_TYPES.INT
                    || groups.variableType === GLSLES.VARIABLE_TYPES.SAMPLER2D || groups.variableType === GLSLES.VARIABLE_TYPES.SAMPLERCUBE) {
                    count = 1
                  } else {
                    const findCount = groups.variableType.match(/(?<name>vec|mat)(?<num>[2-4])/)
                    if (findCount !== null && findCount.groups) count = Number(findCount.groups.num)
                  }

                  if (count === undefined) throw new Error(`着色器中${groups.variableName}的类型出错`)
                  resolver.dataLenth = resolver.arrayLength === undefined ? count : count * resolver.arrayLength

                  let type = 'f'
                  if (groups.variableType.includes('i') || groups.variableType.includes('s')) type = 'i'

                  let methodName = `uniform${count}${type}v`
                  
                  // uniformMatrix[234]fv()识别
                  if (groups.variableType.includes('mat')) {
                    resolver.dataLenth = resolver.arrayLength === undefined ? Math.pow(count, 2) : Math.pow(count, 2) * resolver.arrayLength
                    methodName = `uniformMatrix${count}fv`
                  }
                  resolver.dataBind.name = methodName
                }
                
                if (groups.variableType.includes('s')) {
                  // 纹理贴图
                  if (Object.prototype.toString.apply(data) !== '[object Object]') throw new Error('纹理贴图数据必须是ITextureOptions')
                  if (resolver.dataBind.texImgeTexture === undefined) resolver.dataBind.texImgeTexture = this.gl.createTexture()!
                  this.textureMap(data as ITextureOptions, resolver.dataBind.texImgeTexture)
                } else {
                  if (Object.prototype.toString.apply(data) === '[object Object]') throw new Error('数据uniform数据必须是number|Array<number>|TypedArray')
                  const dataTrance: Array<number> | TypedArray = typeof data === 'number' ? [data] : data as Array<number> | TypedArray

                  if (dataTrance.length !== resolver.dataLenth) throw new Error(`检查${groups.variableName}输入数据的长度`)
                  if (resolver.dataBind.name.includes('uniformMatrix')) {
                    this.gl[resolver.dataBind.name](location, false, dataTrance)
                  } else {
                    this.gl[resolver.dataBind.name](location, dataTrance)
                  }
                }
              }
            }
          }

          if (arrayLength !== undefined) resolver.arrayLength = arrayLength

          this.uniformManager.set(groups.variableName, resolver)
        }
      }
    }
  }
  /**
   * @description: 纹理贴图
   * @param {ITextureOptions} options 配置
   * @param {WebGLTexture} texImgeTexture 纹理缓冲区
   * @return {*}
   */  
  private textureMap (options: ITextureOptions, texImgeTexture: WebGLTexture) {
    const textureUnitIndex = this.gl.TEXTURE0 + (options.textureUnitIndex ?? 0)
    if (textureUnitIndex < 0 || textureUnitIndex > this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1) throw new Error(`纹理单元值必须在0~${this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1}范围内`)
    this.gl.activeTexture(textureUnitIndex)
    // 绑定
    this.gl.bindTexture(this.gl.TEXTURE_2D, texImgeTexture)
    // 设置
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    // 处理纹素为1的倍数
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1)
    // 设置纹理Y轴翻转
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1)
    // 指定使用的图片
    const internalformat = this.gl[options.texImage2D.internalformat]
    if (options.texImage2D.width !== undefined && options.texImage2D.height !== undefined) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalformat, options.texImage2D.width,
        options.texImage2D.height, 0, internalformat, this.gl.UNSIGNED_BYTE, options.texImage2D.pixels as ArrayBufferView)
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalformat, internalformat, this.gl.UNSIGNED_BYTE,
        options.texImage2D.pixels as ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)
    }
  }
}