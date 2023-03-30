import { Public } from '../Tools'
import { Fence, IFenceOptions } from './Fence'
import { FencesType, IFence, IFenceSate } from './types'
import { reactive, toRefs } from 'vue'
import { Scene } from '../Scene'

export interface ILayerFenceOptions {
  direction?: string
  eachPieceMaxWidth?: number
  coordinateTrans?: HTMLElement
}

/**
 * @description: 判断是否是LayerFenceType
 * @param {FencesType} fence
 * @return {*}
 */
export function isLayerFenceType (fence: FencesType): fence is LayerFenceType {
  return !('lastDataIndex' in (<LayerFenceType>fence)) && !('sampling' in (<LayerFenceType>fence))
}

export type LayerFenceType = ReturnType<typeof LayerFence.create>

export class LayerFence {
  /**
   * @description: 创建无需分层显示的fence
   * @param {ILayerFenceOptions} options 配置
   * @return {*}
   */  
  static readonly create = function (scene: Scene, options?: ILayerFenceOptions) {
    const stateSource: IFenceSate = {     
      expectCount: 0,
      
      currentZoom: 1,

      cutDataLength: 0,

      practicalCount: 0,

      cutDataStartIndex: 0,

      direction: Fence.TRANSVERSE,

      options: {
        eachPieceMaxWidth: 50,
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

    function _init (expectCount: number, practicalCount: number) {
      baseFence.refresh(practicalCount)

      state.expectCount = expectCount
      state.currentZoom = 1
      state.cutDataLength = practicalCount
      state.practicalCount = practicalCount
      state.cutDataStartIndex = 0
    }

    const methods: IFence = {    
      refresh (expectCount: number, practicalCount: number) {
        _init(expectCount, practicalCount)

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
        if (state.currentZoom * multiple < 1 || multiple === 1) return 1
    
        if (baseFence.eachPieceWidth * multiple * state.expectCount > state.options.eachPieceMaxWidth) {
          multiple = Math.floor(state.options.eachPieceMaxWidth / (baseFence.eachPieceWidth * state.expectCount))
          multiple = baseFence.getMaxMultiple(multiple)
          if (multiple === 1) return 1
        }

        state.currentZoom *= multiple

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