/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-13 13:25:14
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXISpectrumAndFall\fall.ts
 * @Description: 
 */

import { nextTick, onBeforeUnmount, reactive, Ref, ref, watch, watchEffect } from 'vue'
import { ISpectrumInputData, IFallDataBuffer, Controls, ISpectrumAndFallSpectrumPool } from './type'
import { Engine, IPositionResult, IToolTipOptions, LayersFence, LayersFenceType, Mesh, Program, Scene, Shader, ClampForce, ToolTip, ZoomTrans, Threshold, IMeshInputOptions, WebGl } from '../core'
import * as Helper from '../helper'
import { ESwitchState, IAxisYValue, IBtncontrols, ISpectrumAndFallFallPool } from '../types'
import { FallMeasure, IFallMeasurePoint } from './FallMeasure'
import { UseTheme } from '../styles'

export interface IRectAngle {
  mesh: Mesh | undefined
  a_position: Float32Array
  a_color: Float32Array
  u_scale: [number, number]
  initScale: [number, number]
  scaleY: Float32Array
  program: Program | undefined
  oneRowHeight: number
  intervalY: number
}

export function fall (
  props: any,
  spectrumScene: Ref<Scene<ISpectrumAndFallSpectrumPool> | undefined>,
  inputData: Ref<Array<ISpectrumInputData>>,
  spectrumYvalue: Ref<IAxisYValue>,
  defaultValueX: Ref<{ min: number, max: number }>,
  step: Ref<number>,
  usingData: Ref<ISpectrumInputData>,
  lock: Ref<boolean>,
  pubutusave: Ref<number>,
  dbThresholdValue: Ref<{ min: number, max: number }>,
  btnValues: any,
  controls: Ref<Array<IBtncontrols>>
) {
  /** 
   * @description: Y轴颜色
   */  
  const fallAxisYColor = ref({
    width: '',
    backgroundColor: '',
    open: true
  })
  /** 
   * @description: 设置Y轴配置
   */  
  function setAxisYColor () {
    fallAxisYColor.value.width = UseTheme.theme.SpectrumAndFall.axisYWidth
    fallAxisYColor.value.backgroundColor = UseTheme.theme.SpectrumAndFall.fallAxisYColor
  }

  setAxisYColor()

  let fenceCount = 0

  const fallDom = ref<HTMLDivElement>()

  const fallScene = ref<Scene<ISpectrumAndFallFallPool>>()

  const inputDataBuffer = reactive<IFallDataBuffer<ISpectrumInputData>>({
    data: [],
    maxRow: 0,
    oneRowLength: 0,
    topRow: 0,
    toltalRow: 0
  })
  /**
   * @description: 无放大存放数据抽取结果
   */  
  let zoomOneFallvertexColor: Float32Array
  /**
   * @description: 瀑布图有放大时数据抽取结果
   */
  let fallvertexColor: Float32Array

  let a_position: Float32Array

  let fallProgram: Program

  let fallMesh: Mesh

  const u_sizer = [-30, 150, -20, 160]

  let zoomTrans: ZoomTrans

  let toolTip: ToolTip

  let disableToolTipInfo = false

  const toolTipPositionX = ref<number>()

  // 瀑布图上下框选
  let clampForce: ClampForce | undefined

  let clampFoceInfotagremoved = true

  /**
   * @description: 瀑布图框选结果
   */  
  const clampForceResult = ref<{ begin: number, end: number }>()

  const whichRow = ref<number>()

  const whichRowData = ref<ISpectrumInputData>()
  /** 
   * @description: 测量工具
   */  
  let measureTool: FallMeasure

  const measurePosition = ref<IFallMeasurePoint[]>()

  let disableMeasureInfo = false

  /**..........................瀑布图纵向放大.......................... */
  /**
   * @description: 柱状网格
   */  
  const rectangle: IRectAngle = {
    mesh: undefined,
    a_position: new Float32Array(),
    a_color: new Float32Array(),
    u_scale: [0, 0],
    initScale: [0, 10],
    scaleY: new Float32Array(),
    program: undefined,
    oneRowHeight: 10,
    intervalY: 1
  }

  function watchInputData () {
    if (!lock.value || fallDom.value === undefined ||
      fallDom.value.clientHeight === 0 || fallDom.value.clientWidth === 0) return

    const fence = fallScene.value!.fence as LayersFenceType

    let item: ISpectrumInputData
    
    if (!props.singleMode) {
      for (let i = 0, len = inputData.value.length; i < len; i++) {
        item = inputData.value[i]

        if (inputDataBuffer.oneRowLength !== item.data.length) {
          inputDataBuffer.oneRowLength = item.data.length

          // 清空缓存区
          resetFall()
        }

        inputDataBuffer.data.unshift(item)

        // 如果瀑布图储存有限制且超过存量限制，出栈
        if (!props.infiniteFall && inputDataBuffer.data.length > inputDataBuffer.toltalRow) inputDataBuffer.data.pop()

        setZoomOneFallvertexColor(item.data, fence, inputDataBuffer.data)
      }
    } else {
      // 一次性次输入数据
      const len = inputData.value.length, dataBuffer: Array<ISpectrumInputData> = []

      for (let i = 0; i < len; i++) {
        item = inputData.value[i]

        if (inputDataBuffer.oneRowLength !== item.data.length) {
          inputDataBuffer.oneRowLength = item.data.length

          // 清空缓存区
          resetFall()
        }

        dataBuffer.unshift(item)

        setZoomOneFallvertexColor(item.data, fence, dataBuffer)
      }

      inputDataBuffer.data = dataBuffer

      // 计算局部数据占全局数据比例
      if (btnValues.fallZoom && clampForce && clampForce.allThreshold && clampForce.allThreshold.range && len > 0) {
        const range = clampForce.allThreshold.range
        const beginRow = dataBuffer[len - 1]
        const endRow = dataBuffer[0]
        const total = range.toltalTime

        const begin = 1 - (endRow.time - range.beginTime) / total
        const end = 1 - (beginRow.time - range.beginTime) / total

        clampForce.setProportion(begin, end)
      }
    }

    if (toolTip.options.lock) toolTip.options.lock = false
    if (zoomTrans.options.lock) zoomTrans.options.lock = false
    if (measureTool.options.lock) measureTool.options.lock = false
    
    render()
  }
  /**
   * @description: 无缩放时顶点颜色数据构造
   * @param {Float32Array} data 原始一行数据
   * @param {LayersFenceType} fence fence
   * @return {*}
   */  
  function setZoomOneFallvertexColor (data: Float32Array, fence: LayersFenceType, buffer: Array<ISpectrumInputData>) {
    if (inputDataBuffer.maxRow === 0 || zoomOneFallvertexColor.length === 0) return
    // 单次预先存储存储无缩放瀑布图幅度值
    const oneRow = FallData.getSamplingNoZoomOneRowData(data, fence)

    const len = buffer.length > inputDataBuffer.maxRow
      ? inputDataBuffer.maxRow : buffer.length

    if (len === 1) {
      zoomOneFallvertexColor.set(oneRow, 0)
    } else {
      const copy = len === inputDataBuffer.maxRow
        ? zoomOneFallvertexColor.subarray(0, (len - 1) * fence.baseFence.count * 2)
        : zoomOneFallvertexColor.subarray(0, len * fence.baseFence.count * 2)

      zoomOneFallvertexColor.set(oneRow, 0)
      zoomOneFallvertexColor.set(copy, fence.baseFence.count * 2)
    }
  }

  function render () {
    if (fallScene.value) {
      fallScene.value.renderCtx.clearScreen()
      if (inputDataBuffer.data.length > 0) {
        const fence = fallScene.value.fence as LayersFenceType
        
        if (!btnValues.fallCeliang) {

          if (fence.currentZoom === 1) {
            fallMesh.setData('a_color', zoomOneFallvertexColor)
          } else {
            FallData.fallsDrawDataTrend(inputDataBuffer, fallvertexColor, fence)

            fallMesh.setData('a_color', fallvertexColor)
          }

          fallMesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)
        } else {
          rectangle.mesh!.setData('u_conversion', fence.baseFence.modelMatrix.elements)

          // X轴方向缩放平移
          if (fence.currentZoom === 1 || (fence.currentZoom !== 1 && Math.log(fence.currentZoom) / Math.log(2) < fence.layers.length)) { // 无宽度缩放并且数据抽取结果唯一
            // 顶点控制
            rectangle.u_scale[0] = rectangle.initScale[0]
          } else {
            const zoomX = fence.baseFence.eachPieceWidth / fence.baseFence.eachPieceWidthInitial
            rectangle.u_scale[0] = rectangle.initScale[0] * zoomX
          }

          rectangle.u_scale[1] = rectangle.initScale[1]
          // 数据抽取
          FallData.fallsRectangleDataTrend(inputDataBuffer, rectangle.a_color, fence, rectangle.scaleY.length)
        }

        fallScene.value.render3D()
      }
    }
  }

  // 容器高度变化
  function refreshByContainerChange () {
    if (fallScene.value) {
      inputDataBuffer.maxRow = fallScene.value.canvas.clientHeight
      // 瀑布图储存限制
      if (!props.infiniteFall) {
        inputDataBuffer.toltalRow = inputDataBuffer.maxRow * pubutusave.value
        inputDataBuffer.topRow = 0

        // 移除超过频谱容纳量的数据
        const dsLen = inputDataBuffer.data.length - inputDataBuffer.toltalRow
        if (dsLen > 0) {
          inputDataBuffer.data = inputDataBuffer.data.slice(0, inputDataBuffer.toltalRow)
        }
      }
      // 纵向变化引起顶点数量变化
      refreshAsVertextCountchange()
    }
  }

  /**
   * @description: 由于顶点数量发生变化
   */  
  function refreshAsVertextCountchange () {
    if (fallScene.value) {

      const fence = fallScene.value.fence! as LayersFenceType

      a_position = FallData.createFallVertexPosition(fence, inputDataBuffer.maxRow)

      fallMesh.options.drawArrays.count = a_position.length / 2

      fallMesh
        .setData('a_position', a_position)

      zoomOneFallvertexColor =
        new Float32Array(inputDataBuffer.maxRow * fence.baseFence.count * 2).fill(Shader.BACKGROUND_COLOR)
        
      let item: Float32Array
      for (let len = inputDataBuffer.data.length, i = len - 1; i >= 0; i--) {
        item = inputDataBuffer.data[i].data
        setZoomOneFallvertexColor(item, fence, inputDataBuffer.data)
      }

      fallvertexColor =
        new Float32Array(inputDataBuffer.maxRow * fence.baseFence.count * 2).fill(Shader.BACKGROUND_COLOR)
      
      // 瀑布图纵向放大绘制方块
      const result = FallData.createRectangleVertexPosition(fence, inputDataBuffer.maxRow, rectangle.oneRowHeight, rectangle.intervalY)
      rectangle.a_position = result.vertexPosition
      rectangle.mesh!.setData('a_position', rectangle.a_position)

      rectangle.a_color = new Float32Array(result.scaleY.length * fence.baseFence.count).fill(Shader.BACKGROUND_COLOR)
      rectangle.mesh!.setData('a_color', rectangle.a_color)

      rectangle.scaleY = result.scaleY

      rectangle.initScale[0] = fallScene.value.canvas.clientWidth / fence.baseFence.count

      rectangle.mesh!.options.drawArrays.count = rectangle.scaleY.length * fence.baseFence.count 
    }
  }
  /**
   * @description: 重置
   */  
  function resetFall () {
    if (fallScene.value) {
      const fence = fallScene.value.fence as LayersFenceType
      inputDataBuffer.data = []
      inputDataBuffer.topRow = 0

      // 清空缓存区
      zoomOneFallvertexColor =
        new Float32Array(inputDataBuffer.maxRow * fence.baseFence.count * 2).fill(Shader.BACKGROUND_COLOR)

      fallvertexColor =
        new Float32Array(inputDataBuffer.maxRow * fence.baseFence.count * 2).fill(Shader.BACKGROUND_COLOR)

      rectangle.a_color = new Float32Array(rectangle.scaleY.length * fence.baseFence.count).fill(Shader.BACKGROUND_COLOR)
      rectangle.mesh!.setData('a_color', rectangle.a_color)
      
      toolTip.options.lock = true
      zoomTrans.options.lock = true
      measureTool.options.lock = true
      
      fallScene.value.renderCtx.clearScreen()
    }

  }
  /**
   * @description: 瀑布图纵向滑动
   */  
  function fallScroll (scroll: { num: number }) {
    if (fallScene.value) {
      const fence = fallScene.value.fence as LayersFenceType
      const maxRow = btnValues.fallCeliang ? Math.ceil(inputDataBuffer.maxRow / 11) : inputDataBuffer.maxRow
      // 设置缓存区顶部位置
      inputDataBuffer.topRow += scroll.num
      if (inputDataBuffer.topRow < 0) inputDataBuffer.topRow = 0
      if (inputDataBuffer.topRow + maxRow > inputDataBuffer.data.length && inputDataBuffer.data.length > maxRow) {
        inputDataBuffer.topRow = inputDataBuffer.data.length - maxRow
      }
      if (!btnValues.fallCeliang) {
        // 计算瀑布图绘制数据
        FallData.fallsDrawDataTrend(inputDataBuffer, fallvertexColor, fence) // 抽取
        if (fence.currentZoom === 1) {
          zoomOneFallvertexColor = new Float32Array(fallvertexColor)

          fallMesh.setData('a_color', zoomOneFallvertexColor)
        } else {
          fallMesh.setData('a_color', fallvertexColor)
        }
      } else {
        // 数据抽取
        FallData.fallsRectangleDataTrend(inputDataBuffer, rectangle.a_color, fence, rectangle.scaleY.length)
      }
      
      fallScene.value.render3D()
    }
  }
  /**
   * @description: 计算局部夹取工具信息
   */
  function clampForceSection (positions: Map<string, IPositionResult>, back = true) {
    if (fallScene.value && clampForce && inputDataBuffer.data.length > 0) {
      if (clampFoceInfotagremoved && clampForce.sectionThreshold) {
        clampForce.sectionThreshold.threshold.infoTag!.append()
        clampFoceInfotagremoved = false
      }

      const height = fallScene.value.canvas.clientHeight
      // 计算范围
      const topP = positions.get(Threshold.TOP)!
      const bottomP = positions.get(Threshold.BOTTOM)!

      let top = topP.offsetMiddlePCTY * height
      let bottom = bottomP.offsetMiddlePCTY * height
      if (topP.offsetMiddlePCTY > bottomP.offsetMiddlePCTY) {
        top = bottomP.offsetMiddlePCTY * height
        bottom = topP.offsetMiddlePCTY * height
      }

      if (top > height) top = height
      if (top < 0) top = 0
      if (bottom > height) bottom = height
      if (bottom < 0) bottom = 0

      const result = new Map<string, { info: string }>()
      // 行索引
      const min = Math.floor(top)
      let max = Math.floor(bottom)
      if (min < inputDataBuffer.data.length) {
        if (max >= inputDataBuffer.data.length) max = inputDataBuffer.data.length - 1

        // 时间
        const minTime = inputDataBuffer.data[max].time
        const maxTime = inputDataBuffer.data[min].time

        if (back) clampForceResult.value = { end: maxTime, begin: minTime }

        result.set('0', {
          info: `结束时间：${Helper.ZDate.dateFormat(new Date(maxTime), 'hh:ss:mm.MI')}`
        })

        result.set('1', {
          info: `开始时间：${Helper.ZDate.dateFormat(new Date(minTime), 'hh:ss:mm.MI')}`
        })
      }

      clampForce.sectionThreshold!.threshold.setContent(result)
    }
  }
  /**
   * @description: 计算全局夹取工具信息
   */  
  function clampForceAll (positions: Map<string, IPositionResult>, back = true) {
    if (clampForce && clampForce.allThreshold?.range !== undefined) {
      if (clampFoceInfotagremoved && clampForce.sectionThreshold) {
        clampForce.sectionThreshold.threshold.infoTag!.append()
        clampFoceInfotagremoved = false
      }
      // 计算范围
      const topP = positions.get(Threshold.TOP)!
      const bottomP = positions.get(Threshold.BOTTOM)!

      let topr = topP
      let bottomr = bottomP
      if (topP.offsetMiddlePCTY > bottomP.offsetMiddlePCTY) {
        topr = bottomP
        bottomr = topP
      }

      let top = topr.offsetMiddlePCTY
      let bottom = bottomr.offsetMiddlePCTY

      if (topr.offsetY === 0) top = 0
      if (bottomr.offsetY === 1) bottom = 0

      if (top > 1) top = 1
      if (top < 0) top = 0
      if (bottom > 1) bottom = 1
      if (bottom < 0) bottom = 0

      // 时间范围毫秒
      const range = clampForce.allThreshold.range
      const minTime = range.beginTime + Math.floor((1 - bottom) * range.toltalTime)
      const maxTime = range.beginTime + Math.floor((1 - top) * range.toltalTime)

      if (back) clampForceResult.value = { end: maxTime, begin: minTime }

      const result = new Map<string, { info: string }>()

      result.set('0', {
        info: `结束时间：${Helper.ZDate.dateFormat(new Date(maxTime), 'hh:ss:mm.MI')}`
      })

      result.set('1', {
        info: `开始时间：${Helper.ZDate.dateFormat(new Date(minTime), 'hh:ss:mm.MI')}`
      })

      clampForce.sectionThreshold!.threshold.setContent(result)
    }
  }
  /** 
   * @description: 创建着色器程序
   */  
  function createShaderSource () {
    if (fallScene.value) {
      const v = UseTheme.theme.nl.backgroundColor
      const bgColor = `vec3(${v[0]}, ${v[1]}, ${v[2]})`
      const barColor =  UseTheme.theme.SpectrumAndFall.barColor

      let str = `if (color < 0.0) {
              v_color = ${bgColor};
            } `

      const count = barColor.length - 1
      const ds = 1 / count // 每段颜色区间长度

      let colorS, colorE

      for (let i = 0; i < count; i++) {
        colorS = barColor[i]
        colorE = barColor[i + 1]
        const min = ds * i
        const max = min + ds

        str += `else if (color >= float(${min}) && color <= float(${max})) {
              float proportion = (color - float(${ds * i})) / float(${ds});
              v_color = vec3(float(${colorE[0] - colorS[0]}) * proportion + float(${colorS[0]}), float(${colorE[1] - colorS[1]}) * proportion + float(${colorS[1]}), float(${colorE[2] - colorS[2]}) * proportion + float(${colorS[2]}));
            } `
      }

      str += `else {
              v_color = vec3(float(${colorE[0]}), float(${colorE[1]}), float(${colorE[2]}));
            }`

      const vertexSorce = `
        precision lowp float;
        attribute vec2 a_position;
        attribute float a_color;
        uniform vec2 u_sizer[2];
        uniform mat4 u_conversion;
        varying vec3 v_color;
        void main() {
          gl_Position = u_conversion * vec4(a_position, 0.0, 1.0);
          if (a_color < u_sizer[0].x || a_color > u_sizer[0].y || a_color == ${Shader.BACKGROUND_COLOR}.0) {
            v_color = ${bgColor};
          } else {
            float color = (a_color - u_sizer[1].x) / u_sizer[1].y;
            ${str}
          }
        }
      `
      const fragmentSource = `
        precision lowp float;
        varying vec3 v_color;
        void main () {
          gl_FragColor = vec4(v_color, 1.0);
        } `

      const vertexShader = new Shader(fallScene.value, Shader.VERTEX_SHADER, vertexSorce)
      const fragmentShader = new Shader(fallScene.value, Shader.FRAGMENT_SHADER, fragmentSource)
      
      fallProgram = new Program(vertexShader, fragmentShader)

      /**....................................瀑布图精确测量.................................... */
      const rectangleVertexSource = `
          precision lowp float;
          attribute vec2 a_position;
          attribute float a_color;
          uniform vec2 u_scale;
          uniform mat4 u_conversion;
          uniform vec2 u_sizer[2];
          varying vec3 v_color;
          void main() {
            if (u_scale.x > u_scale.y) {
              gl_PointSize = u_scale.x;
            } else {
              gl_PointSize = u_scale.y;
            }
            gl_Position = u_conversion * vec4(a_position, 0.0, 1.0);
            if (a_color < u_sizer[0].x || a_color > u_sizer[0].y || a_color == ${Shader.BACKGROUND_COLOR}.0) {
              v_color = ${bgColor};
            } else {
              float color = (a_color - u_sizer[1].x) / u_sizer[1].y;
              ${str}
            }
          }`
      const rectangleFragmentSource = `
        precision lowp float;
        varying vec3 v_color;
        uniform vec2 u_scale;
        void main () {
          float d;
          if (u_scale.x > u_scale.y) {
            d = u_scale.y / u_scale.x / 2.0;
            if (gl_PointCoord.y >= 0.5 - d && gl_PointCoord.y <= 0.5 + d) {
              gl_FragColor = vec4(v_color, 1.0);
            } else {
              discard;
            }
          } else {
            d = u_scale.x / u_scale.y / 2.0;
            if (gl_PointCoord.x >= 0.5 - d && gl_PointCoord.x <= 0.5 + d) {
              gl_FragColor = vec4(v_color, 1.0);
            } else {
              discard;
            }
          }
        } `

      const rectangleVertexShader = new Shader(fallScene.value, Shader.VERTEX_SHADER, rectangleVertexSource)
      const rectangleFragmentShader = new Shader(fallScene.value, Shader.FRAGMENT_SHADER, rectangleFragmentSource)
      
      rectangle.program = new Program(rectangleVertexShader, rectangleFragmentShader)
    }
  }

  // 主题注册
  const themeKey = UseTheme.on(() => {
    if (fallScene.value && rectangle.program) {
      const ctx = fallScene.value.renderCtx
      ctx.options.backgroundColor = UseTheme.theme.nl.backgroundColor

      setAxisYColor()

      createShaderSource()
      fallProgram.add(fallMesh)
      rectangle.program.add(rectangle.mesh!)

      fallScene.value.manager.clear()

      if (btnValues.fallCeliang) {
        fallScene.value.addProgram(rectangle.program!)
        fallScene.value.removeProgram(fallProgram.id)
      } else {
        fallScene.value.addProgram(fallProgram)
        fallScene.value.removeProgram(rectangle.program!.id)
      }

      render()
    }
  })
  /**
   * @description: 加载一次
   */  
  function load () {
    if (!lock.value) return
    if (fallDom.value && fallScene.value === undefined) {
      const engine = new Engine(fallDom.value)

      const ctx = new WebGl(engine.canvas, { backgroundColor: UseTheme.theme.nl.backgroundColor })

      fallScene.value = new Scene(engine, ctx)

      const fence = LayersFence.create(fallScene.value)

      fence.afterRefresh.add(() => {
        const fence = fallScene.value!.fence! as LayersFenceType

        // 横向fenceCount变化引起顶点数量变化再刷新
        if (fenceCount !== fence.baseFence.count) {
          fenceCount = fence.baseFence.count

          refreshAsVertextCountchange()
        }

        // 如果是一次性输入所有数据，执行watchInputData(因为依赖于spectrum的fence刷新后)
        if (props.singleMode) {
          watchInputData()
        }
      })

      fence.afterZoomOrTrans.add(() => {
        render()
      })

      zoomTrans = new ZoomTrans(fallScene.value)

      createShaderSource()

      setAxisYColor()

      fallMesh = new Mesh(fallScene.value, {
        drawArrays: {
          mode: Mesh.LINES,
          count: 0
        }
      })

      fallMesh.setData('u_sizer', u_sizer)

      fallProgram.add(fallMesh)

      fallScene.value.addProgram(fallProgram)

      /**....................................瀑布图精确测量.................................... */
      const rectangleOptions: IMeshInputOptions = {
        drawArrays: {
          mode: Mesh.POINTS,
          count: 0
        }
      }
      rectangle.mesh = new Mesh(fallScene.value, rectangleOptions)

      rectangle.mesh
        .setData('u_scale', rectangle.u_scale)
        .setData('u_sizer', u_sizer)

      rectangle.program!.add(rectangle.mesh)

      // 容器尺寸变化
      fallScene.value.resizeObservers.set('fall', () => {
        const dom = fallDom.value!
        const fence = fallScene.value!.fence!
        rectangle.initScale[0] = fallScene.value!.canvas.clientWidth / fence.baseFence.count

        if (dom.clientHeight !== inputDataBuffer.maxRow) {
          refreshByContainerChange()
        }

        render()
      })

      // 游离显示信息
      const toolTipOptions: IToolTipOptions = {
        type: ToolTip.CROSS,
        infoTag: {
          width: 270
        }
      }
      toolTip = new ToolTip(fallScene.value, toolTipOptions)

      toolTip.afterTrigger.set('fall', (p: IPositionResult) => {
        toolTipPositionX.value = p.offsetMiddlePCTX
        // 纵向向索引
        let index = 0
        if (!btnValues.fallCeliang) {
          index = Math.floor(p.offsetMiddlePCTY * fallDom.value!.clientHeight)
          if (index < 0) index = 0
          if (index > fallDom.value!.clientHeight - 1) index = fallDom.value!.clientHeight - 1
        } else {
          const ds = rectangle.oneRowHeight + rectangle.intervalY
          index = Math.floor(p.offsetMiddlePCTY * fallDom.value!.clientHeight / ds)
        }
        whichRow.value = index
      })

      toolTip.afterHidden.set('fall', () => {
        toolTipPositionX.value = undefined
        whichRow.value = undefined
      })

      toolTip.infoTag.instance.afterMount.set('fall', () => {
        disableToolTipInfo = true
      })

      // 上下框选
      controls.value.forEach(item => {
        if (item.paramName === Controls.fallZoom && fallScene.value) {
          clampForce = new ClampForce(fallScene.value.container, {
            scene: fallScene.value,
            allThreshold: {
              infoTag: { show: false }
            }
          })

          fallScene.value.disposeManager.add(() => { clampForce!.dispose() })

          if (clampForce.allThreshold) {
            const threshold = clampForce.allThreshold.threshold
            threshold.afterEnd.set('fall', (positions) => {
              clampForceAll(positions)
            })

            threshold.afterTrigger.set('fall', (positions) => {
              clampForceAll(positions, false)
            })
          }

          if (clampForce.sectionThreshold) {
            const threshold = clampForce.sectionThreshold.threshold
            threshold.afterEnd.set('fall', (positions) => {
              clampForceSection(positions)
            })

            threshold.afterTrigger.set('fall', (positions) => {
              clampForceSection(positions, false)
            })
            
            threshold.infoTag!.remove()
          }

          clampForce.afterClose.set('fall', () => {
            btnValues.fallZoom = false
          })

          if (btnValues.fallZoom) {
            clampForce.open()
          } else {
            clampForce.close()
          }
        }
      })

      // 测量工具
      measureTool = new FallMeasure(fallScene.value, { oneRowHeight: rectangle.oneRowHeight, intervalY: rectangle.intervalY })
      fallScene.value.disposeManager.add(() => { measureTool.dispose() })

      measureTool.afterClose.set('fall', () => {
        btnValues.fallCeliang = false
        measurePosition.value = undefined
      })

      measureTool.afterTrigger.set('fall', (r) => {
        measurePosition.value = Array.from(r)
      })

      measureTool.infoTag.instance.afterMount.set('fall', () => {
        disableMeasureInfo = true
      })

      if (btnValues.fallCeliang) measureTool.open()

      // 数据池挂载
      //@ts-ignore
      fallScene.value.pool = reactive({
        inputDataBuffer,
        toolTip,
        toolTipPositionX,
        whichRow,
        whichRowData,
        clampForce,
        clampForceResult,
        measureTool,
        measurePosition
      })
    } else {
      if (fallScene.value) fallScene.value.renderCtx.clearScreen()
    }
  }

  watch(inputData, watchInputData)

  watch(spectrumYvalue, () => {
    u_sizer[2] = spectrumYvalue.value.min
    u_sizer[3] = spectrumYvalue.value.max - spectrumYvalue.value.min

    if (fallScene.value && inputDataBuffer.data.length > 0) fallScene.value.render3D()
  })

  watch(pubutusave, (value) => {
    if (props.switchLever === ESwitchState.open && lock.value && !props.infiniteFall) {
      inputDataBuffer.toltalRow = inputDataBuffer.maxRow * value
      // 如果buffer长度超过总长度，减掉
      const len = inputDataBuffer.data.length
      if (len > inputDataBuffer.toltalRow) inputDataBuffer.data.splice(inputDataBuffer.toltalRow, len - inputDataBuffer.toltalRow)
    }
  })

  // 筛选
  watch(dbThresholdValue, (value) => {
    u_sizer[0] = value.min
    u_sizer[1] = value.max

    if (fallScene.value && inputDataBuffer.data.length > 0) fallScene.value.render3D()
  })

  watch(lock, () => {
    nextTick(load)
  })

  watch(spectrumScene, (s) => {
    if (s) load()
  })

  watch(() => props.switchLever, (btn) => {
    if (btn === ESwitchState.open && lock.value) {
      // 清空缓存区
      resetFall()

      if (fallScene.value) {
        fallScene.value.renderCtx.clearScreen()
      }

      if (btnValues.fallCeliang) measureTool.reset()
    } 
  })

  // 瀑布图缩放
  watch(() => btnValues.fallZoom, (btn) => {
    if (clampForce) {
      if (btn) {
        clampForce.open()
        toolTip.close()
        measureTool.close()

        if (btnValues.fallCeliang) { btnValues.fallCeliang = false }
      } else {
        clampForce.close()
      }
    }
  })

  watch(() => props.infiniteFall, refreshByContainerChange)
  // 瀑布图测量
  watch(() => btnValues.fallCeliang, (btn) => {
    inputDataBuffer.topRow = 0
    
    if (btn) {
      measureTool.open()
      if (clampForce) clampForce.close()
      toolTip.close()

      if (btnValues.fallZoom) { btnValues.fallZoom = false }

      // 切换着色程序
      if (fallScene.value) {
        fallScene.value.addProgram(rectangle.program!)
        fallScene.value.removeProgram(fallProgram.id)
      }
    } else {
      measureTool.close()

      if (fallScene.value) {
        fallScene.value.addProgram(fallProgram)
        fallScene.value.removeProgram(rectangle.program!.id)
      }
    }

    render()
  })

  watch(() => inputDataBuffer.topRow, (v) => {
    if (btnValues.fallCeliang) measureTool.setPositionY(v)
  })

  watchEffect(() => {
    if (!lock.value) return

    if (whichRow.value !== undefined && inputDataBuffer.data.length !== 0) {
      whichRowData.value = inputDataBuffer.data[whichRow.value + inputDataBuffer.topRow]
    } else {
      whichRowData.value = undefined
    }

    if (props.switchLever !== ESwitchState.open && whichRowData.value !== undefined) {
      usingData.value = whichRowData.value
    }
  })
  // 游离信息显示
  watchEffect(() => {
    const result: Map<string, { info: string }> = new Map()
    if (!lock.value) {
      return
    }

    if (!disableToolTipInfo && toolTipPositionX.value !== undefined && fallScene.value) {
      const fence = fallScene.value.fence as LayersFenceType
      const dataIndex = fence.getDataIndexByDistance(toolTipPositionX.value)
      // 频率计算
      const frequency = defaultValueX.value.min + dataIndex * step.value
      
      if (whichRowData.value && whichRow.value) {
        // 幅度
        const range = whichRowData.value.data[dataIndex]
        // 日期
        result.set('日期', {
          info: '日期：' + Helper.ZDate.dateFormat(new Date(whichRowData.value.time), 'yy-MM-dd')
        })
        // 检查有无timeSpan
        if (whichRowData.value.timeSpan) {
          result.set('首帧时差', {
            info: '首帧时差：' + parseFloat(whichRowData.value.timeSpan.toFixed(3)) + '毫秒'
          })

          let prevFrameIndex = whichRow.value + inputDataBuffer.topRow + 1
          if (prevFrameIndex > inputDataBuffer.data.length - 1) prevFrameIndex = inputDataBuffer.data.length - 1
          const prevFrame =  inputDataBuffer.data[prevFrameIndex]

          result.set('前帧时差', {
            info: '前帧时差：' + parseFloat((whichRowData.value.timeSpan - prevFrame.timeSpan!).toFixed(3)) + '毫秒'
          })
        } else {
          // 时间
          result.set('时间', {
            info: '时间：' + Helper.ZDate.dateFormat(new Date(whichRowData.value.time), 'hh:ss:mm.MI')
          })
        }
        // 幅度
        result.set('幅度', {
          info: props.scaleY.parse(range)
        })
      }
      
      result.set('频率', {
        info: props.scaleX.parse(frequency)
      })
    }

    if (toolTip) toolTip.setContent(result)
  })

  // 瀑布图测量
  watchEffect(() => {
    if (!disableMeasureInfo && measurePosition.value && measurePosition.value.length === 2 && fallScene.value) {
      const result: Map<string, { info: string }> = new Map()
      const p1 = measurePosition.value[0]
      const p2 = measurePosition.value[1]

      if (p1.active && p2.active && p1.dataIndexX !== undefined && p2.dataIndexX !== undefined) {
        // 频率差
        const dsX = props.scaleX.transform(Math.abs(p1.dataIndexX - p2.dataIndexX) * step.value)
        result.set('0', {
          info: `频率差：${dsX}MHz | ${dsX * 1000} kHz`
        })

        // 时间差
        const dataY1 = inputDataBuffer.data[p1.dataIndexY!]
        const dataY2 = inputDataBuffer.data[p2.dataIndexY!]

        if (dataY1 && dataY2) {
          let dsTimeInfo: string

          if (dataY1.timeSpan && dataY2.timeSpan) {
            dsTimeInfo = `时差：${parseFloat(Math.abs(dataY1.timeSpan - dataY2.timeSpan).toFixed(3))}毫秒`
          } else {
            const dsTime = Math.abs(dataY1.time - dataY2.time)
            dsTimeInfo = `时差：${dsTime}毫秒`
          }

          result.set('1', {
            info: dsTimeInfo
          })
        }

      }
      measureTool.setContent(result)
    }
  })

  onBeforeUnmount(() => {
    if (fallScene.value) {
      UseTheme.off(themeKey)

      fallScene.value.dispose()
    }
  })

  return {
    fallAxisYColor,
    fallDom,
    fallScene,
    inputDataBuffer,
    fallScroll,
    resetFall
  }
}
/**
 * @description: 瀑布图数据处理
 */
