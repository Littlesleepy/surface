<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 17:17:42
 * @Description: 绘制数字荧光谱
 * 
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { Engine, IMeshInputOptions, IPositionResult, isWebGl, LayersFence, LayersFenceType, Matrix4, Mesh, Program, Scene, Shader, ToolTip, WebGl, ZoomTrans } from '../core'
import ZXIAxisY from '../ZXIAxisY/index.vue'
import ZXIAxisX from '../ZXIAxisX'
import { IAxisYValue } from '..'
import { ESwitchState, IAxisXValue } from '../types'
import { IDPXParams, IDpxPool, IDpxIputData } from './type'
import { Device } from '../helper/device'
import { UseTheme } from '../styles'
import { useGlGrid } from '../ZXISpectrumAndFall/useGlGrid'

interface IZXIDpxProps {
  inputData: IDpxIputData
  params: IDPXParams
  switchLever: ESwitchState
  name?: string
}

const props = withDefaults(defineProps<IZXIDpxProps>(), {
  inputData: () => {
    return { data: new Uint8Array(), indexs: new Float32Array() }
  },
  params: () => {
    return {
      begin: 0,
      end: 0,
      bandwidth: 0,
      fftpoints: 0
    }
  },
  switchLever: ESwitchState.off,
  name: '数字荧光谱'
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IDpxPool>): void
}>()

const root = ref<HTMLDivElement>()

const spectrumDom = ref<HTMLDivElement>()

const scene = ref<Scene<IDpxPool>>()

let program: Program

const cR = new Float32Array(256)

const cG = new Float32Array(256)

const cB = new Float32Array(256)

const clrStep = 255.0 / 256.0
for (let k = 0; k < 256; k++) {
  cR[k] = Math.ceil(k * clrStep)
  cG[k] = Math.ceil((k > 256 / 2) ? ((256 - k) * clrStep * 2) : (k * clrStep * 2))
  cB[k] = Math.ceil((256 - k) * clrStep / 3 * 2)
}

/**
 * @description: 柱状网格
 */  
let rectangle: {
  mesh: Mesh
  a_position: Float32Array
  a_color: Array<number> | Float32Array
  u_scale: [number, number]
  initScale: [number, number]
}

let lineProgram: Program

let line: {
  mesh: Mesh
  a_positionX: Float32Array
  a_positionY: Float32Array
  u_color: Array<number> | Float32Array
  u_conversion: Matrix4
}

const u_min_range = [0, 0]

let fenceCount = 0

let sceneHeight = 0

let zoomTrans: ZoomTrans

let toolTip: ToolTip

const toolTipPosition = ref<IPositionResult>()

const spectrumYvalue = ref({
  min: 0,
  max: 0
})

const spectrumXvalue = ref({
  min: 0,
  max: 0
})

const defaultValueX = computed(() => {
  return { 
    min: props.params.begin,
    max: props.params.end
  }
})

const step = computed(() => {
  const realWidth = Device.getSamplingRateByBandwidth(props.params.bandwidth * 1000) / 1000 // MHz
  const step = realWidth / props.params.fftpoints
  return step
})

const inputDataLength = computed(() => {
  const counts = props.params.bandwidth * 1000000 / (step.value * 1000000 ) + 1
  return counts
})

function axisYCahnge (obj: IAxisYValue) {
  spectrumYvalue.value = obj

  u_min_range[0] = spectrumYvalue.value.min
  u_min_range[1] = spectrumYvalue.value.max - spectrumYvalue.value.min
}

function axisXCahnge (obj: IAxisXValue) {
  spectrumXvalue.value = obj
}
/**
 * @description: 横向绘制数量变化引起刷新
 */    
