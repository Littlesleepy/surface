/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-05 12:00:04
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\core\Fence\LayersFence.ts
 * @Description: 
 */
import { reactive, toRefs } from 'vue'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { Fence, IFenceOptions } from './Fence'
import { FencesType, IFence, IFenceSate } from './types'

interface ISate extends IFenceSate {
  /**
   * @description: 抽取层次
   */  
  layers: Array<number>
  /**
   * @description: 当前抽取层次
   */  
  currentLayer: number
  /**
   * @description: 当前抽取间隔
   */
  currenSection: number
  /**
   * @description: 是否进行数据间隔抽取，true抽取，false没有抽取
   */  
  sampling: boolean
  /**
   * @description: 抽出的数据在原数据中的索引集合，长度与fence.count应一致
   */  
  cutDataIndexArr: Float32Array
  /**
   * @description: 抽出的数据在原数据中的索引是否已设置
   */ 
  cutDataIndexArrSet: boolean
}

export interface ILayersFenceOptions {
  direction?: string
  eachPieceMaxWidth?: number
  coordinateTrans?: HTMLElement
}

/**
 * @description: 判断是否是LayersFenceType
 * @param {FencesType} fence
 * @return {*}
 */
export function isLayersFenceType (fence: FencesType): fence is LayersFenceType {
  return (<LayersFenceType>fence).sampling !== undefined
}

export type LayersFenceType = ReturnType<typeof LayersFence.create>

