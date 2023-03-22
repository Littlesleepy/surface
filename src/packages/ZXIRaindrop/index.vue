<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 13:51:15
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIRaindrop\index.vue
 * @Description: 
 -->

<script setup lang="ts">
import { ref, computed, PropType, watch, onMounted, watchEffect, reactive, onBeforeUnmount } from 'vue'
import ZXIAxisY from '../ZXIAxisY/index.vue'
import { EAxisXType, ESwitchState, FallData, ISpectrumParams } from '../types'
import { Engine, IPositionResult, LayersFence, LayersFenceType, Mesh, Program, Scene, Shader, ToolTip, ZoomTrans, Regions, Region, WebGl } from '../core'
import { IRaindropData, IRaindropPool } from './type'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Object as PropType<IRaindropData>,
    default: () => {
      return {
        time: new Date(),
        quality: new Float32Array()
      }
    },
    required: true
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off, required: true
  },
  /**
   * @description: 参数
   */    
  params: {
    type: Object as PropType<ISpectrumParams>,
    required: true,
    default: () => {
      return {
        begin: 0,
        end: 0
      }
    }
  },
  xScaleType: {
    type: Number as PropType<EAxisXType>,
    default: EAxisXType.symmetry
  },
  refresh: {
    default: false
  },
  qualityThreshold: { default: 0 }, // 质量门限
  resideTime: { default: 10 } // 驻留时间
})

const emit = defineEmits<{
  (e: 'scene', result: Scene<IRaindropPool>): void
  (e: 'region', result: { max: number, min: number }): void
}>()

const root = ref<HTMLDivElement>()

const boxToChoose = ref(false)

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene<IRaindropPool>>()

let zoomTrans: ZoomTrans

let fallProgram: Program

let fallMesh: Mesh

let a_position = new Float32Array()

let a_color = new Float32Array()

let fenceCount = 0

const qualityBuffer = ref<Array<Float32Array>>(new Array(360))

const bufferArray = ref<Array<IRaindropData>>([])

let dataLength = 0

let toolTip: ToolTip
/**
 * @description: 禁用toolTip的信息计算
 */  
let disableToolTipInfo = false

const toolTipPosition = ref<IPositionResult>()

// 框选
let regions: Regions

const regionAngle = ref({ min: -1, max: -1 })

const regionPosition = ref<Map<string, IPositionResult>>()

const step = computed(() => {
  if (props.params.step !== undefined) {
    return props.params.step
  } else {
    if (dataLength > 0) {
      return (props.params.end - props.params.begin) / (dataLength - 1)
    }
  }
  return 0
})

/**
 * @description: 数据抽取
 * @param {*} data 缓存质量
 * @param {*} vertexColor 顶点颜色
 * @param {*} fence
 * @return {*}
 */    
function dataTrend (data: Array<Float32Array>, vertexColor: Float32Array, fence: LayersFenceType) {
  let index, item, cut, start, max, n, i, y
  const hasRow = data.length, section = fence.currenSection, left = fence.baseFence.visibleIndex.min,
    startIndex = fence.cutDataStartIndex, drawLength = fence.baseFence.visibleLength, len1 = fence.cutDataLength % section,
    endIndex = startIndex + fence.cutDataLength - len1 - 1, maxLength = fence.baseFence.count

  for (n = 0; n < hasRow; n++) {
    // 一行数据
    cut = data[n]
    index = (n * maxLength + left) * 2
    for (i = 0; i < drawLength; i++) {
      start = startIndex + i * section
      max = cut[start]
      item = index + 2 * i
      // 单行数据抽取
      if (start <= endIndex) {
        for (y = 0; y < section; y++) { max = Math.max(max, cut[start + y]) }
      } else { // 临近尾部处理
        for (y = 0; y < len1; y++) { max = Math.max(max, cut[start + y]) }
      }
      vertexColor[item] = max
      vertexColor[item + 1] = max
    }
  }
}

/**
 * @description: 由于顶点数量发生变化
 */  