export class FallData {
  /**
   * @description: 无缩放数据抽取
   * @param {Float32Array} data 数据
   * @param {LayersFenceType} fence LayersFenceType
   * @return {*}
   */  
  static getSamplingNoZoomOneRowData (data: Float32Array, fence: LayersFenceType) {
    const drawLength = fence.baseFence.count
    const vertexColor = new Float32Array(drawLength * 2), startIndex = 0, section = fence.layers[0]

    let i, item, y, start, max
    const len1 = fence.practicalCount % section
    const endIndex = startIndex + fence.practicalCount - len1

    for (i = 0; i < drawLength; i++) {
      start = startIndex + i * section
      max = data[start]
      item = 2 * i
      // 单行数据抽取
      if (start < endIndex) {
        for (y = 0; y < section; y++) { max = Math.max(max, data[start + y]) }
      } else { // 临近尾部处理
        for (y = 0; y < len1; y++) { max = Math.max(max, data[start + y]) }
      }
      vertexColor[item] = max
      vertexColor[item + 1] = max
    }
    return vertexColor
  }

  static createFallVertexPosition (fence: LayersFenceType, row: number) {
    let i, x, j, h1, index
    const drawLength = fence.baseFence.count, len = drawLength * row,
      vertexPosition = new Float32Array(len * 4), h = 2 / row, pieces = fence.baseFence.piecesInitial,
      width = fence.baseFence.eachPieceWidthInitial
    i = j = 0
    h1 = 1.0 - 0.5 * h
    do {
      index = i * 4
      x = pieces[j]
      vertexPosition[index] = x - width
      vertexPosition[index + 2] = x + width
      vertexPosition[index + 1] = vertexPosition[index + 3] = h1
      if ((i + 1) % drawLength !== 0) { // 完成一行
        j++
      } else {
        h1 -= h
        j = 0
      }
      i++
    }
    while (i < len)
    return vertexPosition
  }
  /**
   * @description: 瀑布图数据抽取
   * @param {IFallDataBuffer} buffer 瀑布图数据缓存
   * @param {Float32Array} vertexColor 顶点颜色缓存
   * @param {LayersFenceType} fence
   * @return {*}
   */   
  static fallsDrawDataTrend (buffer: IFallDataBuffer<ISpectrumInputData>, vertexColor: Float32Array, fence: LayersFenceType) {
    let index, item, cut, start, max, n, i, y
    const data = buffer.data.slice(buffer.topRow, buffer.topRow + buffer.maxRow + 1),
      hasRow = data.length, section = fence.currenSection, left = fence.baseFence.visibleIndex.min,
      startIndex = fence.cutDataStartIndex, drawLength = fence.baseFence.visibleLength, len1 = fence.cutDataLength % section,
      endIndex = startIndex + fence.cutDataLength - len1, maxLength = fence.baseFence.count
    for (n = 0; n < hasRow; n++) {
      // 一行数据
      cut = data[n].data
      index = (n * maxLength + left) * 2
      for (i = 0; i < drawLength; i++) {
        start = startIndex + i * section
        max = cut[start]
        item = index + 2 * i
        // 单行数据抽取
        if (start < endIndex) {
          for (y = 0; y < section; y++) { max = Math.max(max, cut[start + y]) }
        } else { // 临近尾部处理
          for (y = 0; y < len1; y++) { max = Math.max(max, cut[start + y]) }
        }
        vertexColor[item] = max
        vertexColor[item + 1] = max
      }
    }
  }

