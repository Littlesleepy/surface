<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-21 15:53:43
 * @Description: 电平图
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { Canvas, Engine, FluidFence, FluidFenceType, IFluidFenceOptions, IMeshInputOptions, IOffsetPosition, IPositionResult, Mesh, Program, Scene, Shader, Threshold, ToolTip, WebGl, ZoomTrans } from '../core'
import { EBtncontrolType, ESwitchState, IAxisYValue, IBtncontrols, IUnit } from '../types'
import { ELevelType, ILevelData, ILevelPool } from './type'
import * as Helper from '../helper'
import ZXIAxisY from '../ZXIAxisY/index.vue'
import ZXIAxisTimeX from '../ZXIAxisTimeX'
import { UseTheme } from '../styles'

interface IZXILevelProps {
  inputData: Map<string, ILevelData>
  switchLever: ESwitchState
  defaultValueY?: IAxisYValue
  drawType?: ELevelType
  lineColor?: Map<string, string>
  name?: string
  levelThreshold?: number 
  setTool?: Array<{ name: string, value: any }>
  deleteTool?: Array<string>
  addTool?: Array<{ btn: IBtncontrols, value: any  }>
  showAxisY?: boolean
  initialMaxMin?: { max: number, min: number }
  capacity?: number
  scaleY?: IUnit
}

const props = withDefaults(defineProps<IZXILevelProps>(), {
  inputData: () => new Map(),
  switchLever: ESwitchState.off,
  defaultValueY: () => {
    return { max: 140, min: -20 }
  },
  drawType: ELevelType.line,
  lineColor: () => new Map(),
  setTool: () => [],
  deleteTool: () => [],
  addTool: () => [],
  showAxisY: true,
  initialMaxMin: () => { return { max: 0, min: 0 } },
  capacity: 0.1,
  scaleY: () => {
    return {
      unit: 'dBuV',
      parse: (v: number) => {
        return `幅度：${v.toFixed(1)} dBuV|${(v - 107).toFixed(1)} dBm`
      },
      transform: (v: number) => {
        return parseFloat(v.toFixed(1))
      }
    }
  }
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<ILevelPool>): void
}>()

const root = ref<HTMLDivElement>()

const controls = ref<Array<IBtncontrols>>([{
  type: EBtncontrolType.switch,
  title: '电平门限',
  paramName: 'threshold'
}])

const defaultBtn = {
  threshold: false
}

// 设置默认工具值
props.setTool.forEach((x: { name: string, value: any }) => {
  // @ts-ignore
  defaultBtn[x.name] = x.value
})

props.deleteTool.forEach((x: any) => {
  controls.value.forEach((btn, i) => {
    if (x === btn.paramName) {
      controls.value.splice(i, 1)
      // @ts-ignore
      defaultBtn[x] = false
    }
  })
})

// 添加工具
props.addTool.forEach((x: any) => {
  controls.value.push(x.btn)
  // @ts-ignore
  defaultBtn[x.btn.paramName] = x.value
})

const btnValues = reactive<{
  threshold: boolean
}>(defaultBtn)

let legends: Array<{ backgroundColor: string, name: string }> = []

for (const [name, color] of props.lineColor) {
  legends.push({ backgroundColor: color, name })
}

const controlStyle = { wrapper: { width: '120px' } }
if (legends.length > 0) controlStyle.wrapper.width = '240px'

let showControlBtn = false
if (controls.value.length > 0 || legends.length > 0 || props.name) showControlBtn = true

const spectrumYvalue = ref({
  min: 0,
  max: 0
})

const buffer = ref(new Map<string, Array<ILevelData>>())

const spectrumDom = ref<HTMLDivElement>()

const scene = ref<Scene<ILevelPool>>()

let rectangleProgram: Program

let zoomTrans: ZoomTrans

/**
 * @description: 柱状网格
 */  
let rectangle: {
  mesh: Mesh
  a_position: Float32Array
  a_color: Array<number> | Float32Array
  samplingData: Float32Array
}

const u_min_range = [0, 0]

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<number>()

// 单门限
let singleThreshold: Threshold

const singleThresholdPosition = ref<Map<string, IPositionResult>>()

const singleThresholdValue = ref({ value: 0 })

let max = props.initialMaxMin.max, min = props.initialMaxMin.min
/**
 * @description: 设置最大值和最小值
 * @param {*} obj
 * @param {*} render
 */    
function setMaxMin (obj: IAxisYValue) {
  max = obj.max
  min = obj.min

  axisYChange({ max, min })
}

