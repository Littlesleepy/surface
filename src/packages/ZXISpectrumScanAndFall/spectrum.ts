/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-23 14:56:29
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISpectrumScanAndFall\spectrum.ts
 * @Description: 
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, Ref, watch, watchEffect } from 'vue'
import { ISpectrumScanInputData } from './type'
import { Engine, IMeshInputOptions, isLayersFenceType, LayersFence, LayersFenceType,
  Mesh, Program, Scene, Shader, ToolTip, ZoomTrans, IPositionResult, Measure, Threshold, IOffsetPosition, Listen, Region, Marker, WebGl, isWebGl, Caliper, Tag, Fence } from '../core'
import { EBtncontrolType, IBtncontrols, ESwitchState, IAxisXValue, IAxisYValue, ITargetIcon, ISpectrumScanAndFallSpectrumPool } from '../types'
import { ISpectrumStatisticalBuffer, Controls, IAdditionalCurve, SpectrumData } from '../ZXISpectrumAndFall/type'
import peakIcon from '../assets/imgs/peakIcon.png'
import { createMarker } from './marker'
import { UseTheme } from '../styles'
import { useGlGrid } from '../ZXISpectrumAndFall/useGlGrid'

export function spectrum (
  props: any,
  emit: any,
  defaultValueX: Ref<{ min: number, max: number }>,
  step: Ref<number>,
  inputDataLength: Ref<number>
) {
  const controls = ref<Array<IBtncontrols>>([{
    type: EBtncontrolType.switch,
    title: '柱状图',
    paramName: Controls.zhuzhuangtu,
    repelName: [Controls.baoluotu]
  }, {
    type: EBtncontrolType.switch,
    title: '包络图',
    paramName: Controls.baoluotu,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.baoluotuColor, true),
    repelName: [Controls.zhuzhuangtu]
  }, {
    type: EBtncontrolType.switch,
    title: '瀑布图',
    paramName: Controls.pubutu
  }, {
    type: EBtncontrolType.switch,
    title: '峰值',
    paramName: Controls.fengzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.fengzhiColor, true)
  }, {
    type: EBtncontrolType.switch,
    title: '均值',
    paramName: Controls.junzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.junzhiColor, true)
  }, {
    type: EBtncontrolType.switch,
    title: '谷值',
    paramName: Controls.guzhi,
    activeColor: UseTheme.transColor(UseTheme.theme.SpectrumAndFall.guzhiColor, true)
  }, {
    type: EBtncontrolType.switch,
    title: '峰标',
    paramName: Controls.fengbiao
  }, {
    type: EBtncontrolType.switch,
    title: '测量',
    paramName: Controls.celiang,
    repelName: [Controls.shaixuan, Controls.menxian, Controls.biaozhu]
  }, {
    type: EBtncontrolType.switch,
    title: '筛选',
    paramName: Controls.shaixuan,
    repelName: [Controls.celiang, Controls.menxian, Controls.biaozhu],
    show: true
  }, {
    type: EBtncontrolType.switch,
    title: '频率划分',
    paramName: Controls.pinlvhuafen
  }, {
    type: EBtncontrolType.switch,
    title: '瀑布图测量',
    paramName: Controls.fallCeliang,
    show: true
  }, {
    type: EBtncontrolType.switch,
    title: '标注',
    paramName: Controls.biaozhu,
    repelName: [Controls.celiang, Controls.menxian, Controls.shaixuan]
  }, {
    type: EBtncontrolType.button,
    title: '重置',
    paramName: Controls.reset
  }])
  
  const defaultBtn = {
    zhuzhuangtu: true,
    baoluotu: false,
    pubutu: true,
    pubutusave: 2,
    fengzhi: false,
    junzhi: false,
    guzhi: false,
    fengbiao: false,
    celiang: false,
    shaixuan: false,
    menxian: false,
    pinlvhuafen: true,
    fallCeliang: false,
    biaozhu: false,
    reset: false
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
    zhuzhuangtu: boolean
    baoluotu: boolean
    pubutu: boolean
    pubutusave: number
    fengzhi: boolean
    junzhi: boolean
    guzhi: boolean
    fengbiao: boolean
    celiang: boolean
    shaixuan: boolean
    menxian: boolean
    pinlvhuafen: boolean
    reset: boolean
    [p: string]: any
  }>(defaultBtn)
  // 瀑布图开关影响筛选和瀑布图测量
  watch(() => btnValues.pubutu, (btn) => {
    controls.value.forEach(item => {
      if (item.paramName === Controls.fallCeliang || item.paramName === Controls.shaixuan) {
        item.show = btn
        if (!btn) btnValues[item.paramName] = false
      }
    })
  }, { immediate: true })

  /** 
   * @description: Y轴颜色
   */  
  const axisYColor = ref({
    width: UseTheme.theme.SpectrumAndFall.axisYWidth,
    backgroundImage: '',
    open: true
  })
  /** 
   * @description: 设置Y轴配置
   */  
  function setAxisYColor () {
    const barColor = UseTheme.theme.SpectrumAndFall.barColor
    let str = ''

    for (let i = 0, len = barColor.length; i < len; i++) {
      const color = barColor[i]
      str += `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`

      if (i < len - 1) str += ','
    }

    axisYColor.value.width = UseTheme.theme.SpectrumAndFall.axisYWidth
    axisYColor.value.backgroundImage = `linear-gradient(to top, ${str})`
  }

  setAxisYColor()

  /**
   * @description: 扫描到的索引
   */  
  const scanIndex = ref(0)

  let fenceCount = 0
  
  const inputData = ref<Array<ISpectrumScanInputData>>([])

  const usingData = ref<ISpectrumScanInputData>({ data: new Float32Array(), time: 0, sc: 0, frequency: 0 })
  // 统计计算处理后的数据，数组0号索引为第一帧数据
  const afterStaticData = ref<Array<ISpectrumScanInputData>>([])

  const spectrumDom = ref<HTMLDivElement>()

  const spectrumYvalue = ref({
    min: 0,
    max: 0
  })

  const spectrumXvalue = ref({
    min: 0,
    max: 0
  })

  const u_min_range = [0, 0]

  const spectrumScene = ref<Scene<ISpectrumScanAndFallSpectrumPool>>()

  let interval = 0

  let rectangleProgram: Program
  /**
   * @description: 柱状网格
   */  
  let rectangle: {
    mesh: Mesh
    a_position: Float32Array
    a_color: Array<number> | Float32Array
    samplingData: Float32Array
  }

  let lineProgram: Program
  /**
   * @description: 线形管理器
   */
  const lineManager = new Map<string, {
    mesh: Mesh
    a_positionX: Float32Array
    a_positionY: Float32Array
    u_color: Array<number> | Float32Array
  }>()

  /**
   * @description: 附加线形管理器
   */
  const additionalLineManager = new Map<string, {
    mesh: Mesh
    a_positionX: Float32Array
    a_positionY: Float32Array
    u_color: Array<number> | Float32Array
    data: Float32Array
  }>()

  /**
   * @description: 数据统计计算
   */
  const statisticalBuffer = reactive({
    input: new Float32Array(),
    max: new Float32Array(),
    min: new Float32Array(),
    sum: new Float64Array(),
    mean:  new Float32Array(),
    count: new Map<number, number>()
  })

  let zoomTrans: ZoomTrans

  let toolTip: ToolTip

  /**
   * @description: 禁用toolTip的信息计算
   */  
  let disableToolTipInfo = false

  const toolTipPosition = ref<number>()
  // 峰标
  const peakIcons = ref<Array<ITargetIcon>>([])
  // 峰标文字显示
  const showTagsText = computed(() => {
    if (spectrumScene.value) {
      const fence = spectrumScene.value.fence
      if (fence) {
        if (isLayersFenceType(fence)) {
          return !fence.sampling
        } else {
          if (fence.baseFence.eachPieceWidth * fence.practicalCount < 2) return false
        }
      }
    }

    return true
  })

  let measureTool: Measure

  const measurePosition = ref<Map<string, IPositionResult>>()

  let disableMeasureInfo = false
  // 双门限
  let dbThreshold: Threshold
  
  const dbThresholdPosition = ref<Map<string, IPositionResult>>()

  const dbThresholdValue = ref({ min: 0, max: 0 })

  let disableDbThresholdInfo = false

  // 单门限
  let singleThreshold: Threshold
  
  const singleThresholdPosition = ref<Map<string, IPositionResult>>()

  const singleThresholdValue = ref({ value: 0 })

  let disableSingleThresholdInfo = false

  // 背景网格
  const {
    setGridProgram,
    spectrumAxisX,
    spectrumAxisY,
    setLineColor
  } = useGlGrid(render)

  function axisYCahnge (obj: IAxisYValue) {
    spectrumYvalue.value = obj

    u_min_range[0] = spectrumYvalue.value.min
    u_min_range[1] = spectrumYvalue.value.max - spectrumYvalue.value.min

    changePositionByMinValue()

    if (spectrumScene.value && usingData.value.time > 0) {
      spectrumScene.value.render3D()
    }

    if (spectrumScene.value && singleThreshold) {
      const v = singleThresholdValue.value.value
      const position: IOffsetPosition = {
        offsetX: spectrumScene.value.canvas.clientWidth * 0.5,
        offsetY: (1 - (v - obj.min) / (obj.max - obj.min)) * spectrumScene.value.canvas.clientHeight
      }

      singleThreshold.setTagPosition(Threshold.BOTTOM, position)
    }
  }

  function axisYChange (obj: IAxisXValue) {
    spectrumXvalue.value = obj
  }
  /**
   * @description: 纵轴变化改变柱状图绘制坐标数据
   */
  function changePositionByMinValue () {
    const minValue = spectrumYvalue.value.min
    let startIndex = 0

    if (spectrumScene.value && inputDataLength.value > 0) {
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
   * @description: 柱状图间隔修改
   */  
  function changeInterval () {
    let _interval = 1.0
    const fence = spectrumScene.value!.fence! as LayersFenceType
    const currentLayer = fence.currentLayer
    const sectionLen = fence.layers.length
    if (currentLayer >= sectionLen && currentLayer < sectionLen + 2) {
      _interval = 0.85
    }
    if (currentLayer >= sectionLen + 2 || (sectionLen === 1)) { _interval = 0.92 }
    if (interval !== _interval) {
      interval = _interval

      let index, x, leftBorder, rightBorder
      const fence = spectrumScene.value!.fence! as LayersFenceType
      const w = fence.baseFence.eachPieceWidthInitial * interval
      const pieces = fence.baseFence.piecesInitial, rectangle_a_position = rectangle.a_position

      for (let i = 0; i < fence.baseFence.count; i++) {
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
  }
  
  /**
   * @description: 如果当前fenceCount发生变化
   */  
  function refreshByFenceCountchange () {
    const fence = spectrumScene.value!.fence! as LayersFenceType
    
    const baseFence = fence.baseFence
    const drawCount = baseFence.count
    rectangle.mesh.options.drawArrays.count = drawCount * 6

    rectangle.samplingData = new Float32Array(drawCount)
    rectangle.a_position = new Float32Array(drawCount * 2 * 6)
    rectangle.a_color = new Float32Array(drawCount * 6).fill(Shader.BACKGROUND_COLOR)

    changePositionByMinValue()

    interval = 0
    changeInterval()

    rectangle.mesh.setData('a_position', rectangle.a_position)

    rectangle.mesh.setData('a_color', rectangle.a_color)

    for (const [, line] of lineManager) {
      line.a_positionY = new Float32Array(drawCount)
      line.mesh.options.drawArrays.count = drawCount

      line.a_positionX = baseFence.piecesInitial

      line.mesh.setData('a_positionX', line.a_positionX)
      line.mesh.setData('a_positionY', line.a_positionY)
    }
    // 附加曲线
    for (const [, line] of additionalLineManager) {
      line.a_positionY = new Float32Array(drawCount)
      line.mesh.options.drawArrays.count = drawCount

      line.a_positionX = baseFence.piecesInitial

      line.mesh.setData('a_positionX', line.a_positionX)
      line.mesh.setData('a_positionY', line.a_positionY)
    }
  }
  /**
   * @description: 线条管理器添加一条线条
   * @param {string} key 唯一key
   * @param {Array} color 线条颜色
   * @return {*}
   */  
  function createLine (color: Array<number> | Float32Array) {
    if (spectrumScene.value) {
      const drawOptions = {
        drawArrays: {
          mode: Mesh.LINE_STRIP,
          count: 0
        }
      }
      const line = {
        mesh: new Mesh(spectrumScene.value, drawOptions),
        a_positionX: new Float32Array(),
        a_positionY: new Float32Array(),
        u_color: color
      }

      line.mesh
        .setData('u_min_range', u_min_range)
        .setData('u_color', color)

      return line
    }
  }
  /**
   * @description: 设置峰标
   * @param {Float32Array} samplingData 抽取数据集
   */   
  function setPeakIcon (samplingData: Float32Array) {
    if (btnValues.fengbiao) {
      const fence = spectrumScene.value!.fence! as LayersFenceType
      let maxIndex = fence.cutDataStartIndex,
        maxValue = samplingData[fence.baseFence.visibleIndex.min],
        currentValue = maxValue
      for (let i = fence.baseFence.visibleIndex.min, len = fence.baseFence.visibleIndex.max; i < len; i++) {
        currentValue = samplingData[i]
        if (currentValue >= maxValue) {
          maxValue = currentValue
          maxIndex = i
        }
      }

      const dataIndex = fence.cutDataIndexArr[maxIndex]
      
      const frequency = dataIndex * step.value + defaultValueX.value.min
      
      const range = usingData.value.data[dataIndex]
      
      const message = `${props.scaleX.parse(frequency)}\n${props.scaleY.parse(range)}`

      peakIcons.value = [{
        dataIndex,
        message,
        imgUrl: peakIcon,
        style: {
          width: 410
        }
      }]
    }
  }
  /**
   * @description: 渲染图像
   * @param {Float32Array} data 原始数据
   * @return {*}
   */  
  function render () {
    if (spectrumScene.value) {
      spectrumScene.value.renderCtx.clearScreen()
      if (usingData.value.time > 0) {

        const fence = spectrumScene.value!.fence! as LayersFenceType

        // 线条
        for (const [key, line] of lineManager) {
          const samplingData = line.a_positionY
          line.mesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)

          switch (key) {
          case Controls.baoluotu: {
            if (btnValues.baoluotu) {
              lineProgram.add(line.mesh)
              SpectrumData.getSamplingData(usingData.value.data, samplingData, fence)

              toolTip.magnetGroup = [samplingData]
              setPeakIcon(samplingData)
            } else {
              lineProgram.remove(line.mesh)
            }
          }
            break
          case Controls.fengzhi: {
            if (btnValues.fengzhi) {
              SpectrumData.getSamplingDataLine(statisticalBuffer.max, samplingData, fence)
              lineProgram.add(line.mesh)
            } else {
              lineProgram.remove(line.mesh)
            }
          }
            break
          case Controls.junzhi: {
            if (btnValues.junzhi) {
              SpectrumData.getSamplingDataLine(statisticalBuffer.mean, samplingData, fence)
              lineProgram.add(line.mesh)
            } else {
              lineProgram.remove(line.mesh)
            }
          }
            break
          case Controls.guzhi: {
            if (btnValues.guzhi) {
              SpectrumData.getSamplingDataLine(statisticalBuffer.min, samplingData, fence)
              lineProgram.add(line.mesh)
            } else {
              lineProgram.remove(line.mesh)
            }
          } 
            break
          }
        }

        // 附加曲线数据抽取
        for (const [, line] of additionalLineManager) {
          const samplingData = line.a_positionY
          line.mesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)
          SpectrumData.getSamplingDataLine(line.data, samplingData, fence)
        }

        // 柱状图
        if (btnValues.zhuzhuangtu) {
          const  samplingData = rectangle.samplingData
          SpectrumData.getSamplingData(usingData.value.data, samplingData, fence)
          toolTip.magnetGroup = [samplingData]

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

          setPeakIcon(samplingData)

          rectangle.mesh.setData('u_conversion', fence.baseFence.modelMatrix.elements)

          rectangleProgram.add(rectangle.mesh)
        } else {
          rectangleProgram.remove(rectangle.mesh)
        }

        if (!btnValues.zhuzhuangtu && !btnValues.baoluotu) peakIcons.value = []
      }

      spectrumScene.value.render3D()
    }
  }
  /**
   * @description: 重置
   */  
  function resetSpectrum () {
    if (spectrumScene.value) {
      initStatisticalBuffer()

      usingData.value.data.fill(Shader.BACKGROUND_COLOR)

      // 刷新fence
      if (spectrumScene.value.canvas.clientWidth === 0) return
      const fence = spectrumScene.value.fence! as LayersFenceType

      fence.refresh(spectrumScene.value.canvas.clientWidth, inputDataLength.value)

      // 附加曲线数据抽取
      for (const [, line] of additionalLineManager) {
        line.data.fill(Shader.BACKGROUND_COLOR)
      }

      inputData.value = []

      render()
    }
  }

  function initStatisticalBuffer () {
    statisticalBuffer.input = new Float32Array(inputDataLength.value).fill(Shader.BACKGROUND_COLOR)
    statisticalBuffer.max = new Float32Array(inputDataLength.value).fill(Shader.BACKGROUND_COLOR)
    statisticalBuffer.min = new Float32Array(inputDataLength.value).fill(Shader.BACKGROUND_COLOR)
    statisticalBuffer.sum = new Float64Array(inputDataLength.value).fill(Shader.BACKGROUND_COLOR)
    statisticalBuffer.mean = new Float32Array(inputDataLength.value).fill(Shader.BACKGROUND_COLOR)
    statisticalBuffer.count = new Map()
  }
  /**
   * @description: 监听输入原始数据
   * @param {Float32Array} data 原始数据
   * @return {*}
   */  
  function watchInputData () {
    if (spectrumScene.value === undefined || inputData.value.length === 0) return

    if (toolTip.options.lock) toolTip.options.lock = false
    if (zoomTrans.options.lock) zoomTrans.options.lock = false
    if (measureTool.options.lock) measureTool.options.lock = false

    const len = inputData.value.length, staticDataResult: Array<ISpectrumScanInputData> = new Array(len)

    let oneFrame: ISpectrumScanInputData, maxCount
    for (let i = 0; i < len; i++) {
      // 取出一帧数据
      oneFrame = inputData.value[i]
      maxCount = (oneFrame.frequency - props.params.begin) / step.value + oneFrame.data.length
      // 处理计算精度缺失
      maxCount = parseFloat(maxCount.toFixed(0))

      if (maxCount > inputDataLength.value) {
        // 截去超出部分
        oneFrame.data = oneFrame.data.subarray(0, oneFrame.data.length - (maxCount - inputDataLength.value))
        maxCount = inputDataLength.value
      }
      scanIndex.value = maxCount - 1
      
      const setIndex = maxCount - oneFrame.data.length
      if (setIndex < 0) return
      // 记录本段数据获得次数
      if (statisticalBuffer.count.has(oneFrame.frequency)) {
        let count = statisticalBuffer.count.get(oneFrame.frequency)!
        count++
        statisticalBuffer.count.set(oneFrame.frequency, count)
      } else {
        statisticalBuffer.count.set(oneFrame.frequency, 1)
      }

      ScanSpectrumData.statisticalData(oneFrame, maxCount - oneFrame.data.length, statisticalBuffer) // 均值、峰值、谷值计算

      staticDataResult[i] = {
        data: new Float32Array(statisticalBuffer.input),
        time: oneFrame.time,
        frequency: oneFrame.frequency,
        startTime: oneFrame.startTime,
        startIndex: oneFrame.startIndex,
        endIndex: oneFrame.endIndex,
        endTime: oneFrame.endTime,
        sc: oneFrame.sc
      }
    }

    afterStaticData.value = staticDataResult

    usingData.value = afterStaticData.value[0]
  }
  /**
   * @description: 计算筛选出的结果
   */
  function getDbThresholdValue (position: Map<string, IPositionResult>) {
    const top = position.get(Threshold.TOP)!
    const bottom = position.get(Threshold.BOTTOM)!

    const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min

    const rangeTop = parseFloat(((1 - top.offsetPCTY) * rangeY + spectrumYvalue.value.min).toFixed(1))
    const rangeBottom = parseFloat(((1 - bottom.offsetPCTY) * rangeY + spectrumYvalue.value.min).toFixed(1))

    return {
      min: Math.min(rangeTop, rangeBottom),
      max: Math.max(rangeTop, rangeBottom)
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

      return tag.instance.setPosition(position, spectrumScene.value?.fence)
    }
  }

  /** 
   * @description: 创建着色器程序
   */  
  function createShaderSource () {
    if (spectrumScene.value) {
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

          if (a_color == ${Shader.BACKGROUND_COLOR}.0) {
            y = -1.1;
          }

          gl_Position = u_conversion * vec4(a_position.x, y, 0.0, 1.0);

          float color = (a_color - u_min_range.x) / u_min_range.y;
          ${str}
        }
        `

      const rectangleFragmentSource = `
        precision mediump float;
        varying vec3 v_color;
        void main () {
          gl_FragColor = vec4(v_color, 1.0);
        } `
      
      const rectangleVertexShader = new Shader(spectrumScene.value, Shader.VERTEX_SHADER, rectangleVertexSorce)
      const rectangleFragmentShader = new Shader(spectrumScene.value, Shader.FRAGMENT_SHADER, rectangleFragmentSource)

      if (rectangleProgram) spectrumScene.value.removeProgram(rectangleProgram.id)
      
      rectangleProgram = new Program(rectangleVertexShader, rectangleFragmentShader)
      spectrumScene.value.addProgram(rectangleProgram)
    }
  }

  // 数据长度变化
  watch(inputDataLength, (len) => {
    if (len > 0) {
      initStatisticalBuffer()

      usingData.value = { data: new Float32Array(len).fill(Shader.BACKGROUND_COLOR), time: 0, sc: 0, frequency: 0 }
      
      // 刷新fence
      if (spectrumScene.value) {
        if (spectrumScene.value.canvas.clientWidth === 0) return
        const fence = spectrumScene.value.fence! as LayersFenceType

        fence.refresh(spectrumScene.value.canvas.clientWidth, len)
      }
    }
  }, { immediate: true })

  watch(inputData, watchInputData)

  watch(usingData, render)

  watch([() => btnValues.zhuzhuangtu, () => btnValues.baoluotu, () => btnValues.fengzhi,
    () => btnValues.junzhi, () => btnValues.guzhi, () => btnValues.fengbiao], () => {
    render()
  })

  watch(() => btnValues.zhuzhuangtu, () => {
    if (btnValues.zhuzhuangtu) { btnValues.baoluotu = false }
  })

  watch(() => btnValues.baoluotu, () => {
    if (btnValues.baoluotu) { btnValues.zhuzhuangtu = false }
  })

  watch(() => btnValues.fengbiao, (btn) => {
    if (!btn) peakIcons.value = []
  })

  watch(() => btnValues.celiang, (btn) => {
    if (btn) {
      measureTool.open()

      toolTip.close()

      if (btnValues.shaixuan) { btnValues.shaixuan = false }
      if (btnValues.menxian) { btnValues.menxian = false }
    } else {
      measureTool.close()
    }
  })

  watch(() => btnValues.shaixuan, (btn) => {
    if (btn) {
      dbThreshold.open()

      toolTip.close()

      if (btnValues.celiang) { btnValues.celiang = false }
      if (btnValues.menxian) { btnValues.menxian = false }
    } else {
      dbThreshold.close()
    }
  })

  watch(() => btnValues.menxian, (btn) => {
    if (btn) {
      singleThreshold.open()

      toolTip.close()

      if (btnValues.celiang) { btnValues.celiang = false }
      if (btnValues.shaixuan) { btnValues.shaixuan = false }
    } else {
      singleThreshold.close()
    }
  })

  watch(() => props.switchLever, (btn) => {
    if (btn === ESwitchState.open) {
      scanIndex.value = 0

      toolTip.options.lock = true
      zoomTrans.options.lock = true
      measureTool.options.lock = true

      resetSpectrum()
    } 
  })

  watch(spectrumYvalue, () => {
    if (dbThresholdPosition.value) {
      const r = getDbThresholdValue(dbThresholdPosition.value)

      dbThresholdValue.value = r
    }
  })

  // 附加曲线
  watch(() => props.additionalCurve, () => {
    const datas = props.additionalCurve as Map<string, IAdditionalCurve>

    for (const [key, item] of datas) {
      if (!additionalLineManager.has(key)) {
        const line = createLine(item.color)
        if (line) {
          // 初始化
          const fence = spectrumScene.value!.fence! as LayersFenceType
          const baseFence = fence.baseFence
          const drawCount = baseFence.count

          line.a_positionY = new Float32Array(drawCount)
          line.mesh.options.drawArrays.count = drawCount

          line.a_positionX = baseFence.piecesInitial

          line.mesh.setData('a_positionX', line.a_positionX)
          line.mesh.setData('a_positionY', line.a_positionY)

          lineProgram.add(line.mesh)
          additionalLineManager.set(key, { ...line, data: new Float32Array(item.data) })
        }
      } else {
        const line = additionalLineManager.get(key)!
        line.data = new Float32Array(item.data)
        line.mesh.setData('u_color', item.color)
        line.u_color = item.color
      }
    }
    // 移除不需要的曲线
    for (const [key, line] of additionalLineManager) {
      if (!datas.has(key)) {
        lineProgram.remove(line.mesh)
        additionalLineManager.delete(key)
      }
    }

    render()
  })

  watch(() => props.singleThreshold, (v) => {
    if (v !== undefined) setSingleThresholdPosition(v)
  })

  // 游离信息显示
  watchEffect(() => {
    if (!disableToolTipInfo && toolTipPosition.value !== undefined && spectrumScene.value) {
      const result: Map<string, { info: string }> = new Map()

      const fence = spectrumScene.value.fence as LayersFenceType
      const dataIndex = fence.getDataIndexByDistance(toolTipPosition.value)
      // 幅度
      let range = usingData.value.data[dataIndex]

      if (range !== undefined && range !== Shader.BACKGROUND_COLOR) {
        result.set('0', {
          info: props.scaleY.parse(range)
        })

        // 最值
        result.set('2', {
          info: '最大值：' + statisticalBuffer.max[dataIndex].toFixed(1)
          + ' 最小值：' + statisticalBuffer.min[dataIndex].toFixed(1)
          + ' 平均值：' + statisticalBuffer.mean[dataIndex].toFixed(1)
        })
      } else {
        range = spectrumYvalue.value.min
      }
      // 频率
      const frequency = defaultValueX.value.min + dataIndex * step.value

      result.set('1', {
        info: props.scaleX.parse(frequency)
      })

      toolTip.setValueTags(new Map([[
        '1',
        {
          value: 1 - (range - spectrumYvalue.value.min) / (spectrumYvalue.value.max - spectrumYvalue.value.min),
          backgroundColor: 'rgb(255, 0, 157)'
        }
      ]]))

      toolTip.setContent(result)
    }
  })
  // 测量信息显示
  watchEffect(() => {
    if (!disableMeasureInfo && measurePosition.value && spectrumScene.value) {
      const result: Map<string, { info: string }> = new Map()
      // 频率
      const fence = spectrumScene.value.fence as LayersFenceType
      const left = measurePosition.value.get(Region.LEFT)!
      const right = measurePosition.value.get(Region.RIGHT)!

      const leftDataIndex = fence.getDataIndexByDistance(left.offsetMiddlePCTX)
      const rightDataIndex = fence.getDataIndexByDistance(right.offsetMiddlePCTX)

      const leftFrequency = parseFloat((defaultValueX.value.min + leftDataIndex * step.value).toFixed(6))
      const rightFrequency = parseFloat((defaultValueX.value.min + rightDataIndex * step.value).toFixed(6))

      result.set('0', {
        info: `频率：${Math.min(leftFrequency, rightFrequency)}~${Math.max(leftFrequency, rightFrequency)}MHz`
      })

      result.set('1', {
        info: `频率差：${parseFloat(Math.abs(leftFrequency - rightFrequency).toFixed(6))}MHz`
      })

      const top = measurePosition.value.get(Region.TOP)!
      const bottom = measurePosition.value.get(Region.BOTTOM)!

      const rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min

      const rangeTop = parseFloat(((1 - top.offsetPCTY) * rangeY + spectrumYvalue.value.min).toFixed(1))
      const rangeBottom = parseFloat(((1 - bottom.offsetPCTY) * rangeY + spectrumYvalue.value.min).toFixed(1))

      result.set('2', {
        info: `幅度：${Math.min(rangeTop, rangeBottom)}~${Math.max(rangeTop, rangeBottom)}dBuV`
      })

      result.set('3', {
        info: `幅度差：${parseFloat(Math.abs(rangeTop - rangeBottom).toFixed(1))}dBuV`
      })

      measureTool.setContent(result)
    }
  })
  // 筛选结果显示
  watchEffect(() => {
    if (!disableDbThresholdInfo && dbThresholdPosition.value && spectrumScene.value) {
      const result: Map<string, { info: string }> = new Map()
      const r = getDbThresholdValue(dbThresholdPosition.value)
      result.set('0', {
        info: `幅度：${r.min}~${Math.max(r.max)}dBuV`
      })

      dbThreshold.setContent(result)
    }
  })

  /** ..............................................单门限.............................................. */
  watchEffect(() => {
    if (!disableSingleThresholdInfo && singleThresholdPosition.value && spectrumScene.value) {
      const result: Map<string, { info: string }> = new Map()
      const r = getSingleThresholdValue(singleThresholdPosition.value)
      result.set('0', {
        info: `幅度：${r}dBuV`
      })

      singleThreshold.setContent(result)
    }
  })

  /**....................................卡尺工具................................ */
  let caliper: Caliper

  const caliperPosition = ref<IPositionResult>()

  watch(() => btnValues.biaozhu, (v) => {
    if (caliper) {
      if (v) {
        caliper.open()
      } else {
        caliper.close()
      }
    }
  })

  watchEffect(() => {
    if (caliperPosition.value && spectrumScene.value) {
      const fence = spectrumScene.value.fence as LayersFenceType
      if (usingData.value.time > 0 && fence.cutDataIndexArr.length) {
        const result: Map<string, { info: string, color?: string }> = new Map()
        const dataIndex = fence.getDataIndexByDistance(caliperPosition.value.offsetMiddlePCTX)
        // 频率
        const frequency = defaultValueX.value.min + dataIndex * step.value

        result.set('0', {
          info: `${props.scaleX.transform(frequency)} ${props.scaleX.unit}`
        })

        caliper.setContent(result)
      }
    }
  })

  /** .............................................marker............................................. */
  const {
    marker,
    markerManagers,
    markerManagerTrigger,
    addMarker,
    setMarkerPoints
  } = createMarker(computed(() => props.scaleX), computed(() => props.params), step)

  watch(() => props.markers, (frequencys: Array<number>) => {
    addMarker(frequencys)
    setMarkerPoints(spectrumYvalue.value, new Map([['0', { data: usingData.value.data }]]))
  })

  watch([spectrumYvalue, usingData], () => setMarkerPoints(spectrumYvalue.value, new Map([['0', { data: usingData.value.data }]])))

  /**......................返出选中频率...................... */
  /**
   * @description: 触发返出选中频率
   */
  function getSelectFrequency(e: MouseEvent | TouchEvent) {
    if (spectrumScene.value && usingData.value.time > 0 && toolTipPosition.value) {
      const tag = toolTip.verticalTag!.instance
      const fence = spectrumScene.value.fence as LayersFenceType
      const event = spectrumScene.value.event
      const offsetX = tag.positionResult.offsetMiddlePCTX

      const fenceIndex = fence.baseFence.getFenceIndexByDistance(offsetX)
      const dataIndex = fence.getDataIndexByFenceIndex(fenceIndex)

      const frequency = defaultValueX.value.min + dataIndex * step.value

      emit('selectFrequency', {
        fenceIndex,
        dataIndex,
        value: props.scaleX.transform(frequency),
        baseEvent: e,
        sceneEvent: event,
        mouseOrTouch: Listen.TOUCH
      })
    }
  }

  let themeKey

  onMounted(() => {
    if (spectrumDom.value) {
      const engine = new Engine(spectrumDom.value)

      const ctx = new WebGl(engine.canvas, { backgroundColor: UseTheme.theme.nl.backgroundColor })

      spectrumScene.value = new Scene<ISpectrumScanAndFallSpectrumPool>(engine, ctx)

      // 主题注册
      themeKey = UseTheme.on(() => {
        ctx.options.backgroundColor = UseTheme.theme.nl.backgroundColor

        setAxisYColor()

        // 背景网格颜色
        setLineColor()

        createShaderSource()
        rectangleProgram.add(rectangle.mesh)

        // 线条颜色
        const colors = UseTheme.theme.SpectrumAndFall
        for (const [key, line] of lineManager) {
          const name = `${key}Color`
          line.u_color = colors[name]
          line.mesh.setData('u_color', line.u_color)
        }

        controls.value.forEach(el => {
          const key = el.paramName + 'Color'
          if (el.activeColor !== undefined && key in colors) {
            el.activeColor = UseTheme.transColor(colors[key], true)
          }
        })

        // 线条着色器排到后面
        spectrumScene.value!.removeProgram(lineProgram.id)
        spectrumScene.value!.addProgram(lineProgram)

        render()
      })

      const fence = LayersFence.create(spectrumScene.value)

      fence.afterRefresh.add(() => {
        const fence = spectrumScene.value!.fence as LayersFenceType
        // fenceCount数量变化导致坐标集变化
        if (fenceCount !== fence.baseFence.count) {
          fenceCount = fence.baseFence.count

          refreshByFenceCountchange()

        }
        changeInterval()
      })

      fence.afterTrans.add(() => {
        render()
      })

      fence.afterZoom.add(() => {
        changeInterval()
        render()
      })

      zoomTrans = new ZoomTrans(spectrumScene.value)

      // 双击反出选中频率
      const dblclickTag = new Tag(spectrumScene.value.container, {
        direction: Fence.VERTICAL
      })

      spectrumScene.value.event.mousedown.add(() => {
        dblclickTag.remove()
      })

      spectrumScene.value.event.touchstart.add(() => {
        dblclickTag.remove()
      })

      spectrumScene.value.event.dblclick.add((e, type) => {
        if (spectrumScene.value && usingData.value.time > 0) {
          const fence = spectrumScene.value.fence as LayersFenceType
          const event = spectrumScene.value.event
          const offsetX = type === Listen.MOUSE ? event.mousePosition!.offsetX : event.touchPosition.get(0)!.offsetX

          // 双击位置显示
          dblclickTag.append()
          dblclickTag.setPosition({ offsetX, offsetY: 0 }, fence)
          const result = dblclickTag.magnetByMax(fence, toolTip.magnetGroup!)

          if (result) {
            const fenceIndex = result.fenceIndex!
            const dataIndex = fence.getDataIndexByFenceIndex(fenceIndex)

            const frequency = defaultValueX.value.min + dataIndex * step.value


            emit('selectFrequency', {
              fenceIndex,
              dataIndex,
              value: props.scaleX.transform(frequency),
              baseEvent: e,
              sceneEvent: event,
              mouseOrTouch: type
            })
          }
        }
      })

      measureTool = new Measure(spectrumScene.value, {
        region: {
          showTags: new Set([Region.CENTER, Region.TOP, Region.BOTTOM, Region.LEFT, Region.RIGHT])
        } 
      })

      measureTool.afterTrigger.set('spectrum', (position) => {
        measurePosition.value = new Map(position)
      })

      measureTool.afterClose.set('spectrum', () => {
        measurePosition.value = undefined

        if (btnValues.celiang) btnValues.celiang = false
      })

      measureTool.infoTag.instance.afterMount.set('spectrum', () => {
        disableMeasureInfo = true
      })

      if (btnValues.celiang) measureTool.open()

      // 双门限
      dbThreshold = new Threshold(spectrumScene.value.container, {
        centerTag: { type: Threshold.TOP_AND_BOTTOM, drag: true },
        infoTag: {
          width: 270
        },
        showTags: new Map([[
          Threshold.TOP,
          {
            backgroundColor: UseTheme.theme.var.tagBgColor,
            selectColor: UseTheme.theme.var.tagSelectColor,
            offset: 0.3
          }
        ],[
          Threshold.BOTTOM,
          {
            backgroundColor: UseTheme.theme.var.tagBgColor,
            selectColor: UseTheme.theme.var.tagSelectColor,
            offset: 0.7
          }
        ]]),
        scene: spectrumScene.value
      })

      dbThreshold.afterTrigger.set('spectrum', (position) => {
        dbThresholdPosition.value = new Map(position)
      })

      dbThreshold.afterClose.set('spectrum', () => {
        dbThresholdPosition.value = undefined
        dbThresholdValue.value = { min: spectrumYvalue.value.min, max: spectrumYvalue.value.max }

        if (btnValues.shaixuan) btnValues.shaixuan = false
      })

      dbThreshold.afterEnd.set('spectrum', (position) => {
        const r = getDbThresholdValue(position)

        dbThresholdValue.value = r
      })

      dbThreshold.afterOpen.set('spectrum', (position) => {
        dbThresholdPosition.value = new Map(position)

        const r = getDbThresholdValue(position)

        dbThresholdValue.value = r
      })

      dbThreshold.infoTag!.afterMount.set('spectrum', () => {
        disableDbThresholdInfo = true
      })

      if (btnValues.shaixuan) dbThreshold.open()

      // 单门限
      singleThreshold = new Threshold(spectrumScene.value.container, {
        centerTag: { type: Threshold.BOTTOM_TO_TOP },
        infoTag: {
          width: 200
        },
        showTags: new Map([[
          Threshold.BOTTOM,
          {
            backgroundColor: UseTheme.theme.var.tagBgColor,
            selectColor: UseTheme.theme.var.tagSelectColor,
            offset: 0.7
          }
        ]]),
        scene: spectrumScene.value
      })

      singleThreshold.afterTrigger.set('spectrum', (position) => {
        singleThresholdPosition.value = new Map(position)
      })

      singleThreshold.afterClose.set('spectrum', () => {
        singleThresholdPosition.value = undefined

        singleThresholdValue.value = { value: spectrumYvalue.value.min }

        if (btnValues.menxian) btnValues.menxian = false
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

      singleThreshold.infoTag!.afterMount.set('spectrum', () => {
        disableSingleThresholdInfo = true
      })

      if (btnValues.menxian) singleThreshold.open()

      // 卡尺
      caliper = new Caliper(spectrumScene.value.container, {
        scene: spectrumScene.value
      })

      caliper.infoTag!.remove()

      caliper.afterClose.set('caliper', () => {
        btnValues.biaozhu = false
        caliperPosition.value = undefined

        if (marker.value) {
          marker.value.clear()
        }
      })

      caliper.afterTrigger.set('caliper', (p) => {
        caliperPosition.value = { ...p }

        caliper.infoTag!.append()
      })

      caliper.afterEnd.set('caliper', (p) => {
        caliperPosition.value = { ...p }
        
        caliper.infoTag!.remove()

        if (usingData.value.time > 0) {

          const fence = spectrumScene.value!.fence as LayersFenceType
          const dataIndex = fence.getDataIndexByDistance(p.offsetMiddlePCTX)
          // 频率
          const frequency = defaultValueX.value.min + dataIndex * step.value

          addMarker([props.scaleX.transform(frequency)])
          setMarkerPoints(spectrumYvalue.value, new Map([['0', { data: usingData.value.data }]]))
        }
      })

      if (btnValues.biaozhu) caliper.open()

      // marker标注
      marker.value = new Marker(spectrumScene.value)
      marker.value.closeButton.style.top = '60px'

      marker.value.afterAdd.set('0', (markers) => {
        markerManagers.value = new Set()
        markers.forEach((marker, dataIndex) => {
          markerManagers.value.add({ dataIndex, frequency: marker.properties.frequency, add: true })
        })
      })

      marker.value.afterRemove.set('0', (markers) => {
        markerManagers.value = new Set()
        markers.forEach((marker, dataIndex) => {
          markerManagers.value.add({ dataIndex, frequency: marker.properties.frequency, add: false })
        })
      })
      
      spectrumScene.value.disposeManager.add(() => {
        marker.value!.dispose()
      })

      // 绘制背景线条网格
      setGridProgram(spectrumScene.value)

      // 绘制矩形柱着色器
      createShaderSource()

      const rectangleOptions: IMeshInputOptions = {
        drawArrays: {
          mode: Mesh.TRIANGLES,
          count: 0
        }
      }
      rectangle = {
        mesh: new Mesh(spectrumScene.value, rectangleOptions),
        a_position: new Float32Array(),
        a_color: new Float32Array(),
        samplingData: new Float32Array()
      }

      spectrumScene.value.addProgram(rectangleProgram)

      rectangle.mesh
        .setData('u_min_range', u_min_range)

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
          gl_Position = u_conversion * vec4(a_positionX, y, 1.0, 1.0);
        }
        `
      const lineFragmentSource = `
        precision mediump float;
        uniform vec3 u_color;
        void main () {
          gl_FragColor = vec4(u_color, 1.0);
        } `
      const lineVertexShader = new Shader(spectrumScene.value, Shader.VERTEX_SHADER, lineVertexSorce)
      const lineFragmentShader = new Shader(spectrumScene.value, Shader.FRAGMENT_SHADER, lineFragmentSource)
      
      lineProgram = new Program(lineVertexShader, lineFragmentShader)
      const lineColor = UseTheme.theme.SpectrumAndFall
      lineManager.set(Controls.baoluotu, createLine(lineColor.baoluotuColor)!) 

      lineManager.set(Controls.fengzhi, createLine(lineColor.fengzhiColor)!)

      lineManager.set(Controls.junzhi, createLine(lineColor.junzhiColor)!)

      lineManager.set(Controls.guzhi, createLine(lineColor.guzhiColor)!)

      spectrumScene.value.addProgram(lineProgram)

      // 容器尺寸变化
      spectrumScene.value.resizeObservers.set('spectrum', () => {
        if (spectrumDom.value!.clientWidth !== spectrumScene.value!.fence!.expectCount) {
          // 刷新
          if (spectrumScene.value) {
            if (spectrumScene.value.canvas.clientWidth === 0) return
            const fence = spectrumScene.value.fence! as LayersFenceType
      
            fence.refresh(spectrumScene.value.canvas.clientWidth, inputDataLength.value)
          }
        }

        render()
      })
      
      // 游离显示信息
      toolTip = new ToolTip(spectrumScene.value, {
        type: ToolTip.VERTICAL,
        verticalTag: {
          lock: { show: false }
        },
        infoTag: {
          borderRadius: props.useSelectFrequency ? '10px 10px 0 0' : '10px'
        }
      })

      if (props.useSelectFrequency) {
        // 添加一个下拉按钮
        const tipButton = document.createElement('button')
        tipButton.innerText = '使用频率'
        toolTip.infoTag.instance.el.appendChild(tipButton)
        tipButton.style.cssText = `
        width: 100%;
        font-size: 20px;
        padding: 5px 0;
        margin-top: 2px;
        box-sizing: border-box;
        background-color: ${UseTheme.theme.var.tipBgColor};
        color: ${UseTheme.theme.var.tipColor};
        border-radius: 0 0 10px 10px;
      `
        tipButton.addEventListener(Listen.TOUCHSTART, (e) => {
          e.stopPropagation()
          e.preventDefault()
          getSelectFrequency(e)
        })
        // 点击锁定按钮，返出选择的值
        // toolTip.verticalTag!.lock!.addEventListener(Listen.TOUCHSTART, (e) => {
        //   getSelectFrequency(e)
        // })
      }

      toolTip.afterActive.set('spectrum', (p) => {
        toolTipPosition.value = p.offsetMiddlePCTX
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

      // 内部数据挂载
      // @ts-ignore
      spectrumScene.value.pool = reactive({
        step,
        spectrumXvalue,
        spectrumYvalue,
        usingData,
        dbThreshold,
        dbThresholdPosition,
        dbThresholdValue,
        singleThreshold,
        singleThresholdPosition,
        singleThresholdValue,
        toolTip,
        toolTipPosition,
        statisticalBuffer,
        btnValues,
        measureTool,
        measurePosition,
        marker,
        markerManagers,
        markerManagerTrigger,
        addMarker
      })
    }
  })

  onBeforeUnmount(() => {
    if (spectrumScene.value) {
      UseTheme.off(themeKey)

      spectrumScene.value.dispose()
    }
  })

  return {
    axisYColor,
    controls,
    btnValues,
    scanIndex,
    inputData,
    usingData,
    spectrumAxisX,
    spectrumAxisY,
    afterStaticData,
    spectrumDom,
    inputDataLength,
    spectrumYvalue,
    spectrumXvalue,
    statisticalBuffer,
    spectrumScene,
    showTagsText,
    peakIcons,
    dbThresholdValue,
    marker,
    markerManagerTrigger,
    markerManagers,
    axisYCahnge,
    axisYChange,
    resetSpectrum
  }
}

/**
 * @description: 扫描频谱类数据处理
 */
export class ScanSpectrumData {
  /**
   * @description: 原始数据统计计算
   * @param {Float32Array} data 原始数据
   * @param {ISpectrumBuffer} buffer 统计结果缓存区
   * @return {*}
   */  
  static statisticalData (data: ISpectrumScanInputData, scanIndex: number, buffer: ISpectrumStatisticalBuffer) {
    const max = buffer.max
    const min = buffer.min
    const sum = buffer.sum
    const mean = buffer.mean
    const input = data.data

    const count = buffer.count.get(data.frequency)!
    if (buffer.input[scanIndex] !== Shader.BACKGROUND_COLOR) {
      const length = input.length
      let item, num
      for (let i = 0; i < length; i++) {
        item = scanIndex + i
        num = input[i]
        max[item] = Math.max(max[item], num) // 最大值计算
        min[item] = Math.min(min[item], num) // 最小值计算
        sum[item] += Math.pow(10, num / 20) // 累积计算
        mean[item] = Math.log10(sum[item] / count) * 20 // 均值
      }
    } else {
      max.set(input, scanIndex)
      min.set(input, scanIndex)
      // sum需指数计算再赋值
      const inputLen = input.length
      const sumData = new Float32Array(inputLen)
      const meanData = new Float32Array(inputLen)
      for (let j = 0; j < inputLen; j++) {
        sumData[j] = Math.pow(10, input[j] / 20)
        meanData[j] = Math.log10(sumData[j]) * 20
      }
      sum.set(sumData, scanIndex)
      mean.set(meanData, scanIndex)
    }
    buffer.input.set(input, scanIndex)
  }
}