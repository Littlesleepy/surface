import { effectScope, onBeforeUnmount, ref, Ref, watch } from 'vue'
import { Canvas, Engine, LayersFence, LayersFenceType, Scene, Shader, ToolTip, ZoomTrans } from '../core'
import { ESwitchState, IAxisXValue, IAxisYValue, SpectrumData } from '../types'
import { UseTheme } from '../styles'

export interface ILineData {
  data: Float32Array
  color: string
  magnet?: boolean
}

export interface ISampleLinesPool {
  /**
   * @description: 水平方向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
  /**
   * @description: 禁用toolTip的信息计算
   */  
  disableToolTipInfo: boolean
  /**
   * @description: 数据抽取后的索引
   */ 
  cutDataIndexArrMap: Map<string, Float32Array>
  /**
   * @description: 输入数据
   */  
  inputData: Map<string, ILineData>
  /**
   * @description: 步进
   */  
  step: number
  /**
   * @description: 数据长度
   */  
  inputDataLength: number
}

export class SampleLines {
  static readonly create = function (
    props: any,
    sceneDom: HTMLDivElement,
    inputDataLength: Ref<number>,
    inputData: Ref<Map<string, ILineData>>,
    switchLever: Ref<ESwitchState>,
    spectrumYvalue: Ref<IAxisYValue>
  ) {

    let fenceCount = 0

    let lineYvalues = new Float32Array()

    /**
     * @description: 数据抽取后的索引
     */    
    const cutDataIndexArrMap = ref<Map<string, Float32Array>>(new Map())

    const scene = ref<Scene>()

    const engine = new Engine(sceneDom)

    const ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })

    scene.value = new Scene(engine, ctx)

    const themKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.rgb.backgroundColor

      render()
    })

    const fence = LayersFence.create(scene.value, { coordinateTrans: scene.value.canvas })

    const toolTip = new ToolTip(scene.value, {
      type: ToolTip.VERTICAL,
      infoTag: {
        height: 36
      }
    })
    /**
     * @description: 磁吸组
     */    
    let magnetGroup: Array<Float32Array> = []

    toolTip.afterActive.set('spectrum', (p) => {
      if (magnetGroup.length > 0) {
        const r = toolTip.magnetByMax(scene.value!.fence!, magnetGroup)
        if (r) {
          toolTipPosition.value = r.offsetMiddlePCTX
        }
      }
    })

    toolTip.afterTrigger.set('spectrum', (p) => {
      toolTipPosition.value = p.offsetMiddlePCTX
    })

    toolTip.afterHidden.set('spectrum', () => {
      toolTipPosition.value = undefined
    })

    toolTip.infoTag.instance.afterMount.set('spectrum', () => {
      disableToolTipInfo.value = true
    })

    /**
     * @description: 禁用toolTip的信息计算
     */  
    const disableToolTipInfo = ref(false)

    const toolTipPosition = ref<number>()

    fence.afterZoomOrTrans.add(() => {
      render()
    })

    const zoomTrans = new ZoomTrans(scene.value)

    fence.afterRefresh.add(() => {
      const fence = scene.value!.fence as LayersFenceType
      // fenceCount数量变化导致坐标集变化
      if (fenceCount !== fence.baseFence.count) {
        fenceCount = fence.baseFence.count

        refreshByFenceCountchange()
      }
    })

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (scene.value && scene.value.canvas.clientWidth !== scene.value.fence!.expectCount) {
        if (scene.value.canvas.clientWidth === 0) return
        const fence = scene.value.fence! as LayersFenceType
  
        fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
      }

      render()
    })

    /**
     * @description: 如果当前fenceCount发生变化
     */  
    function refreshByFenceCountchange () {
      if (scene.value) {
        const fence = scene.value.fence! as LayersFenceType

        lineYvalues = new Float32Array(fence.baseFence.count)
      }
    }

    // 数据抽取和绘图数据构造
    function watchInputData () {
      if (zoomTrans.options.lock) zoomTrans.options.lock = false
      if (toolTip.options.lock) toolTip.options.lock = false

      let maxLen = 0
      for (const [, value] of inputData.value) {
        maxLen = Math.max(maxLen, value.data.length)
      }

      // 补齐较短数据
      for (const [, value] of inputData.value) {
        if (value.data.length < maxLen) {
          const trans = new Float32Array(maxLen).fill(Shader.BACKGROUND_COLOR)
          trans.set(value.data, 0)
          value.data = trans
        }
      }

      if (inputDataLength.value !== maxLen) {
        inputDataLength.value = maxLen

        // 刷新fence
        if (scene.value) {
          if (scene.value.canvas.clientWidth === 0) return
          const fence = scene.value.fence! as LayersFenceType
    
          fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
        }
      }
    }

    function render () {
      if (scene.value) {
        const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx,
          fence = scene.value.fence as LayersFenceType, height = scene.value!.canvas.clientHeight,
          minY = spectrumYvalue.value.min, rangeY = spectrumYvalue.value.max - minY, end = fence.baseFence.visibleIndex.max + 1,
          lineXvalues = fence.baseFence.piecesTrans
        let fenceIndex, y

        renderCtx.clearScreen()
        // 数据抽取，确保最长数据项最后抽取，保证cutDataIndexArr正确
        magnetGroup = []
        for (const [key, item] of inputData.value) {
          SpectrumData.getSamplingData(item.data, lineYvalues, fence)
          // 是否加入磁吸组
          if (item.magnet) magnetGroup.push(new Float32Array(lineYvalues))

          cutDataIndexArrMap.value.set(key, new Float32Array(fence.cutDataIndexArr))

          // 绘制
          ctx.strokeStyle = item.color
          ctx.lineWidth = 1

          fenceIndex = fence.baseFence.visibleIndex.min
          // y值可能为Shader.BACKGROUND_COLOR，部分线条可能较短
          y = lineYvalues[fenceIndex]
          if (y !== Shader.BACKGROUND_COLOR) {
            ctx.beginPath()

            ctx.moveTo(lineXvalues[fenceIndex], (1 - (y - minY) / rangeY) * height)
            
            for (fenceIndex++; fenceIndex < end; fenceIndex++) {
              y = lineYvalues[fenceIndex]
              if (y !== Shader.BACKGROUND_COLOR) {
                ctx.lineTo(lineXvalues[fenceIndex], (1 - (y - minY) / rangeY) * height)
              }
            }

            ctx.stroke()
          }
        }

        if (magnetGroup.length === 0) {
          magnetGroup.push(lineYvalues)
        }
        scene.value.render2D()
      }
    }

    function refresh () {
      toolTip.options.lock = true
      zoomTrans.options.lock = true

      inputDataLength.value = 0

      cutDataIndexArrMap.value.clear()

      if (scene.value) {
        scene.value.renderCtx.clearScreen()
      }
    }

    const scope = effectScope()

    scope.run(() => {
      watch(inputData, () => {
        watchInputData()
  
        render()
      })
  
      watch(switchLever, (btn) => {
        if (btn === ESwitchState.open) {
          refresh()
        }
      })

      watch(() => props.refresh, refresh)

      watch(spectrumYvalue, render)
    })

    onBeforeUnmount(() => {
      UseTheme.off(themKey)

      scope.stop()
    })


    return {
      scene,
      cutDataIndexArrMap,
      toolTip,
      toolTipPosition,
      disableToolTipInfo
    }
  }
}