function axisYChange (obj: IAxisYValue, render = true) {
  spectrumYvalue.value = obj

  if (props.drawType === ELevelType.bar) {

    u_min_range[0] = spectrumYvalue.value.min
    u_min_range[1] = spectrumYvalue.value.max - spectrumYvalue.value.min

    changePositionByMinValue()

    if (render && scene.value && buffer.value.size > 0) {
      scene.value.render3D()
    }
  } else {
    if (buffer.value.size > 0) renderLine()
  }

  if (scene.value && singleThreshold) {
    const v = singleThresholdValue.value.value
    const position: IOffsetPosition = {
      offsetX: scene.value.canvas.clientWidth * 0.5,
      offsetY: (1 - (v - obj.min) / (obj.max - obj.min)) * scene.value.canvas.clientHeight
    }

    singleThreshold.setTagPosition(Threshold.BOTTOM, position)
  }
}

/**
 * @description: 柱状图间隔修改
 */  
function changeInterval () {
  let index, x, leftBorder, rightBorder
  const fence = scene.value!.fence! as FluidFenceType
  const w = fence.baseFence.eachPieceWidthInitial * 0.92
  const pieces = fence.baseFence.piecesInitial, rectangle_a_position = rectangle.a_position

  for (let i = 0, len = fence.baseFence.count; i < len; i++) {
    index = i * 12
    x = pieces[i]
    leftBorder = x - w
    rightBorder = x + w

    rectangle_a_position[index] = leftBorder
    rectangle_a_position[index + 4] = leftBorder
    rectangle_a_position[index + 8] = leftBorder

    rectangle_a_position[index + 2] = rightBorder
    rectangle_a_position[index + 6] = rightBorder
    rectangle_a_position[index + 10] = rightBorder
  }
}

/**
 * @description: 纵轴变化改变柱状图绘制坐标数据
 */
function changePositionByMinValue () {
  const minValue = spectrumYvalue.value.min
  let startIndex = 0

  if (scene.value) {
    const a_position = rectangle.a_position

    for (let i = 0, len = a_position.length; i < len; i++) {

      startIndex = i * 12
      a_position[startIndex + 1] = minValue
      a_position[startIndex + 3] = minValue
      a_position[startIndex + 7] = minValue
    }
  }
}

/**
 * @description: 如果当前fenceCount发生变化
 */  
function refreshByFenceCountchange () {
  const fence = scene.value!.fence! as FluidFenceType
  const baseFence = fence.baseFence
  const drawCount = baseFence.count

  for (const [, value] of buffer.value) {
    // 去除多余数据
    if (drawCount < value.length) {
      const dsCount = value.length - drawCount
      value.splice(0, dsCount)
    }
  }

  switch (props.drawType) {
  // 线条      
  case ELevelType.line: {

  }
    break
  // 柱状
  case ELevelType.bar: {
    let inputData: Array<ILevelData> | undefined
    for (const [, value] of buffer.value) {
      inputData = value
    }

    const samplingData = new Float32Array(drawCount).fill(Shader.BACKGROUND_COLOR)

    if (inputData) {
      // 手动改变最后一位数据索引
      fence.lastDataIndex = inputData.length - 1

      for (let i = 0, len = inputData.length; i < len; i++) {
        samplingData[i] = inputData[i].data
      }
    }

    rectangle.mesh.options.drawArrays.count = drawCount * 6
    rectangle.samplingData = samplingData

    rectangle.a_position = new Float32Array(drawCount * 2 * 6)
    rectangle.a_color = new Float32Array(drawCount * 6)

    changePositionByMinValue()

    changeInterval()

    rectangle.mesh.setData('a_position', rectangle.a_position)

    rectangle.mesh.setData('a_color', rectangle.a_color)
  }
    break
  }
}