function refreshByFenceCountchange () {
  if (scene.value) {
    const fence = scene.value.fence! as LayersFenceType
  
    const baseFence = fence.baseFence
    const drawCount = baseFence.count
    rectangle.mesh.options.drawArrays.count = 160 * drawCount 

    rectangle.a_position = createVertexPosition(fence, 160)
    rectangle.a_color = new Float32Array(160 * drawCount)

    // scale横向初始化
    rectangle.initScale[0] = scene.value.canvas.clientWidth / drawCount
    // rectangle.initScale[1] = scene.value.canvas.clientHeight / 160

    rectangle.mesh.setData('a_position', rectangle.a_position)

    rectangle.mesh.setData('a_color', rectangle.a_color)
    // 线条
    line.a_positionY = new Float32Array(drawCount)
    line.mesh.options.drawArrays.count = drawCount

    line.a_positionX = baseFence.piecesInitial

    line.mesh.setData('a_positionX', line.a_positionX)
    line.mesh.setData('a_positionY', line.a_positionY)
  }
}

function render () {
  if (scene.value) {
    if (props.inputData.data.length > 0) {
      const fence = scene.value.fence as LayersFenceType

      // X轴方向缩放平移
      if (fence.currentZoom === 1 || (fence.currentZoom !== 1 && Math.log(fence.currentZoom) / Math.log(2) < fence.layers.length)) { // 无宽度缩放并且数据抽取结果唯一
        // 顶点控制
        rectangle.u_scale[0] = rectangle.initScale[0]
      } else {
        const zoomX = fence.baseFence.eachPieceWidth / fence.baseFence.eachPieceWidthInitial
        rectangle.u_scale[0] = rectangle.initScale[0] * zoomX
      }
      // Y轴方向缩放平移
      const minValue = spectrumYvalue.value.min + 40
      const maxValue = spectrumYvalue.value.max + 40

      const zoomY = 160 / (maxValue - minValue)
      fence.baseFence.modelMatrix.elements[5] = zoomY
      rectangle.u_scale[1] = rectangle.initScale[1] * zoomY
      const transY = (40 - Math.floor((minValue + maxValue - 80) / 2)) / 80 * zoomY
      fence.baseFence.modelMatrix.elements[13] = transY

      line.u_conversion.elements[0] = fence.baseFence.modelMatrix.elements[0]
      line.u_conversion.elements[12] = fence.baseFence.modelMatrix.elements[12]

      rectangle.mesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)
    }

    scene.value.render3D()
  }
}

/**
 * @description: 数据处理
 */ 
function dataProcessing () {
  if (scene.value && props.inputData.data.length > 0) {
    if (zoomTrans.options.lock === true) zoomTrans.options.lock = false

    if (toolTip.options.lock === true) toolTip.options.lock = false

    const fence = scene.value.fence as LayersFenceType
    const input = props.inputData.data, indexs = props.inputData.indexs

    let t1, t2, ta, r1, g1, b1, r2, g2, b2, ra, ga, ba, fenceIndex, index, start, end, startUsefulIndex, columnOld, columnNew,
      startRow, endRow, startDraw, j, row, rowIndex, maxRow, currentValue
      
    const section = fence.currenSection, minValue = spectrumYvalue.value.min + 40,
      maxValue = spectrumYvalue.value.max + 40, cutDataIndexArr = fence.setCutDataIndexArr(),
      a_color = rectangle.a_color, startCut = fence.cutDataStartIndex, a_positionY = line.a_positionY,
      minIndex = fence.baseFence.visibleIndex.min

    a_color.fill(0)

    // 计算开始第一个数据索引
    startUsefulIndex = 0
    // 列
    columnOld = 0
    for (let i = 0, len = fence.baseFence.visibleLength; i < len; i++) {
      // 默认取每个section得第一列
      columnNew = startCut + i * section
      fenceIndex = i + minIndex
      cutDataIndexArr[fenceIndex] = columnNew

      index = columnNew * 2
      startRow = indexs[index]
      endRow = indexs[index + 1]

      startDraw = fenceIndex * 160 + startRow

      // 计算使用数据的开始索引
      for (j = columnOld; j < columnNew; j++) {
        index = j * 2
        start = indexs[index]
        end = indexs[index + 1]

        if (start > -1 && end > -1) {
          startUsefulIndex += end - start + 1
        }
      }

      columnOld = columnNew

      if (startRow > -1 && endRow > -1) {
        // 行
        for (row = startRow, maxRow = endRow + 1; row < maxRow; row++) {
          rowIndex = row - startRow
          currentValue = input[startUsefulIndex + rowIndex]

          if (currentValue !== 0) {
            if (row >= minValue && row <= maxValue) {
              if (row === 40) {
                t1 = input[startUsefulIndex + rowIndex - 1]
                t2 = input[startUsefulIndex + rowIndex + 1]
                ta = Math.ceil((t1 + t2) / 2)
                r1 = cR[t1]
                g1 = cG[t1]
                b1 = cB[t1]
                r2 = cR[t2]
                g2 = cG[t2]
                b2 = cB[t2]
                ra = cR[ta]
                ga = cG[ta]
                ba = cB[ta]
                if (ra > ga && ra > ba) {
                  ra = Math.max(r1, r2)
                } else if (ga > ra && ga > ba) {
                  ga = Math.max(g1, g2)
                } else if (ba > ra && ba > ga) {
                  ba = Math.max(b1, b2)
                }
                // 数字编码
                ra *= 1000000
                ga *= 1000
                currentValue = ra + ga + ba
              }
              a_color[startDraw] = currentValue
            }
          }
          startDraw++
        }
      }

      a_positionY[fenceIndex] = endRow - 39
    }
  }
}  