export class LayersFence {
  /**
   * @description: 创建分层显示的fence
   * @param {ILayerFenceOptions} options 配置
   * @return {*}
   */ 
  static readonly create = function (scene: Scene, options?: ILayersFenceOptions) {
    const stateSource: ISate = {
      layers: [],
     
      currentZoom: 1,
  
      currentLayer: 0,

      currenSection: 0,

      expectCount: 0,
 
      sampling: false,

      cutDataLength: 0,

      practicalCount: 0,
 
      cutDataIndexArr: new Float32Array(),

      cutDataIndexArrSet: false,

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
      if (expectCount === 0 || practicalCount === 0) return
      state.expectCount = expectCount
      state.practicalCount = practicalCount

      if (practicalCount < expectCount) { expectCount = practicalCount }

      let section = Math.ceil(practicalCount / expectCount)
      state.layers = []
      // 缩放取值数组
      while (section >= 1) {
        state.layers.push(section)
        section = Math.floor(section / 2)
      }

      const count = Math.ceil(practicalCount / state.layers[0])
      baseFence.refresh(count)

      state.currentZoom = 1
      state.currentLayer = 0
      state.currenSection = state.layers[0]
      state.sampling = state.currenSection === 1 ? false : true
      state.cutDataLength = practicalCount
      state.cutDataIndexArr = new Float32Array(count)
      state.cutDataIndexArrSet = false
      state.cutDataStartIndex = 0
    }
    /**
     * @description: 设置抽取数据的索引，（注意：具体索引赋值自行操作）
     * @return {*} 存放抽取出数据的索引
     */    
    function setCutDataIndexArr () {
      state.cutDataIndexArrSet = true
      return state.cutDataIndexArr
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

      /**
       * @description: 获取当前缩放的层级
       * @param {number} zoom 当前缩放的倍数
       * @return {*}
       */      
      getCurrentLayer (zoom: number) {
        return Math.log(zoom) / Math.log(2)
      },
     
      zoomFromDistance (multiple: number, distance: number) {
        if (state.cutDataIndexArr.length === 0 || state.currentZoom * multiple < 1 || multiple === 1) return 1

        if (baseFence.eachPieceWidth * multiple * state.expectCount > state.options.eachPieceMaxWidth) {
          multiple = Math.floor(state.options.eachPieceMaxWidth / (baseFence.eachPieceWidth * state.expectCount))
          multiple = baseFence.getMaxMultiple(multiple)
          if (multiple === 1) return 1
        }

        state.currentZoom *= multiple
        // 保存旧的index
        const fenceIndex = baseFence.getFenceIndexByDistance(distance)

        state.currentLayer = methods.getCurrentLayer(state.currentZoom)
        state.currenSection = state.layers[state.currentLayer] ? state.layers[state.currentLayer] : 1
        state.sampling = state.currenSection === 1 ? false : true

        // fence缩放
        if (state.currentLayer >= state.layers.length || (state.currentLayer === state.layers.length - 1 && multiple < 1)) {
          baseFence.zoomFromIndex(multiple, fenceIndex)
        }

        state.cutDataLength = baseFence.visibleLength * state.currenSection
        if (state.cutDataLength > state.practicalCount) state.cutDataLength = state.practicalCount

        const dataIndex = state.cutDataIndexArr[fenceIndex]
        // 更新index
        const nextfenceIndex = baseFence.getFenceIndexByDistance(distance)
        let cutStartIndex = dataIndex - (nextfenceIndex - baseFence.visibleIndex.min) * state.currenSection

        if (cutStartIndex < 0 || state.currentZoom === 1) cutStartIndex = 0

        if (cutStartIndex + state.cutDataLength > state.practicalCount - 1 && state.currentZoom !== 1) {
          cutStartIndex = state.practicalCount - 1 - state.cutDataLength
        }
        state.cutDataStartIndex = cutStartIndex

        for (const callBack of methods.afterZoom) callBack(multiple)

        for (const callBack of methods.afterZoomOrTrans) callBack(Fence.ZOOM, multiple)

        return multiple
      },

      transByCount (count: number) {
        if (count === 0) return 0
        const moveFenceCount = baseFence.transByCount(count)

        if (moveFenceCount !== 0) count = moveFenceCount
        
        const realMOve = state.cutDataStartIndex - count * state.currenSection
        if (count > 0) { // 向max
          state.cutDataStartIndex = realMOve < 0 ? 0 : realMOve
        } else { // 向min
          const minStart = state.practicalCount - state.cutDataLength
          state.cutDataStartIndex = realMOve > minStart ? minStart : realMOve
        }

        for (const callBack of methods.afterTrans) callBack(count)
        for (const callBack of methods.afterZoomOrTrans) callBack(Fence.TRANS, count)

        return count
      },

      transByDistance (distance: number) {
        const result = baseFence.transByDistance(distance)

        if (result.count !== 0) {
          const count = result.count

          const realMOve = state.cutDataStartIndex - count * state.currenSection
          if (count > 0) { // 向max
            state.cutDataStartIndex = realMOve < 0 ? 0 : realMOve
          } else { // 向min
            const minStart = state.practicalCount - state.cutDataLength
            state.cutDataStartIndex = realMOve > minStart ? minStart : realMOve
          }
        } else {
          let count = Math.floor(Math.abs(distance) / baseFence.eachPieceWidth / 2)
          if (count !== 0 && distance < 0) {
            count = -count
          }
          state.cutDataStartIndex -= count
          if (state.cutDataStartIndex < 0) state.cutDataStartIndex = 0
          if (state.cutDataStartIndex + state.cutDataLength > state.practicalCount - 1) {
            state.cutDataStartIndex = state.practicalCount - 1 - state.cutDataLength
          }
        }

        if (result.change) {
          for (const callBack of methods.afterTrans) callBack(result.count)
          for (const callBack of methods.afterZoomOrTrans) callBack(Fence.TRANS, result.count)
        }

        return result.count
      },
      
      getDataIndexByFenceIndex (index: number) {
        if (state.cutDataIndexArr) {
          const dataIndex = state.cutDataIndexArr[index]
          if (dataIndex !== undefined) {
            return dataIndex
          } else {
            throw new Error(`索引${index}的值不存在`)
          }
        } else {
          throw new Error ('未设置cutDataIndexArr')
        }
      },

      getDataIndexByDistance(distance: number) {
        const index = baseFence.getFenceIndexByDistance(distance)
        return methods.getDataIndexByFenceIndex(index)
      }
    }

    const result = reactive({
      baseFence,
      ...toRefs(state),
      ...methods,
      /**
       * @description: 设置抽取数据的索引，（注意：具体索引赋值自行操作）
       * @return {*} 存放抽取出数据的索引
       */
      setCutDataIndexArr
    })


    if (scene.fence === undefined) scene.fence = result

    return result
  }
}