  static createRectangleVertexPosition (fence: LayersFenceType, row: number, oneRowHeight: number, intervalY: number) {
    const unit = 2 / row // 纵向1px代表的webgl坐标系的度量
    // 纵向方块高度10px + 1px间隔，由上往下计算
    const minY = -1 - unit * oneRowHeight / 2
    // 计算共多少行，保存每行纵向坐标
    let positionY = 1, i = 0
    const scales: Array<number> = []
    while (positionY > minY) {
      positionY = 1 - (2 * i + 1) * oneRowHeight / 2 * unit - i * unit * intervalY
      scales.push(positionY)
      i++
    }

    // 制造坐标网
    const scaleY = new Float32Array(scales), rowCount = scaleY.length, columnCount = fence.baseFence.count, 
    vertexPosition = new Float32Array(rowCount * columnCount * 2), pieces = fence.baseFence.piecesInitial
    
    let x = 0
    for (i = 0; i < rowCount; i++) { // 行
      positionY =  scaleY[i]
      const startRow = i * columnCount * 2
      for (let j = 0; j < columnCount; j++) { // 列
        x = startRow + j * 2
        vertexPosition[x] = pieces[j]
        vertexPosition[x + 1] = positionY
      }
    }

    return { vertexPosition, scaleY }
  }

  static fallsRectangleDataTrend (buffer: IFallDataBuffer<ISpectrumInputData>, vertexColor: Float32Array, fence: LayersFenceType, maxRow: number) {
    let index, cut, start, max, n, i, y
    const data = buffer.data.slice(buffer.topRow, buffer.topRow + maxRow + 1),
      hasRow = data.length, section = fence.currenSection, left = fence.baseFence.visibleIndex.min,
      startIndex = fence.cutDataStartIndex, drawLength = fence.baseFence.visibleLength, len1 = fence.cutDataLength % section,
      endIndex = startIndex + fence.cutDataLength - len1, maxLength = fence.baseFence.count
    for (n = 0; n < hasRow; n++) {
      // 一行数据
      cut = data[n].data
      index = n * maxLength + left
      for (i = 0; i < drawLength; i++) {
        start = startIndex + i * section
        max = cut[start]
        // 单行数据抽取
        if (start < endIndex) {
          for (y = 0; y < section; y++) { max = Math.max(max, cut[start + y]) }
        } else { // 临近尾部处理
          for (y = 0; y < len1; y++) { max = Math.max(max, cut[start + y]) }
        }
        vertexColor[index + i] = max
      }
    }
  }

}