/**
 * @description: 构造坐标顶点
 */    
function createVertexPosition (fence: LayersFenceType, row: number) {
  let i, x, j, index
  const drawLength = fence.baseFence.count, len = drawLength * row,
    vertexPosition = new Float32Array(len * 2), piecesInitial = fence.baseFence.piecesInitial
  const dh = 1 / row
  index = 0
  // 先算好每一行的上下边界坐标
  const rowH = new Float32Array(row)
  for (i = 0; i < row; i++) {
    rowH[i] = -1 + dh * (2 * i + 1)
  }
  for (i = 0; i < drawLength; i++) { // drawLength列
    x = piecesInitial[i]
    for (j = 0; j < row; j++) { // row行
      // 顶点
      vertexPosition[index] = x
      vertexPosition[index + 1] = rowH[j]
      index += 2
    }
  }
  return vertexPosition
}

/** 
 * @description: 创建着色器程序
 */  
function createShaderSource () {
  if (scene.value) {
    const v = UseTheme.theme.nl.backgroundColor
    const r = v[0], g = v[1], b = v[2]

    const vertexSource = `
      precision lowp float;
      attribute vec2 a_position;
      attribute float a_color;
      uniform vec2 u_scale;
      uniform mat4 u_conversion;
      varying vec4 v_color;
      void main() {
        if (u_scale.x > u_scale.y) {
          gl_PointSize = u_scale.x;
        } else {
          gl_PointSize = u_scale.y;
        }
        gl_Position = u_conversion * vec4(a_position, 0.0, 1.0);
        float r = float(${r});
        float g = float(${g});
        float b = float(${b});
        if (a_color != 0.0) {
          if (a_color > 1000.0) {
            r = a_color / 1000000.0 / 255.0;
            g = mod(a_color / 1000.0, 1000.0) / 255.0;
            b = mod(a_color, 1000.0) / 255.0;
          } else {
            r = a_color * 0.99609375 / 255.0;
            g = (a_color > 128.0 ? (256.0 - a_color) * 1.9921875 : a_color * 1.9921875) / 255.0;
            b = (256.0 - a_color) * 0.6640625 / 255.0;
          }
          v_color = vec4(r, g, b, 1.0);
        } else {
          v_color = v_color = vec4(r, g, b, 0.0);
        }
      }`
    const fragmentSource = `
      precision lowp float;
      varying vec4 v_color;
      uniform vec2 u_scale;
      void main () {
        float d;
        if (u_scale.x > u_scale.y) {
          d = u_scale.y / u_scale.x / 2.0;
          if (gl_PointCoord.y >= 0.5 - d && gl_PointCoord.y <= 0.5 + d) {
            gl_FragColor = v_color;
          } else {
            discard;
          }
        } else {
          d = u_scale.x / u_scale.y / 2.0;
          if (gl_PointCoord.x >= 0.5 - d && gl_PointCoord.x <= 0.5 + d) {
            gl_FragColor = v_color;
          } else {
            discard;
          }
        }
      } `
      
    const vertexShader = new Shader(scene.value, Shader.VERTEX_SHADER, vertexSource)
    const fragmentShader = new Shader(scene.value, Shader.FRAGMENT_SHADER, fragmentSource)
    
    program = new Program(vertexShader, fragmentShader)

    scene.value.addProgram(program)
  }
}