function refreshAsVertextCountchange () {
  if (scene.value) {

    const fence = scene.value.fence! as LayersFenceType

    a_position = FallData.createFallVertexPosition(fence, 360)

    fallMesh.options.drawArrays.count = a_position.length / 2

    a_color =
      new Float32Array(360 * fence.baseFence.count * 2).fill(Shader.BACKGROUND_COLOR)

    fallMesh
      .setData('a_position', a_position)
      .setData('a_color', a_color)
  }
}

function refresh () {
  for (let j = 0; j < 360; j++) {
    const qu = new Float32Array(dataLength).fill(Shader.BACKGROUND_COLOR)
    qualityBuffer.value[j] = qu
  }

  bufferArray.value = []
}

function watchInputData () {
  if (dataLength !== props.inputData.bearing.length) {
    dataLength = props.inputData.bearing.length
    refresh()
  }

  if (zoomTrans.options.lock) zoomTrans.options.lock = false
  if (toolTip.options.lock) toolTip.options.lock = false
  if (regions.options.lock) regions.options.lock = false

  bufferArray.value.push(props.inputData)

  let ange, floorAnge, len = bufferArray.value.length
  
  // 开始统计
  if (len > 1) {
    if ((bufferArray.value[len - 1].time.getTime() - bufferArray.value[0].time.getTime()) / 1000 > props.resideTime) {
      const del = bufferArray.value.shift()!
      for (let j = 0; j < dataLength; j++) {
        ange = del.bearing[j]
        if (ange === -1) continue
        floorAnge = Math.floor(ange)
        // 质量缓冲区质量去除
        qualityBuffer.value[359 - floorAnge][j] = Shader.BACKGROUND_COLOR
      }
      len--
    }
  }
  // 第一行为359度质量，最后一行为0度质量
  let quality
  for (let j = 0; j < dataLength; j++) {
    ange = props.inputData.bearing[j]
    quality = props.inputData.quality[j]
    if (ange < 0 || quality < props.qualityThreshold) continue
    floorAnge = Math.floor(ange)
    // 质量缓冲区
    qualityBuffer.value[359 - floorAnge][j] = quality
  }
}

function render () {
  if (scene.value && a_position.length > 0) {
    const fence = scene.value.fence as LayersFenceType

    if (fence.practicalCount === dataLength) {
      dataTrend(qualityBuffer.value, a_color, fence)

      fallMesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)

      scene.value.render3D()
    }
  }
}

function clearRect () {
  if (regions) {
    regions.clear()
  }
}

/**
 * @description: 计算框选的角度
 * @param {*} positions 框选器四个边的位置集
 * @param {*} IPositionResult 每条边的位置描述
 */    
function getRegionAngle (region?: Region) {
  if (region) {
    const positions = new Map(region.positionResult)
    regionPosition.value = positions

    const tags = region.getRgionValue()!
    const wrapper = regions.wrapper

    const top = tags.get(Region.TOP)!.positionResult.offsetMiddlePCTY
    const bottom = tags.get(Region.BOTTOM)!.positionResult.offsetMiddlePCTY

    let min = 359 - Math.ceil(bottom * wrapper.clientHeight)
    let max = 359 - Math.ceil(top * wrapper.clientHeight)
    if (min > 359) min = 359
    if (min < 0) min = 0
    if (max > 359) max = 359
    if (max < 0) max = 0

    regionAngle.value = { min, max }
  } else {
    regionAngle.value = { min: -1, max: -1 }

    regionPosition.value = undefined
  }
}

/** 
 * @description: 创建着色器程序
 */  