function watchInputData (input: Map<string, ILevelData>) {
  if (scene.value) {
    if (zoomTrans.options.lock) zoomTrans.options.lock = false
    if (toolTip.options.lock) toolTip.options.lock = false

    const fence = scene.value.fence! as FluidFenceType
    // 数据缓存
    for (const [key, item] of input) {

      if (buffer.value.has(key)) {
        const level = buffer.value.get(key)!

        level.push(item)
        // 出栈
        if (level.length > fence.baseFence.count) level.shift()

      } else {
        buffer.value.set(key, [item])
      }
    }

    // 如果Y轴被隐藏，则计算最大值和最小值作为Y轴范围
    if (!props.showAxisY && input.size > 0) {
      for (const [, item] of input) {
        if (max < item.data) max = item.data
        if (min > item.data) min = item.data
      }

      const range = max - min
      
      if (max !== undefined && min !== undefined) axisYChange({ max: max + range * props.capacity, min }, false)
    }

    switch (props.drawType) {
    // 线条      
    case ELevelType.line: {
    
    }
      break
    // 柱状
    case ELevelType.bar: {
      if (buffer.value.size !== 1) throw new Error('props.inputData.size===1')

      let inputData = 0
      for (const [, item] of input) {
        inputData = item.data
      }
      
      if (fence.lastDataIndex === fence.baseFence.count - 1) {
        const copy = rectangle.samplingData.subarray(1)
        rectangle.samplingData.set(copy, 0)
        rectangle.samplingData[fence.lastDataIndex] = inputData
      } else {
        rectangle.samplingData[fence.lastDataIndex + 1] = inputData
      }

    }
      break
    }

    render()

    fence.transByDataLength(1)
  }
}

/**
 * @description: 电平线
 */    
function renderLine () {
  if (scene.value) {
    const baseFence = scene.value.fence!.baseFence
    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min, minValue = spectrumYvalue.value.min,
      height = scene.value.container.clientHeight, lineXvalues = baseFence.piecesTrans,
      renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx
    
    let fenceIndex, itemValueY, end, color

    renderCtx.clearScreen()
    for (const [key, item] of buffer.value) {
      end = item.length > baseFence.visibleIndex.max + 1 ? baseFence.visibleIndex.max + 1 : item.length
      if (end < baseFence.visibleIndex.min + 1) continue
      
      color = props.lineColor.get(key)
      if (color === undefined) color = UseTheme.theme.Level.lineColor

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()

      fenceIndex = baseFence.visibleIndex.min

      itemValueY = (1 - (item[fenceIndex].data - minValue) / rangeY) * height

      ctx.moveTo(lineXvalues[fenceIndex], itemValueY)

      for (fenceIndex++; fenceIndex < end; fenceIndex++) {
        itemValueY = (1 - (item[fenceIndex].data - minValue) / rangeY) * height
        ctx.lineTo(lineXvalues[fenceIndex], itemValueY)
      }

      ctx.stroke()
    }

    scene.value.render2D()
  }
}

function render () {
  if (scene.value && buffer.value.size > 0) {
    switch (props.drawType) {
    // 线条      
    case ELevelType.line: {
      renderLine()
    }
      break
    // 柱状
    case ELevelType.bar: {
      const fence = scene.value!.fence! as FluidFenceType
      // 柱状图
      const samplingData = rectangle.samplingData

      let currentValue = 0, startIndex = 0, colorIndex = 0
      const rectangle_a_position = rectangle.a_position, rectangle_a_color = rectangle.a_color

      for (let i = fence.baseFence.visibleIndex.min, len = fence.baseFence.visibleIndex.max; i <= len; i++) {
        startIndex = i * 12

        currentValue = samplingData[i]
        rectangle_a_position[startIndex + 5] = currentValue
        rectangle_a_position[startIndex + 9] = currentValue
        rectangle_a_position[startIndex + 11] = currentValue

        colorIndex = i * 6
        rectangle_a_color[colorIndex] = currentValue
        rectangle_a_color[colorIndex + 1] = currentValue
        rectangle_a_color[colorIndex + 2] = currentValue
        rectangle_a_color[colorIndex + 3] = currentValue
        rectangle_a_color[colorIndex + 4] = currentValue
        rectangle_a_color[colorIndex + 5] = currentValue
      }

      scene.value.render3D()
    }
      break
    }
  }
}

function resetSpectrum () {
  if (scene.value) {
    buffer.value.clear()

    const fence = scene.value.fence! as FluidFenceType
    const baseFence = fence.baseFence
    const drawCount = baseFence.count

    fence.lastDataIndex = -1
    // 靠左
    const distance = -1 - (baseFence.pieces[0] - baseFence.eachPieceWidth)
    fence.transByDistance(distance)

    switch (props.drawType) {
    // 线条      
    case ELevelType.line: {
      const renderCtx = scene.value.renderCtx as Canvas
      renderCtx.clearScreen()
    }
      break
    // 柱状
    case ELevelType.bar: {
      rectangle.samplingData = new Float32Array(drawCount).fill(Shader.BACKGROUND_COLOR)
    }
      break
    }
  }
}