// 背景网格
const {
  setGridProgram,
  spectrumAxisX,
  spectrumAxisY,
  setLineColor
} = useGlGrid(render)

watch(inputDataLength, () => {
  if (scene.value) {
    const fence = scene.value.fence as LayersFenceType

    fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)

    if (scene.value) scene.value.renderCtx.clearScreen()
  }
})

watch([() => props.inputData, spectrumYvalue], () => {
  dataProcessing()
  // 绘制
  render()
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    if (scene.value && isWebGl(scene.value.renderCtx)) {
      scene.value.renderCtx.clearScreen()

      zoomTrans.options.lock = true
      toolTip.options.lock = true
    }
  }
})

// 游离信息显示
watchEffect(() => {
  if (toolTipPosition.value !== undefined && scene.value) {
    const result: Map<string, { info: string }> = new Map()

    const fence = scene.value.fence as LayersFenceType
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value.offsetMiddlePCTX)
    // 幅度
    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min
    let range = (1 - toolTipPosition.value.offsetMiddlePCTY) * rangeY + spectrumYvalue.value.min

    result.set('0', { info: '幅度：' + range.toFixed(1) + ' dBuV|' + (range - 107).toFixed(1) + ' dBm' })
    // 频率
    const frequency = parseFloat((defaultValueX.value.min + dataIndex * step.value).toFixed(9))

    result.set('1', {
      info: '频率：' + parseFloat(frequency.toFixed(9)) + ' MHz|' + parseFloat((frequency * 1000).toFixed(6)) + ' kHz'
    })

    toolTip.setContent(result)
  }
})

let themeKey

onMounted(() => {
  if (spectrumDom.value) {
    const engine = new Engine(spectrumDom.value)

    const ctx = new WebGl(engine.canvas, {
      backgroundColor: UseTheme.theme.nl.backgroundColor
    })

    scene.value = new Scene<IDpxPool>(engine, ctx)

    // 主题注册
    themeKey = UseTheme.on(() => {
      if (scene.value) {
        ctx.options.backgroundColor = UseTheme.theme.nl.backgroundColor

        // 背景网格颜色
        setLineColor()

        scene.value.removeProgram(program.id)
        createShaderSource()
        program.add(rectangle.mesh)

        line.u_color = UseTheme.theme.Dpx.lineColor
        line.mesh
          .setData('u_color', line.u_color)

        render()
      }
    })

    const fence = LayersFence.create(scene.value)

    fence.afterZoomOrTrans.add(() => {
      dataProcessing()
      render()
    })

    zoomTrans = new ZoomTrans(scene.value)

    // 游离显示信息
    toolTip = new ToolTip(scene.value, {
      type: ToolTip.CROSS,
      infoTag: {
        width: 420,
        height: 56
      }
    })

    toolTip.afterTrigger.set('spectrum', (p: IPositionResult) => {
      toolTipPosition.value = p
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
      if (scene.value) {
        scene.value.removeProgram(lineProgram.id)
        render()
      }
    })

    toolTip.afterActive.set('spectrum', () => {
      if (scene.value) {
        scene.value.addProgram(lineProgram)
        render()
      }
    })

    // 绘制背景线条网格
    setGridProgram(scene.value)

    createShaderSource()

    const rectangleOptions: IMeshInputOptions = {
      drawArrays: {
        mode: Mesh.POINTS,
        count: 0
      }
    }
    rectangle = {
      mesh: new Mesh(scene.value, rectangleOptions),
      a_position: new Float32Array(),
      a_color: new Float32Array(),
      u_scale: [0, 0],
      initScale: [0, 0]
    }

    rectangle.mesh
      .setData('u_scale', rectangle.u_scale)

    program.add(rectangle.mesh)


    // 绘制连续折线
    const lineVertexSorce = `
      precision mediump float;
      attribute float a_positionX;
      attribute float a_positionY;
      uniform vec2 u_min_range;
      uniform mat4 u_conversion;
      void main() {
        float h = (a_positionY - u_min_range.x) / u_min_range.y;
        float y = 2.0 * h - 1.0;

        gl_Position = u_conversion * vec4(a_positionX, y, 0.0, 1.0);
      }
      `
    const lineFragmentSource = `
      precision mediump float;
      uniform vec3 u_color;
      void main () {
        gl_FragColor = vec4(u_color, 1.0);
      } `
    const lineVertexShader = new Shader(scene.value, Shader.VERTEX_SHADER, lineVertexSorce)
    const lineFragmentShader = new Shader(scene.value, Shader.FRAGMENT_SHADER, lineFragmentSource)
    
    lineProgram = new Program(lineVertexShader, lineFragmentShader)

    const lineOptions = {
      drawArrays: {
        mode: Mesh.LINE_STRIP,
        count: 0
      }
    }

    line = {
      mesh: new Mesh(scene.value, lineOptions),
      a_positionX: new Float32Array(),
      a_positionY: new Float32Array(),
      u_color: UseTheme.theme.Dpx.lineColor,
      u_conversion: new Matrix4()
    }

    line.mesh
      .setData('u_min_range', u_min_range)
      .setData('u_conversion', line.u_conversion.elements)
      .setData('u_color', line.u_color)

    lineProgram.add(line.mesh)

    fence.afterRefresh.add(() => {
      const fence = scene.value!.fence as LayersFenceType
      // fenceCount数量变化导致坐标集变化
      if (fenceCount !== fence.baseFence.count) {
        fenceCount = fence.baseFence.count
        refreshByFenceCountchange()
      }

      dataProcessing()
    })

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (scene.value) {
        const fence = scene.value.fence! as LayersFenceType

        if (scene.value.canvas.clientWidth !== fence!.expectCount) {
          // 刷新
          if (scene.value.canvas.clientWidth === 0) return
          rectangle.initScale[0] = scene.value.canvas.clientWidth / fence.baseFence.count

          fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
        }

        if (scene.value.canvas.clientHeight !== sceneHeight) {
          sceneHeight = scene.value.canvas.clientHeight
          rectangle.initScale[1] = scene.value.canvas.clientHeight / 160
        }

        render()
      }
    })
    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      toolTip,
      toolTipPosition,
      spectrumYvalue,
      spectrumXvalue
    })

    emit('scene', scene.value)
  }
})

