/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-07 14:12:48
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-20 13:31:56
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXINoSampleLines\type.ts
 * @Description: 
 */
import { effectScope, onBeforeUnmount, ref, Ref, watch } from 'vue'
import { Canvas, Engine, LayerFenceType, LayerFence, Scene, Shader, ToolTip, ZoomTrans } from '../core'
import { ESwitchState, IAxisXValue, IAxisYValue, ILineData } from '../types'
import { UseTheme } from '../styles'

export interface INoSampleLinesPool {
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

export class NoSampleLines {
  static readonly create = function (
    sceneDom: HTMLDivElement,
    inputDataLength: Ref<number>,
    inputData: Ref<Map<string, ILineData>>,
    switchLever: Ref<ESwitchState>,
    spectrumYvalue: Ref<IAxisYValue>
  ) {

    const scene = ref<Scene>()

    const engine = new Engine(sceneDom)

    const ctx = new Canvas(engine.canvas, { backgroundColor: UseTheme.theme.rgb.backgroundColor })

    scene.value = new Scene(engine, ctx)

    const themKey = UseTheme.on(() => {
      ctx.options.backgroundColor = UseTheme.theme.rgb.backgroundColor

      render()
    })

    const fence = LayerFence.create(scene.value, { coordinateTrans: scene.value.canvas })

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
      if  (magnetGroup.length > 0) {
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

    // 容器尺寸变化
    scene.value.resizeObservers.set('spectrum', () => {
      if (scene.value && scene.value.canvas.clientWidth !== scene.value!.fence!.expectCount) {
        // 刷新
        if (scene.value.canvas.clientWidth === 0) return
        const fence = scene.value.fence! as LayerFenceType
  
        fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
      }

      render()
    })

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
          const fence = scene.value.fence! as LayerFenceType
    
          fence.refresh(scene.value.canvas.clientWidth, inputDataLength.value)
        }
      }
    }

    function render () {
      if (scene.value) {
        const fence = scene.value.fence! as LayerFenceType
        const baseFence = fence.baseFence

        const renderCtx = scene.value.renderCtx as Canvas, ctx = renderCtx.ctx, end = baseFence.visibleIndex.max + 1,
          minValue = spectrumYvalue.value.min, rangeY = spectrumYvalue.value.max - spectrumYvalue.value.min,
          height = scene.value.canvas.clientHeight, lineXvalues = baseFence.piecesTrans

        let fenceIndex, y
        renderCtx.clearScreen()
        magnetGroup = []
        for (const [, item] of inputData.value) {
          // 是否加入磁吸组
          if (item.magnet) magnetGroup.push(item.data)
          // 线条
          fenceIndex = baseFence.visibleIndex.min
          ctx.strokeStyle = item.color
          ctx.lineWidth = 1

          y = item.data[fenceIndex]
          if (y !== Shader.BACKGROUND_COLOR) {
            ctx.beginPath()
            ctx.moveTo(lineXvalues[fenceIndex], (1 - (y - minValue) / rangeY) * height)
            fenceIndex++
            for (; fenceIndex < end; fenceIndex++) {
              y = item.data[fenceIndex]
              if (y !== Shader.BACKGROUND_COLOR) {
                ctx.lineTo(lineXvalues[fenceIndex], (1 - (y - minValue) / rangeY) * height)
              }
            }
            ctx.stroke()
          }
        }

        if (magnetGroup.length === 0) {
          for (const [, item] of inputData.value) {
            magnetGroup = [item.data]
          }
        }
        scene.value.render2D()
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
          toolTip.options.lock = true
          zoomTrans.options.lock = true
  
          inputDataLength.value = 0
  
          if (scene.value) {
            scene.value.renderCtx.clearScreen()
          }
        }
      })

      watch(spectrumYvalue, render)
    })

    onBeforeUnmount(() => {
      UseTheme.off(themKey)
      
      scope.stop()
    })


    return {
      scene,
      toolTip,
      toolTipPosition,
      disableToolTipInfo
    }
  }
}
