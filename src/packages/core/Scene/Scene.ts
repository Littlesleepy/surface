/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 10:19:38
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\Scene\Scene.ts
 * @Description: 
 */
import { Program } from '../Render/WebGl/Program'
import { WebGl } from '../Render/WebGl/WebGl'
import { Engine } from '../Engine/Engine'
import { Public } from '../Tools/Public'
import { Listen } from '../Event/Listen'
import { EventEmitter } from '../Event/EventEmitter'
import { ZoomTrans } from '../ViewHCI'
import { FencesType } from '../Fence'
import { Canvas } from '../Render/Canvas'

export function isWebGl (render: Canvas | WebGl): render is WebGl {
  return (<WebGl>render).gl !== undefined
}

export class Scene<T = any> {
  /**
   * @description: 缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
   */
  static readonly STATIC_DRAW = 'STATIC_DRAW'
  /**
   * @description: 缓冲区的内容可能经常被使用，并且经常更改。内容被写入缓冲区，但不被读取。
   */
  static readonly DYNAMIC_DRAW = 'DYNAMIC_DRAW'
  /**
   * @description: 缓冲区的内容可能不会经常使用。内容被写入缓冲区，但不被读取。
   */
  static readonly STREAM_DRAW = 'STREAM_DRAW'
  /**
   * @description: 指定索引数组缓冲区中的值的类型UNSIGNED_BYTE。
   */
  static readonly UNSIGNED_BYTE = 'UNSIGNED_BYTE'
  /**
   * @description: 指定索引数组缓冲区中的值的类型UNSIGNED_SHORT。
   */
  static readonly UNSIGNED_SHORT = 'UNSIGNED_SHORT'
  /**
   * @description: 着色程序管理器
   */  
  readonly manager: Map<string, Program>
  /**
   * @description: 渲染器
   */  
  readonly renderCtx: WebGl | Canvas
  /**
   * @description: 引擎
   */  
  readonly engine: Engine
  /**
   * @description: 画布元素
   */  
  readonly canvas: HTMLCanvasElement
  /**
   * @description: 场景挂载点
   */  
  readonly container: HTMLDivElement
  /**
   * @description: 场景事件注册器
   */  
  readonly event: Listen
  /**
   * @description: 事件发布订阅
   */  
  readonly emitter: EventEmitter
  /**
   * @description: 场景平移缩放
   */
  zoomTrans: ZoomTrans | undefined
  /**
   * @description: 反应数据抽取和显示坐标
   */
  fence: FencesType | undefined
  /**
   * @description: 数据挂载池
   */  
  pool: T | undefined
  /**
   * @description: 配置
   */
  readonly options = {}
  /**
   * @description: 资源释放管理器
   */
  readonly disposeManager: Set<() => void> = new Set()
  /**
   * @description: 画布尺寸变化后的回调函数集
   */  
  readonly resizeObservers: Map<string, () => void> = new Map()
  /**
   * @description: 将渲染出的场景分享到Canvas类中
   */  
  readonly shareRender = new Map<string, Canvas>()
  /**
   * @description: 分享fence后回调函数集
   */
  readonly afterShareFence = new Set<(scene: FencesType) => void>()

  private resizeObserver = new ResizeObserver(() => {
    this.renderCtx.contextRefresh()

    for (const [, fun] of this.resizeObservers) {
      fun()
    }
  })

  constructor (engine: Engine, ctx: WebGl | Canvas, options?: {}) {
    this.engine = engine
    this.renderCtx = ctx
    this.manager = new Map()
    this.canvas = this.renderCtx.canvas
    this.container = engine.container

    this.event = new Listen(this.container)
    this.emitter = new EventEmitter()

    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.resizeObserver.observe(this.container)
  }
  /**
   * @description: 刷新场景绘制画布
   */  
  refresh () {
    this.renderCtx.contextRefresh()
    this.renderCtx.clearScreen()
  }
  /**
   * @description: 添加某个着色程序
   * @param {Program} program 着色程序
   * @return {*}
   */  
  addProgram (program: Program) {
    this.manager.set(program.id, program)
  }
  /**
   * @description: 移除某个着色程序
   * @param {string} id 着色程序ID
   * @return {*}
   */  
  removeProgram (id: string) {
    if (this.manager.has(id)) {
      return this.manager.delete(id)
    } else {
      return false
    }
  }
  /**
   * @description: 获取某个着色程序
   * @param {string} id 着色程序ID
   * @return {*}
   */  
  getProgram (id: string) {
    if (this.manager.has(id)) {
      return this.manager.get(id)
    } else {
      console.warn(`不存在id为：${id}的着色器程序`)
      return null
    }
  }
  /**
   * @description: WebGl渲染方法
   * @param {boolean} clearScreen 是否清屏
   */  
  render3D (clearScreen?: boolean) {
    for (const [, fun] of this.beforeRender) {
      fun(this)
    }

    if (clearScreen === undefined || clearScreen === true) this.renderCtx.clearScreen()
    for (const [, program] of this.manager) {
      program.run()
    }
    // 场景渲染共享
    for (const [, target] of this.shareRender) {
      target.renderByImages(this.canvas)
    }
    for (const [, fun] of this.afterRender) {
      fun(this)
    }
  }
  /**
   * @description: 2D渲染钩子，实际不提供2D渲染方法
   */  
  render2D () {
    for (const [, fun] of this.beforeRender) {
      fun(this)
    }
    // 场景渲染共享
    for (const [, target] of this.shareRender) {
      target.renderByImages(this.canvas)
    }
    for (const [, fun] of this.afterRender) {
      fun(this)
    }
  }
  /**
   * @description: 场景绘制前的回调函数
   */  
  beforeRender = new Map<string, ((scene: Scene<T>) => void) >()
  /**
   * @description: 场景绘制后的回调函数
   */
  afterRender = new Map<string, ((scene: Scene<T>) => void) >()
  /**
   * @description: 将fence分享给另外场景
   * @param {Array<Scene> | Scene} scenes 共享的场景
   * @return {*}
   */  
  shareFenceTo (scenes: Array<Scene<any>> | Scene<any>) {
    let _scenes: Array<Scene<any>> = []
    if (!('length' in scenes)) {
      _scenes = [this, scenes]
    } else {
      scenes.unshift(this)
      _scenes = scenes
    }

    let fence: FencesType | undefined

    for (let i = 0, len = _scenes.length; i < len; i++) {
      if (_scenes[i].fence !== undefined) {
        fence = _scenes[i].fence
        break
      }
    }

    if (fence === undefined) throw new Error('场景集合中均不含fence，确认是否需要fence')

    _scenes.forEach(scene => {
      if (fence && scene.fence !== fence) {
        if (scene.fence === undefined) {
          scene.fence = fence
        } else {
          for (const value of scene.fence.afterRefresh) fence.afterRefresh.add(value)
          for (const value of scene.fence.afterTrans) fence.afterTrans.add(value)
          for (const value of scene.fence.afterZoom) fence.afterZoom.add(value)
          for (const value of scene.fence.afterZoomOrTrans) fence.afterZoomOrTrans.add(value)

          scene.fence = fence

          for (const fun of scene.afterShareFence) {
            fun(fence)
          }
        }
      }
    })
  }

  /**
   * @description: 释放资源
   */  
  dispose () {
    this.event.dispose()
    this.emitter.dispose()
    for (const dispose of this.disposeManager) {
      dispose()
    }

    this.resizeObserver.unobserve(this.container)
  }
}