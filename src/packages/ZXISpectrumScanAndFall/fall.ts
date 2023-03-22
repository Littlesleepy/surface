/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-13 11:37:06
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXISpectrumScanAndFall\fall.ts
 * @Description: 
 */

import { nextTick, onBeforeUnmount, reactive, Ref, ref, watch, watchEffect } from 'vue'
import { Engine, IPositionResult, IToolTipOptions, LayersFence, LayersFenceType, Mesh, Program, Scene, Shader, ToolTip, ZoomTrans, IMeshInputOptions, WebGl, ClampForce, Threshold } from '../core'
import * as Helper from '../helper'
import { ESwitchState, IAxisYValue, IFallDataBuffer, ISpectrumScanAndFallFallPool, IBtncontrols } from '../types'
import { FallData, IRectAngle } from '../ZXISpectrumAndFall/fall'
import { Controls, FallMeasure, IFallMeasurePoint } from '../ZXISpectrumAndFall/type'
import { ISpectrumScanAndFallSpectrumPool, ISpectrumScanInputData } from './type'
import { UseTheme } from '../styles'

export function fall (
  props: any,
  spectrumScene: Ref<Scene<ISpectrumScanAndFallSpectrumPool> | undefined>,
  inputDataLength: Ref<number>,
  afterStaticData: Ref<Array<ISpectrumScanInputData>>,
  spectrumYvalue: Ref<IAxisYValue>,
  defaultValueX: Ref<{ min: number, max: number }>,
  step: Ref<number>,
  usingData: Ref<ISpectrumScanInputData>,
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

  const fallScene = ref<Scene<ISpectrumScanAndFallFallPool>>()

  const inputDataBuffer = reactive<IFallDataBuffer<ISpectrumScanInputData>>({
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

  const whichRow = ref<number>()

  const whichRowData = ref<ISpectrumScanInputData>()

  /** 
   * @description: 测量工具
   */  
  let measureTool: FallMeasure

  const measurePosition = ref<IFallMeasurePoint[]>()
  /** ............................瀑布图上下框选............................ */
  let disableMeasureInfo = false
  // 瀑布图上下框选
  let clampForce: ClampForce | undefined

  let clampFoceInfotagremoved = true

  /**
   * @description: 瀑布图框选结果
   */  
  const clampForceResult = ref<{ begin: number, end: number }>()
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

    if (toolTip.options.lock) toolTip.options.lock = false
    if (zoomTrans.options.lock) zoomTrans.options.lock = false
    if (measureTool.options.lock) measureTool.options.lock = false

    const fence = fallScene.value!.fence as LayersFenceType

    let item
    if (!props.singleMode) {
      for (let i = 0, len = afterStaticData.value.length; i < len; i++) {
        item = afterStaticData.value[i]

        inputDataBuffer.data.unshift(item)

        // 如果瀑布图储存有限制且超过存量限制，出栈
        if (!props.infiniteFall && inputDataBuffer.data.length > inputDataBuffer.toltalRow) inputDataBuffer.data.pop()

        setZoomOneFallvertexColor(item.data, fence, inputDataBuffer.data)
      }

    } else {
      // 一次性次输入数据
      const len = afterStaticData.value.length, dataBuffer: Array<ISpectrumScanInputData> = []
      zoomOneFallvertexColor.fill(Shader.BACKGROUND_COLOR)
      for (let i = 0; i < len; i++) {
        item = afterStaticData.value[i]

        dataBuffer.unshift(item)

        setZoomOneFallvertexColor(item.data, fence, dataBuffer)
      }

      inputDataBuffer.data = dataBuffer
      // 计算局部数据占全局数据比例
      if (btnValues.fallZoom && clampForce && clampForce.allThreshold && clampForce.allThreshold.range && len > 0) {
        const end = 1 - (afterStaticData.value[len - 1].endIndex! + 1) / clampForce.allThreshold.range.toltalCount!
        const begin = 1 - (afterStaticData.value[0].startIndex! + 1) / clampForce.allThreshold.range.toltalCount!
        clampForce.setProportion(begin, end)
      }
    }
    
    render()
  }
  /**
   * @description: 无缩放时顶点颜色数据构造
   * @param {Float32Array} data 原始一行数据
   * @param {LayersFenceType} fence fence
   * @return {*}
   */  
  function setZoomOneFallvertexColor(data: Float32Array, fence: LayersFenceType, buffer: Array<ISpectrumScanInputData>) {
    if (inputDataBuffer.maxRow === 0) return
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
        const minRow = inputDataBuffer.data[max]
        const maxRow = inputDataBuffer.data[min]

        if (back) clampForceResult.value = { end: maxRow.endIndex!, begin: minRow.startIndex! }

        result.set('0', {
          info: `结束时间：${Helper.ZDate.dateFormat(new Date(maxRow.time), 'hh:ss:mm.MI')}`
        })

        result.set('1', {
          info: `开始时间：${Helper.ZDate.dateFormat(new Date(minRow.time), 'hh:ss:mm.MI')}`
        })

        if (clampForce.allThreshold?.range?.zoom !== undefined) {
          result.set('2', {
            info: `时域缩放倍率：X ${clampForce.allThreshold?.range?.zoom}`
          })
        }
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

      // 帧索引计算
      const range = clampForce.allThreshold.range
      if (range.toltalCount === undefined) throw new Error('请配置toltalCount')
      let minIndex = Math.floor((1 - bottom) * range.toltalCount)
      if (minIndex >= range.toltalCount) minIndex -= 1
      let maxIndex = Math.floor((1 - top) * range.toltalCount)
      if (maxIndex >= range.toltalCount) maxIndex -= 1

      if (back) clampForceResult.value = { end: maxIndex, begin: minIndex }

      // 时间范围毫秒
      const minTime = range.beginTime + Math.floor((1 - bottom) * range.toltalTime)
      const maxTime = range.beginTime + Math.floor((1 - top) * range.toltalTime)

      const result = new Map<string, { info: string }>()

      result.set('0', {
        info: `结束时间：${Helper.ZDate.dateFormat(new Date(maxTime), 'hh:ss:mm.MI')}`
      })

      result.set('1', {
        info: `开始时间：${Helper.ZDate.dateFormat(new Date(minTime), 'hh:ss:mm.MI')}`
      })

      if (range.zoom !== undefined) {
        result.set('2', {
          info: `时域缩放倍率：X ${range.zoom}`
        })
      }

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
      fallScene.value.renderCtx.options.backgroundColor = UseTheme.theme.nl.backgroundColor

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

        if (dom.clientHeight !== inputDataBuffer.maxRow) {
          refreshByContainerChange()
        }

        render()
      })

      // 游离显示信息
      const toolTipOptions: IToolTipOptions = {
        type: ToolTip.CROSS,
        infoTag: {
          width: 270,
          height: 96
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
            translation: {
              show: true,
              advance: {
                title: '瀑布图后退'
              },
              retreat: {
                title: '瀑布图前进'
              }
            },
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

          clampForce.afterTranslation.set('fall', (key) => {
            if (inputDataBuffer.data.length > 0 && clampForce?.allThreshold?.range) {
              const range = clampForce?.allThreshold?.range
              const zoom = range.zoom ?? 1
              // 默认前进或者后退1/4
              const count = Math.floor(fallScene.value!.canvas.clientHeight / 4 * zoom)
              const beginRow = inputDataBuffer.data[inputDataBuffer.data.length - 1]
              const endRow = inputDataBuffer.data[0]
              let beginIndex = beginRow.startIndex!
              let endIndex = endRow.endIndex!
              if (key === ClampForce.advance) { // 瀑布图后退
                beginIndex -= count
                endIndex -= count
              } else { // 瀑布图前进
                beginIndex += count
                endIndex += count
              }

              if (range.toltalCount === undefined) throw new Error('请配置clampForce.allThreshold.range.toltalCount')

              if (beginIndex < 0) beginIndex = 0
              if (beginIndex > range.toltalCount - 1) beginIndex = range.toltalCount - 1
              if (endIndex < 0) endIndex = 0
              if (endIndex > range.toltalCount - 1) endIndex = range.toltalCount - 1
              if (endIndex < beginIndex) endIndex = beginIndex

              clampForceResult.value = { end: endIndex, begin: beginIndex }
            }
          })

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

  watch(inputDataLength, (len) => {
    inputDataBuffer.oneRowLength = len

    // 清空缓存区
    resetFall()
  })

  watch(afterStaticData, watchInputData)

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

      if (btnValues.fallZoom !== undefined) btnValues.fallZoom = false

      if (clampForce) {
        clampForce.sectionThreshold!.threshold.setContent(new Map())
      }
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
        // 时间
        result.set('时间', {
          info: '时间：' + Helper.ZDate.dateFormat(new Date(whichRowData.value.time), 'hh:ss:mm.MI')
        })
        if (range !== Shader.BACKGROUND_COLOR) {
          // 幅度
          result.set('幅度', {
            info: props.scaleY.parse(range)
          })
        }
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

          const dsTime = Math.abs(dataY1.time - dataY2.time)
          dsTimeInfo = `时差：${dsTime}毫秒`

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