function createShaderSource () {
  if (scene.value) {
    const v = UseTheme.theme.nl.backgroundColor
    const bgColor = `vec3(${v[0]}, ${v[1]}, ${v[2]})`
    const barColor =  UseTheme.theme.Raindrop.raindropColor

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

      if (i === 0) {
        str += `if (color >= float(${min}) && color <= float(${max})) {
            float proportion = (color - float(${ds * i})) / float(${ds});
            v_color = vec3(float(${colorE[0] - colorS[0]}) * proportion + float(${colorS[0]}), float(${colorE[1] - colorS[1]}) * proportion + float(${colorS[1]}), float(${colorE[2] - colorS[2]}) * proportion + float(${colorS[2]}));
          }`
      } else {
        str += `else if (color >= float(${min}) && color <= float(${max})) {
            float proportion = (color - float(${ds * i})) / float(${ds});
            v_color = vec3(float(${colorE[0] - colorS[0]}) * proportion + float(${colorS[0]}), float(${colorE[1] - colorS[1]}) * proportion + float(${colorS[1]}), float(${colorE[2] - colorS[2]}) * proportion + float(${colorS[2]}));
          } `
      }

    }

    str += `else {
            v_color = vec3(float(${colorE[0]}), float(${colorE[1]}), float(${colorE[2]}));
          }`

    // 绘制矩形柱着色器
    const vertexSorce = `
      precision lowp float;
      attribute vec2 a_position;
      attribute float a_color;
      uniform mat4 u_conversion;
      varying vec3 v_color;
      void main() {
        gl_Position = u_conversion * vec4(a_position, 0.0, 1.0);
        if (a_color < 0.0) {
          v_color = ${bgColor};
        } else {
          float color = a_color / 100.0;
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

    const vertexShader = new Shader(scene.value, Shader.VERTEX_SHADER, vertexSorce)
    const fragmentShader = new Shader(scene.value, Shader.FRAGMENT_SHADER, fragmentSource)
    
    fallProgram = new Program(vertexShader, fragmentShader)

    if (fallProgram) scene.value.removeProgram(fallProgram.id)
    
    fallProgram = new Program(vertexShader, fragmentShader)
    scene.value.addProgram(fallProgram)
  }
}

const backgroundImage = ref('')

/** 
 * @description: 设置质量颜色
 */  
  function setAxisYColor () {
  const barColor = UseTheme.theme.Raindrop.raindropColor
  let str = ''

  for (let i = 0, len = barColor.length; i < len; i++) {
    const color = barColor[i]
    str += `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`

    if (i < len - 1) str += ','
  }

  backgroundImage.value = `linear-gradient(to right, ${str})`
}

setAxisYColor()

watch(() => props.inputData, () => {
  watchInputData()

  render()
})

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    toolTip.options.lock = true
    zoomTrans.options.lock = true
    regions.options.lock = true

    dataLength = 0

    if (scene.value) {
      scene.value.renderCtx.clearScreen()
    }
  } 
})

watch(() => props.refresh, () => {
  refresh()

  if (scene.value) scene.value.renderCtx.clearScreen()
})

watch(boxToChoose, (v) => {
  if (regions) {
    if (v) {
      regions.open()
    } else {
      regions.close()
    }
  }
})

watch(regionAngle, (v) => {
  emit('region', v)
})

// 游离信息显示
watchEffect(() => {
  if (!disableToolTipInfo && toolTipPosition.value !== undefined && scene.value) {
    const result: Map<string, { info: string }> = new Map()

    const fence = scene.value.fence as LayersFenceType
    const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value.offsetMiddlePCTX)
    // 频率
    const frequency = parseFloat((props.params.begin + dataIndex * step.value).toFixed(6))

    result.set('1', {
      info: '频率：' + parseFloat(frequency.toFixed(6)) + ' MHz|' + parseFloat((frequency * 1000).toFixed(3)) + ' kHz'
    })
    // 角度
    const angle = Math.floor(360 - toolTipPosition.value.offsetY)
    result.set('2', {
      info: '角度：' + angle + '°'
    })

    toolTip.setContent(result)
  }
})

let themeKey

onMounted(() => {
  if (sceneDom.value) {
    const engine = new Engine(sceneDom.value)

    const ctx = new WebGl(engine.canvas, { backgroundColor: UseTheme.theme.nl.backgroundColor })

    scene.value = new Scene(engine, ctx)

    themeKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.nl.backgroundColor
      createShaderSource()
      fallProgram.add(fallMesh)

      setAxisYColor()

      render()
    })

    const fence = LayersFence.create(scene.value)

    fence.afterRefresh.add(() => {
      const fence = scene.value!.fence! as LayersFenceType
      // 横向fenceCount变化引起顶点数量变化再刷新
      if (fenceCount !== fence.baseFence.count) {
        fenceCount = fence.baseFence.count

        refreshAsVertextCountchange()
      }
    })

    fence.afterZoomOrTrans.add(() => {
      render()
    })

    // 容器尺寸变化
    scene.value.resizeObservers.set('drop', () => {
      render()
    })

    zoomTrans = new ZoomTrans(scene.value)

    createShaderSource()

    fallMesh = new Mesh(scene.value, {
      drawArrays: {
        mode: Mesh.LINES,
        count: 0
      }
    })

    fallProgram.add(fallMesh)

    // 游离显示信息
    toolTip = new ToolTip(scene.value, { type: ToolTip.CROSS })

    toolTip.afterTrigger.set('drop', (p) => {
      toolTipPosition.value = p
    })

    toolTip.afterHidden.set('drop', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('drop', () => {
      disableToolTipInfo = true
    })

    regions = new Regions(scene.value)

    regions.afterClose.set('raindrop', () => {
      if (boxToChoose.value) boxToChoose.value = false
    })

    regions.afterEnd.set('drop', (id, region) => {
      getRegionAngle(region)
    })

    regions.afterSelect.set('drop', (id, region) => {
      getRegionAngle(region)
    })

    // 内部数据挂载
    // @ts-ignore
    scene.value.pool = reactive({
      step,
      qualityBuffer,
      bufferArray,
      toolTip,
      toolTipPosition,
      regions,
      regionAngle,
      regionPosition
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
    <div class="raindrop-plot-container">
      <div class="raindrop-haeder">
        <ul>
          <li><el-switch v-model="boxToChoose" active-text="框选统计" /></li>
          <li @click="clearRect"><i class="iconfont icon-qingkong" />清空框选</li>
        </ul>
      </div>

      <div class="first-row">
        <ZXIAxisY
          class="coordinate-axis-Y-1"
          :defaultValue="{ min: 0, max: 360 }"
          :controlBtn="false"
          :color="{ open: false }"
          :scene="scene" />
        <div class="raindrop-plot-image">
          <div class="mount" ref="sceneDom" />
        </div>
      </div>
      <ul class="second-row">
        <li>质量：0</li>
        <li><span /></li>
        <li>100</li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="less">
.raindrop-plot-container{
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .raindrop-haeder{
    height: 25px;
    padding: 0 0 0 40px;
    box-sizing: border-box;
    ul{
      width: 100%;
      height: 100%;
      display: flex;
      li{
        padding: 0 10px;
        line-height: 25px;
        color: v-bind('UseTheme.theme.var.color');
        &:hover{
          color: red!important;
        }
        i{
          padding-right: 4px;
          box-sizing: border-box;
        }
        cursor: pointer;
        :deep(.el-switch){
          .el-switch__label--right{
            color: v-bind('UseTheme.theme.var.color');
          }
          .is-active{
            color: #409EFF!important;
          }
        }
      }
    }
  }
  .first-row{
    flex: auto;
    display: flex;
    .coordinate-axis-Y-1{
      padding: 1px 0 1px 50px;
    }
    .raindrop-plot-image{
      flex: auto;
      border-right: 1px solid v-bind('UseTheme.theme.var.borderColor');
      border-top: 1px solid v-bind('UseTheme.theme.var.borderColor');
      border-bottom: 1px solid v-bind('UseTheme.theme.var.borderColor');
      .mount{
        width: 100%;
        height: 360px;
      }
    }
  }
  .second-row{
    display: flex;
    height: 12px;
    margin: 7px 0 0 50%;
    li{
      height: 12px;
      line-height: 12px;
      font-size: 12px;
      color: v-bind('UseTheme.theme.var.color');
      padding: 0 3px;
    }
    li:nth-child(2){
      flex: auto;
      display: flex;
      span{
        flex: auto;
        height: 10px;
        margin: auto;
        background-image: v-bind('backgroundImage');
      }
    }
  }
}
</style>