/**
 * @description: 计算单门限
 */  
function getSingleThresholdValue (position: Map<string, IPositionResult>) {
  const bottom = position.get(Threshold.BOTTOM)!
  const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min
  const rangeBottom = parseFloat(((1 - bottom.offsetPCTY) * rangeY + spectrumYvalue.value.min).toFixed(0))

  return rangeBottom
}
/**
 * @description: 依据外部传入电平设置电平门限位置
 * @param {*} v 电平值
 */    
function setSingleThresholdPosition (v: number) {
  if (singleThreshold) {
    const tag = singleThreshold.tagManager.get(Threshold.BOTTOM)!
    const y = spectrumYvalue.value
    const position: IOffsetPosition = {
      offsetX: 0.5 * singleThreshold.container.clientWidth,
      offsetY: (1 - (v - y.min) / (y.max - y.min)) * singleThreshold.container.clientHeight + tag.instance.options.width / 2
    }

    return tag.instance.setPosition(position, scene.value?.fence)
  }
}

/** 
 * @description: 创建着色器程序
 */  
function createShaderSource () {
  if (scene.value && props.drawType === ELevelType.bar) {
    const v = UseTheme.theme.nl.backgroundColor
    const bgColor = `vec3(${v[0]}, ${v[1]}, ${v[2]})`
    const barColor =  UseTheme.theme.Level.barColor

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

    // 绘制矩形柱着色器
    const rectangleVertexSorce = `
      precision mediump float;
      attribute vec2 a_position;
      attribute float a_color;
      uniform vec2 u_min_range;
      uniform mat4 u_conversion;
      varying vec3 v_color;
      void main() {
        float h = (a_position.y - u_min_range.x) / u_min_range.y;
        float y = 2.0 * h - 1.0;

        gl_Position = u_conversion * vec4(a_position.x, y, 0.0, 1.0);

        if (a_color == ${Shader.BACKGROUND_COLOR}.0) {
          v_color = ${bgColor};
        } else {
          float color = (a_color - u_min_range.x) / u_min_range.y;
          ${str}
        }
      }
      `

    const rectangleFragmentSource = `
      precision mediump float;
      varying vec3 v_color;
      void main () {
        gl_FragColor = vec4(v_color, 1.0);
      } `
    
    const rectangleVertexShader = new Shader(scene.value, Shader.VERTEX_SHADER, rectangleVertexSorce)
    const rectangleFragmentShader = new Shader(scene.value, Shader.FRAGMENT_SHADER, rectangleFragmentSource)

    if (rectangleProgram) scene.value.removeProgram(rectangleProgram.id)
    
    rectangleProgram = new Program(rectangleVertexShader, rectangleFragmentShader)
    scene.value.addProgram(rectangleProgram)
  }
}

watch(() => props.inputData, watchInputData)

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true
    zoomTrans.options.lock = true

    max = props.initialMaxMin.max
    min = props.initialMaxMin.min
    
    resetSpectrum()
  }
})

watch(() => btnValues.threshold, (btn) => {
  if (btn) {
    singleThreshold.open()

    toolTip.close()
  } else {
    singleThreshold.close()
  }
})

watch(() => props.levelThreshold, (v) => {
  if (v !== undefined) setSingleThresholdPosition(v)
})

// 游离信息显示
watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value && buffer.value.size > 0) {
    const result: Map<string, { info: string, color?: string }> = new Map()
    const fence = scene.value.fence as FluidFenceType
    const baseFence = fence.baseFence
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value)
    
    // 窗口时长
    let endIndex = fence.lastDataIndex > baseFence.visibleIndex.max ? baseFence.visibleIndex.max : fence.lastDataIndex
    if (endIndex > baseFence.visibleIndex.min) {
      for (const [, item] of buffer.value) {
        const duration = item[endIndex].time.getTime() - item[baseFence.visibleIndex.min].time.getTime()
        result.set('timeLength', { info: `窗口时长：${Helper.ZDate.msFormat(duration, 'ss:mm:MI')}` })
        break
      }

      if (dataIndex <= endIndex) {
        // 时间
        for (const [, item] of buffer.value) {
          result.set('time', { info: `时间：${Helper.ZDate.dateFormat(item[dataIndex].time, 'hh:ss:mm:MI')}` })
          break
        }
        // 幅度
        if (buffer.value.size === 1) {
          for (const [, item] of buffer.value) {
            const range = item[dataIndex].data
            result.set('dbuv', { info: props.scaleY.parse(range) })
          }
        } else {
          for (const [key, item] of buffer.value) {
            const range = item[dataIndex].data
            const color = props.lineColor.get(key)
            if (color === undefined) throw new Error('请配置props.lineColor')

            result.set(key, {
              info: `${key}：${props.scaleY.parse(range)}`,
              color
            })
          }
        }
      }
    }

    const tags = new Map()
    for (const [key, item] of buffer.value) {
      const data = item[dataIndex]
      const color = buffer.value.size === 1 ? 'rgb(255, 0, 157)' : props.lineColor.get(key)!

      if (data) {
        tags.set(key, {
          value: 1 - (data.data - spectrumYvalue.value.min) / (spectrumYvalue.value.max - spectrumYvalue.value.min),
          backgroundColor: color
        })
      }
    }

    toolTip.setValueTags(tags)

    toolTip.setContent(result)
  }
})