onBeforeUnmount(() => {
  if (scene.value) {
    UseTheme.off(themeKey)

    scene.value.dispose()
  }
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="dpx-image-container">
      <!-- 头部 -->
      <div class="header">
        <p v-if="name">{{name}}</p>
        <div class="slot">
          <slot />
        </div>
      </div>
      <!-- 第二行 -->
      <div class="second-row">
        <!-- Y轴 -->
        <ZXIAxisY
          class="axis-y"
          :scene="scene"
          :defaultValue="{ max: 80, min: -30 }"
          ref="spectrumAxisY"
          @change="axisYCahnge" />
        <div class="second-column">
          <!-- 场景 -->
          <div class="canvas-father">
            <div class="mount" ref="spectrumDom" />
          </div>
          <!-- X轴 -->
          <ZXIAxisX
            class="axis-x"
            ref="spectrumAxisX"
            :scene="scene"
            :defaultValue="defaultValueX"
            :step="step"
            @change="axisXCahnge" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.dpx-image-container{
  width: 100%;
  height: 100%;
  flex: auto;
  display: flex;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .header{
    width: 100%;
    font-size: @font20;
    color: v-bind('UseTheme.theme.var.color');
    box-sizing: border-box;
    display: flex;
    padding-bottom: 5px;
    align-items: center;
    .slot{
      flex: auto
    }
  }
  .second-row{
    flex: auto;
    display: flex;
    .axis-y{
      padding-top: 1px;
      box-sizing: border-box;
      padding-bottom: 33px;
    }
    .second-column{
      flex: auto;
      display: flex;
      flex-direction: column;
      .canvas-father{
        flex: auto;
        border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
        border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
        box-sizing: border-box;
        position: relative;
        .mount{
          width: 100%;
          height: 100%;
        }
      }
      .axis-x{
        box-sizing: border-box;
      }
    }
    
  }
}
</style>