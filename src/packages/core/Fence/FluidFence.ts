import { reactive, toRefs } from 'vue'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { Fence, IFenceOptions } from './Fence'
import { FencesType, IFence, IFenceSate } from './types'

interface ISate extends IFenceSate {
  /**
   * @description: 流动数据最后一位的索引
   */  
  lastDataIndex: number

  options: {
    /**
     * @description: 单个fence最大像素宽度
     */
    eachPieceMaxWidth: number
    /**
     * @description: 单个fence最大像素宽度
     */
    defaultZoom: number
    /**
     * @description: 是否转换到2D坐标系，如果该值存在，则转换
     */
    coordinateTrans: undefined | HTMLElement
  }
}

export interface IFluidFenceOptions {
  direction?: string
  eachPieceMaxWidth?: number
  defaultZoom?: number
  coordinateTrans?: HTMLElement
}

/**
 * @description: 判断是否是FluidFenceType
 * @param {FencesType} fence
 * @return {*}
 */
export function isFluidFenceType (fence: FencesType): fence is FluidFenceType {
  return (<FluidFenceType>fence).lastDataIndex !== undefined
}

export type FluidFenceType = ReturnType<typeof FluidFence.create>

export class FluidFence {
  /**
   * @description: 创建流动类型fence
   * @param {ILayerFenceOptions} options 配置
   * @return {*}
   */
  static readonly create = function (scene: Scene, options?: IFluidFenceOptions) {
    const stateSource: ISate = {     
      currentZoom: 1,

      expectCount: 0,

      cutDataLength: 0,

      practicalCount: 0,

      cutDataStartIndex: 0,

      direction: Fence.TRANSVERSE,

      lastDataIndex: -1,

      options: {
        eachPieceMaxWidth: 50,
        defaultZoom: 4,
        coordinateTrans: undefined
      }
    }

    const state = reactive(stateSource)

    if (options) {
      Public.copyValueFromObject(state.options, options)
      if (options.direction) state.direction = options.direction
    }

    const fenceOptions: IFenceOptions = {
      direction: state.direction,
      coordinateTrans: state.options.coordinateTrans
    }

    const baseFence = Fence.create(fenceOptions)

    function _init (count: number) {
      state.expectCount = count
      baseFence.refresh(count)

      state.currentZoom = 1
      state.cutDataLength = count
      state.practicalCount = count
      state.cutDataStartIndex = 0
      state.lastDataIndex = -1
      // 默认靠左
      methods.zoomFromDistance(state.options.defaultZoom, 0)
      // 左边界靠齐-1
      const distance = -1 - (baseFence.pieces[0] - baseFence.eachPieceWidth)
      baseFence.transByDistance(distance)
    }

    const methods: IFence & {
      /**
       * @description: 通过数据长度向min方向移动fence
       * @param {number} count 移动的数量，必须大于零
       */
      transByDataLength: (count: number) => void
    } = { 
      refresh (expectCount: number, practicalCount: number) {
        _init(practicalCount)

        for (const fun of methods.afterRefresh) {
          fun()
        }
      },  

      afterRefresh: new Set<() => void>(),   

      afterZoomOrTrans: new Set<(key: string, num: number) => void>(),

      afterZoom: new Set<(multiple: number) => void>(),

      afterTrans: new Set<(count: number) => void>(),

      getCurrentLayer (zoom: number) {
        return Math.log(zoom) / Math.log(2)
      },
     
      zoomFromDistance (multiple: number, distance: number) {
        if (multiple === 1 || state.currentZoom * multiple < 1) return 1
    
        if (baseFence.eachPieceWidth * multiple * state.expectCount > state.options.eachPieceMaxWidth) {
          multiple = Math.floor(state.options.eachPieceMaxWidth / (baseFence.eachPieceWidth * state.expectCount))
          multiple = baseFence.getMaxMultiple(multiple)
          if (multiple === 1) return 1
        }
        // 改变zoom
        state.currentZoom *= multiple
        // fence缩放
        baseFence.zoomFromDistance(multiple, distance)
    
        state.cutDataLength = baseFence.visibleLength
        state.cutDataStartIndex = baseFence.visibleIndex.min
    
        for (const callBack of methods.afterZoom) callBack(multiple)
        for (const callBack of methods.afterZoomOrTrans) callBack(Fence.ZOOM, multiple)
    
        return multiple
      },

      transByCount (count: number) {
        if (count === 0) return 0
        count = baseFence.transByCount(count)
        if (count === 0) return 0
        state.cutDataStartIndex = baseFence.visibleIndex.min
    
        for (const callBack of methods.afterTrans) callBack(count)
        for (const callBack of methods.afterZoomOrTrans) callBack(Fence.TRANS, count)
    
        return count
      },

      transByDistance (distance: number) {
        const result = baseFence.transByDistance(distance)
        state.cutDataStartIndex = baseFence.visibleIndex.min

        if (result.change) {
          for (const callBack of methods.afterTrans) callBack(result.count)
          for (const callBack of methods.afterZoomOrTrans) callBack(Fence.TRANS, result.count)
        }

        return result.count
      },

      transByDataLength (count: number) {
        const maxIndex = state.practicalCount - 1
        if (count > 0 && state.lastDataIndex < maxIndex) {
          if (state.lastDataIndex >= baseFence.visibleIndex.max) {

            if (state.lastDataIndex + count > maxIndex) count = maxIndex - state.lastDataIndex

            methods.transByCount(-count)
          }

          state.lastDataIndex += count
        }
      },
      
      getDataIndexByFenceIndex (index: number) {
        return index
      },
    
      getDataIndexByDistance (distance: number) {
        const index = baseFence.getFenceIndexByDistance(distance)
        return index
      }
    }

    const result = reactive({
      baseFence,
      ...toRefs(state),
      ...methods
    })

    if (scene.fence === undefined) scene.fence = result

    return result
  }
}