// 单门限
watchEffect(() => {
  if (singleThresholdPosition.value && scene.value) {
    const result: Map<string, { info: string }> = new Map()
    const r = getSingleThresholdValue(singleThresholdPosition.value)
    result.set('0', {
      info: `幅度：${r}dBuV`
    })

    singleThreshold.setContent(result)
  }
})

let themeKey

onMounted(() => {
  if (spectrumDom.value) {
    let fenceOptions: IFluidFenceOptions = {}, ctx: WebGl | Canvas
    const engine = new Engine(spectrumDom.value)

    if (props.drawType === ELevelType.bar) {
      ctx = new WebGl(engine.canvas, { backgroundColor: UseTheme.theme.nl.backgroundColor })
    } else {
      ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })
    }

    scene.value = new Scene(engine, ctx)

    // 主题注册
    themeKey = UseTheme.on(() => {
      const bgColor = props.drawType === ELevelType.bar ? UseTheme.theme.nl.backgroundColor : UseTheme.theme.rgb.backgroundColor
      ctx.options.backgroundColor = bgColor

      createShaderSource()

      if (props.drawType === ELevelType.bar) rectangleProgram.add(rectangle.mesh)

      render()
    })

    if (props.drawType === ELevelType.line) fenceOptions.coordinateTrans = scene.value.canvas
    const fence = FluidFence.create(scene.value, fenceOptions)

    fence.afterRefresh.add(() => {
      refreshByFenceCountchange()
    })

    fence.afterZoomOrTrans.add(() => {
      render()
    })

    fence.afterZoom.add(() => {
    })

    zoomTrans = new ZoomTrans(scene.value)

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (spectrumDom.value && spectrumDom.value.clientWidth !== scene.value!.fence!.expectCount) {
        // 刷新
        if (scene.value) {
          if (scene.value.canvas.clientWidth === 0) return
          const fence = scene.value.fence! as FluidFenceType
    
          fence.refresh(scene.value.canvas.clientWidth, scene.value.canvas.clientWidth)
        }
      }

      render()
    })

    if (props.drawType === ELevelType.bar) {
      createShaderSource()

      const rectangleOptions: IMeshInputOptions = {
        drawArrays: {
          mode: Mesh.TRIANGLES,
          count: 0
        }
      }
      rectangle = {
        mesh: new Mesh(scene.value, rectangleOptions),
        a_position: new Float32Array(),
        a_color: new Float32Array(),
        samplingData: new Float32Array()
      }

      rectangle.mesh
        .setData('u_min_range', u_min_range)
        .setData('u_conversion', scene.value.fence!.baseFence.modelMatrix.elements)

      rectangleProgram.add(rectangle.mesh)
    }

    // 游离显示信息
    let infoHeight = 0
    if (props.drawType === ELevelType.bar) {
      infoHeight = 76
    } else {
      infoHeight = props.lineColor.size === 0 ? 76 : props.lineColor.size * 20 + 56
    }

    toolTip = new ToolTip(scene.value, {
      type: ToolTip.VERTICAL,
      infoTag: {
        width: 220,
        height: infoHeight
      }
    })

    toolTip.afterTrigger.set('spectrum', (p: IPositionResult) => {
      toolTipPosition.value = p.offsetMiddlePCTX
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('spectrum', () => {
      disableToolTipInfo = true
    })

    // 单门限
    singleThreshold = new Threshold(scene.value.container, {
      centerTag: { type: Threshold.BOTTOM_TO_TOP },
      infoTag: {
        width: 130
      },
      showTags: new Map([[
        Threshold.BOTTOM,
        {
          backgroundColor: UseTheme.theme.var.tagBgColor,
          selectColor: UseTheme.theme.var.tagSelectColor,
          offset: 0.7
        }
      ]]),
      scene: scene.value
    })

    singleThreshold.afterTrigger.set('spectrum', (position) => {
      singleThresholdPosition.value = new Map(position)
    })

    singleThreshold.afterClose.set('spectrum', () => {
      singleThresholdPosition.value = undefined

      singleThresholdValue.value = { value: spectrumYvalue.value.min }

      if (btnValues.threshold) btnValues.threshold = false
    })

    singleThreshold.afterEnd.set('spectrum', (position) => {
      const r = getSingleThresholdValue(position)

      singleThresholdValue.value = { value: r }
    })

    singleThreshold.afterOpen.set('spectrum', (position) => {
      if (props.levelThreshold !== undefined) {
        const position = setSingleThresholdPosition(props.levelThreshold)!
        const result = new Map([[Threshold.BOTTOM, position]])

        singleThresholdPosition.value = result

        const r = getSingleThresholdValue(result)

        singleThresholdValue.value = { value: r }
      } else {
        singleThresholdPosition.value = new Map(position)

        const r = getSingleThresholdValue(position)

        singleThresholdValue.value = { value: r }
      }
    })

    if (btnValues.threshold) singleThreshold.open()

    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      spectrumYvalue,
      buffer,
      singleThreshold,
      singleThresholdPosition,
      singleThresholdValue,
      toolTip,
      toolTipPosition,
      btnValues
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  UseTheme.off(themeKey)
})

