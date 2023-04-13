import { Shader, TypedArray, IAttributeResolver, IUniformResolver, ITextureOptions } from './Shader'
import { Scene } from '../../Scene'
import { WebGl } from './WebGl'
import { Public } from '../../Tools/Public'
import { Mesh } from '../../Mesh'

export class Program {
  program: WebGLProgram

  renderCtx: WebGl

  scene: Scene

  vertexShader: Shader

  fragmentShader: Shader

  id: string

  gl: WebGLRenderingContext
  /**
   * @description: uniform和attribute变量数据绑定管理器
   */  
  dataBindManager: Map<string, IAttributeResolver | IUniformResolver>
  /**
   * @description: 网格
   */  
  meshs: Map<string, Mesh>

  constructor (vertex: Shader, fragment: Shader, scene?: Scene, options?: {
    id?: string
  })

  constructor (
    vertex: { shaderType: string, source: string },
    fragment: { shaderType: string, source: string },
    scene: Scene,
    options?: {
      id?: string
    }
  )

  constructor (vertexShader: any, fragmentShader: any, scene?: Scene, options?: {
    id?: string
  }) {
    if (scene) {
      this.scene = scene
      this.renderCtx = scene.renderCtx as WebGl
    } else {
      this.scene = vertexShader.scene
      this.renderCtx = vertexShader.renderCtx
    }
    this.gl = this.renderCtx.gl
    this.dataBindManager = new Map()
    this.meshs = new Map()

    if ('shaderType' in vertexShader) {
      this.vertexShader = new Shader(this.scene, vertexShader.shaderType, vertexShader.source)
    } else {
      this.vertexShader = vertexShader
    }

    if ('shaderType' in fragmentShader) {
      this.fragmentShader = new Shader(this.scene, fragmentShader.shaderType, fragmentShader.source)
    } else {
      this.fragmentShader = fragmentShader
    }

    if (options) {
      this.id = options.id ?? Public.guid()
    } else {
      this.id = Public.guid()
    }


    const program = this.renderCtx.gl.createProgram()
    if (program === null) {
      throw new Error('创建着色器程序失败')
    }

    this.gl.attachShader(program, this.vertexShader.shader)
    this.gl.attachShader(program, this.fragmentShader.shader)
    this.gl.linkProgram(program)
    this.program = program

    // GLSL ES 着色器程序变量地址绑定赋值
    // 去除片段着色器中与顶点着色器中共享的uniform变量，避免重复绑定
    for (const [key, resolver] of this.vertexShader.attributeManager) {
      resolver.aboutLocation.method(this.program)
      this.dataBindManager.set(key, resolver)
    }
    for (const [key, resolver] of this.vertexShader.uniformManager) {
      resolver.aboutLocation.method(this.program)
      this.dataBindManager.set(key, resolver)
      if (this.fragmentShader.uniformManager.has(key)) {
        this.fragmentShader.uniformManager.delete(key)
      }
    }
    // 片段着色器
    if (this.fragmentShader.attributeManager.size > 0) throw new Error('片段着色器内不能使用attribute类型变量')
    for (const [key, resolver] of this.fragmentShader.uniformManager) {
      resolver.aboutLocation.method(this.program)
      this.dataBindManager.set(key, resolver)
    }    
  }
  /**
   * @description: 获取attribute变量绑定相关配置
   * @param {string} variableName attribute变量名称
   * @return {*}
   */  
  getAttributeDataBindOptions (variableName: string) {
    const resolver = this.vertexShader.attributeManager.get(variableName)
    if (resolver === undefined) {
      console.warn(`${variableName}不存在`)
      return null
    }
    return resolver.dataBind
  }
  /**
   * @description: 添加一个网格到着色程序
   * @param {Mesh} mesh 网格
   * @return {*}
   */  
  add (mesh: Mesh) {
    if (!this.meshs.has(mesh.id)) {
      this.meshs.set(mesh.id, mesh)
      for (const [variableName, resolver] of this.dataBindManager) {
        // 检查绑定设置
        if (resolver.attriOrUni === Shader.ATTRIBUTE
          && !mesh.attriBindOptions.has(variableName)) mesh.setAttriBindOptions(variableName)
      }
    }
  }
  /**
   * @description: 从着色程序移除一个网格
   * @param {Mesh} mesh 网格
   * @return {*}
   */
  remove (mesh: Mesh) {
    return this.meshs.delete(mesh.id)
  }
  /**
   * @description: 从着色程序获取一个网格
   * @param {Mesh} mesh 网格
   * @return {*}
   */
  get (meshId: string) {
    return this.meshs.get(meshId)
  }
  /**
   * @description: 渲染当前着色程序
   */  
  run () {
    this.gl.useProgram(this.program)

    for (const [, mesh] of this.meshs) {
      for (const [variableName, resolver] of this.dataBindManager) {
        const data = mesh.data.get(variableName)

        if (data === undefined) {
          console.warn(`${variableName}所需数据缺失`)
          continue
        }

        if ('oneGroupCount' in resolver) {
          if (Object.prototype.toString.apply(data).match(/\w+Array/) !== null) {
            const result = data as TypedArray
            const options = mesh.getAttriBindOptions(variableName)
            if (options === undefined) throw new Error(`${variableName}未设置数据绑定配置`)
            
            if (!mesh.hasOnceBind(variableName)) {
              resolver.dataBind.method(result, options)
              if (options.once) mesh.tagForOnceBind(variableName)
            }
          } else {
            throw new Error(`${variableName}的数据类型只能是Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Float32Array当中一种`)
          }
        } else {
          resolver.dataBind.method(data)
        }
      }
      
      if (mesh.options.drawArrayOrElements === Mesh.DRAWBYARRAY) {
        const drawOption = mesh.options.drawArrays
        const mode = this.gl[drawOption.mode]
        const first = drawOption.first ?? 0
        this.gl.drawArrays(mode, first, drawOption.count)
      } else {
        const dataBindIndex = mesh.options.dataBindIndex
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer!)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, dataBindIndex.indexData, dataBindIndex.useage)
        const drawOption = mesh.options.drawElements
        const mode = this.gl[drawOption.mode]
        const offset = drawOption.offset ?? 0
        if (mesh.drawElementsType === undefined || mesh.drawElementsPerByteLength === undefined) throw new Error(`着色程序${this.id}顶点索引数据类型未识别`)
        this.gl.drawElements(mode, drawOption.count, mesh.drawElementsType, offset * mesh.drawElementsPerByteLength)
      }
    }
  }

  refresh () {
    for (const [, mesh] of this.meshs) { mesh.refresh() }
    this.meshs.clear()
  }
}