defineExpose({
  root,
  setMaxMin
})

</script>

<template>
  <div ref="root">
    <div class="container">
      <!-- 头部 -->
      <div class="header" v-if="showControlBtn">
        <!-- 工具部分 -->
        <ZXIControlBtn
          class="single-control"
          v-if="controls.length > 0 || legends.length > 0"
          :controls="controls"
          :btnValues="btnValues"
          :controlStyle="controlStyle" >
          <el-tooltip v-for="(legend, index) in legends" :key="index" effect="dark" :content="legend.name" placement="right" >
            <div class="legend">
              <span :style="{ backgroundColor: legend.backgroundColor }" />
              <p>{{ legend.name }}</p>
            </div>
          </el-tooltip>
        </ZXIControlBtn>
        <div class="header-info">
          <span v-if="name !== undefined">{{name}}</span>
        </div>
      </div>
      <!-- 频谱 -->
      <div class="spectrum">
        <!-- Y轴 -->
        <ZXIAxisY
          class="axis-y"
          v-if="showAxisY"
          :scale="scaleY"
          :scene="scene"
          :defaultValue="defaultValueY"
          :color="{ open: false }"
          @change="axisYChange" />
          <!-- 第二列 -->
        <div class="second-column"> 
          <div class="draw-container">
            <div class="mount" ref="spectrumDom" />
          </div>
          <!-- X轴 -->
          <ZXIAxisTimeX
            class="axis-x"
            :timeBuffer="buffer"
            :scene="scene" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    height: @headerHeight;
    position: relative;
    .single-control{
      width: @headerHeight;
      height: 100%;
      position: absolute;
      left: 10px;
      top: 1px;
      z-index: 2;
    }
    .header-info{
      width: 100%;
      padding-left: 35px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      span{
        line-height: @headerHeight;
        font-size: 12px;
        color: v-bind('UseTheme.theme.var.color');
      }
    }
    .legend{
      width: 100%;
      padding-top: 5px;
      display: flex;
      line-height: 14px;
      span{
        width: 60px;
        height: 5px;
        margin: auto 0;
      }
      p{
        flex: 1;
        padding-left: 5px;
        width: 0;
        .textOverflow();
        font-size: 12px;
      }
    }
  }
  .spectrum{
    flex: auto;
    display: flex;
    padding-bottom: 5px;
    box-sizing: border-box;
    .axis-y{
      padding-top: 1px;
      box-sizing: border-box;
      padding-bottom: 28px;
    }
    .second-column{
      flex: auto;
      display: flex;
      flex-direction: column;
      .draw-container{
        flex: auto;
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        position: relative;
        .mount{
          width: 100%;
          height: 100%;
          .tool{
            position: absolute;
            width: 100%;
            height: 100%;
            // pointer-events: none;
          }
          .frequency-division{
            top: auto;
            bottom: 0;
            height: auto;
            z-index: 0;
          }
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
  }
}
</style>