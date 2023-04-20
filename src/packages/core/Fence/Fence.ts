/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-20 11:47:25
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\core\Fence\Fence.ts
 * @Description: 
 */
import { Matrix4 } from '../Math'
import { reactive, ref, toRefs } from 'vue'
import { Public } from '../Tools'

export type FenceType = Readonly<ReturnType<typeof Fence.create>>

export interface IFenceOptions {
  /**
   * @description: 是否转换到2D坐标系，如果该值存在，则转换
   */
  coordinateTrans?: HTMLElement
  /**
   * @description: fence方向
   */  
  direction?: string
}

interface ISate {
  /**
   * @description: fence数量
   */
  count: number
  /**
   * @description: 每个fence宽度比例[0-1]
   */      
  eachPieceWidth: number
  /**
   * @description: 每个fence初始化的宽度
   */      
  eachPieceWidthInitial: number
  /**
   * @description: fence集合
   */      
  pieces: Float32Array
  /**
   * @description: fence集合转换为2D绘图坐标系
   */      
  piecesTrans: Float32Array
  /**
   * @description: 初始fence集合
   */      
  piecesInitial: Float32Array
  /**
   * @description: fence方向
   */
  direction: string
  /**
   * @description: fence矩阵刻画
   */      
  modelMatrix: Matrix4
  /**
    * @description: 视图可见fence最大和最小索引
    */      
  visibleIndex: {
    min: number
    max: number
  },
  /**
   * @description: 可视fence数量
   */ 
  visibleLength: number
  /**
   * @description: 配置
   */      
  options: {
    /**
     * @description: 是否转换到2D坐标系，如果该值存在，则转换
     */
    coordinateTrans: undefined | HTMLElement
  }
}

export class Fence {
  /**
   * @description: 横向
   */  
  static readonly TRANSVERSE = 'transverse'
  /**
  * @description: 竖向
  */ 
  static readonly VERTICAL = 'vertical'
  /**
  * @description: 缩放
  */  
  static readonly ZOOM = 'zoom'
  /**
  * @description: 平移
  */
  static readonly TRANS = 'trans'
  /**
   * @description: 创建fence
   * @param {number} count fence数量
   * @param {*} direction 方向
   * @return {*}
   */  
  static readonly create = function (options?: IFenceOptions) {

    const stateSource: ISate = {
      count: 0,
    
      eachPieceWidth: 0,
   
      eachPieceWidthInitial: 0,
   
      pieces: new Float32Array(),
    
      piecesTrans: new Float32Array(),
     
      piecesInitial: new Float32Array(),

      direction: Fence.TRANSVERSE,
    
      modelMatrix: new Matrix4(),
     
      visibleIndex: reactive({
        min: 0,
        max: 0
      }),

      visibleLength: 0,
    
      options: {
        coordinateTrans: undefined
      }
    }

    const state = reactive(stateSource)

    if (options) {
      Public.copyValueFromObject(state.options, options)
      if (options.direction) state.direction = options.direction
    }
    
    function _init (count: number) {
      state.visibleIndex.min = 0
      state.visibleIndex.max = count - 1
      state.visibleLength = count
      state.count = count
      state.eachPieceWidth = state.eachPieceWidthInitial = 1 / count // 一个数据在webgl中宽度比例
      // 刻度尺
      const _pieces = new Float32Array(count)
      const _eachPieceWidth = state.eachPieceWidth
      for (let i = 0; i < count; i++) { _pieces[i] = -1 + (2 * i + 1) * _eachPieceWidth }
      state.pieces = _pieces
  
      state.piecesInitial = new Float32Array(_pieces)
  
      state.modelMatrix.setIdentity()

      if (state.options.coordinateTrans) {
        state.piecesTrans = new Float32Array(count)
      }

      _piecesTrans()
    }
    /**
     * @description: 转换2D绘图坐标系
     */    
    function _piecesTrans () {
      if (state.options.coordinateTrans) {
        const width = state.direction === Fence.TRANSVERSE ? state.options.coordinateTrans.clientWidth : state.options.coordinateTrans.clientHeight
        let fenceIndex = state.visibleIndex.min
        const end = state.visibleIndex.max + 1
        for (fenceIndex; fenceIndex < end; fenceIndex++) {
          state.piecesTrans[fenceIndex] = methods.getFenceMiddlePositionByFenceIndex(fenceIndex) * width
        }
      }
    }
  
    function _setVisibleIndex () {
      let min, max, first, leftBorder, rightBorder
      const pieces = state.pieces
      const eachPieceWidth  = state.eachPieceWidth
  
      for (let i = 0, len = state.count; i < len; i++) {
        first = pieces[i]
        leftBorder = first - eachPieceWidth
        rightBorder = first + eachPieceWidth
        if (leftBorder <= -1 && rightBorder > -1) min = i
        if (leftBorder < 1 && rightBorder >= 1) max = i
      }
      if (min === undefined) min = 0
      if (max === undefined) max = state.count - 1
      state.visibleIndex.min = min
      state.visibleIndex.max = max

      state.visibleLength = state.visibleIndex.max - state.visibleIndex.min + 1
    }

    const methods = {
      /**
       * @description: 刷新
       * @param {number} count fence数量
       */    
      refresh (count: number) {
        _init(count)

        for (const fun of methods.afterRefresh) {
          fun()
        }
      },
      /**
       * @description: 基础fence刷新后回调函数集
       */      
      afterRefresh: new Set<() => void>(),
      /**
       * @description: 沿fence方向以min向作为起点的距离（归一化【0-1】）处缩放
       * @param {number} multiple 缩放倍数
       * @param {number} distance 距离【0-1】
       */    
      zoomFromDistance (multiple: number, distance: number) {
        const index = methods.getFenceIndexByDistance(distance)
        methods.zoomFromIndex(multiple, index)
        return index
      },
      /**
       * @description: 沿fence方向以某个fence作为参照物缩放
       * @param {number} multiple 缩放倍数
       * @param {number} fromIndex fence索引
       * @return {*}
       */    
      zoomFromIndex (multiple: number, fromIndex: number) {
        state.eachPieceWidth *= multiple
        if (state.eachPieceWidth < state.eachPieceWidthInitial) return
    
        const len = state.count
        const pieces = state.pieces
        const beforeTrance = pieces[fromIndex]
        const afterTrance = beforeTrance * multiple
        let transValue = afterTrance - beforeTrance
        // 前后两端边界控制
        const moveLx = pieces[0] * multiple - transValue - state.eachPieceWidth
        const moveRx = pieces[len - 1] * multiple - transValue + state.eachPieceWidth
        let addMove = 0
        if (moveLx > -1) { addMove = moveLx + 1 }
        if (moveRx < 1) { addMove = moveRx - 1 }
        transValue += addMove
        for (let j = 0; j < len; j++) { pieces[j] = pieces[j] * multiple - transValue }
    
        // const mat4 = new Matrix4()
        // mat4.setTranslate(-transValue, 0, 0).scale(multiple, 1, 1)
        // mat4.multiply(state.modelMatrix)
        // state.modelMatrix.set(mat4)
        const zoom = state.eachPieceWidth / state.eachPieceWidthInitial
        state.modelMatrix.elements[0] = zoom
    
        const trans = state.pieces[0] - ((-1 + state.eachPieceWidthInitial) * zoom)
        state.modelMatrix.elements[12] = trans
    
        _setVisibleIndex()

        _piecesTrans()
      },
      /**
       * @description: 依据数量移动fence
       * @param {number} count 移动fence的数量，大于0向max移动，小于零向min移动
       * @return {number} 实际移动的数量
       */  
      transByCount (count: number) {
        const pieces = state.pieces
        if (count > 0) { // 向max
          if (state.visibleIndex.min - count < 0) count = state.visibleIndex.min
        } else { // 向min
          if (state.visibleIndex.max - count > state.count - 1) count = state.visibleIndex.max  - (state.count - 1)
        }
        if (count === 0) return 0
        const trans = count * state.eachPieceWidth * 2
    
        for (let i = 0, len = state.count; i < len; i++) {
          pieces[i] += trans
        }
    
        state.visibleIndex.min -= count
        state.visibleIndex.max -= count

        state.visibleLength = state.visibleIndex.max - state.visibleIndex.min + 1
    
        // const mat4 = new Matrix4()
        // mat4.setTranslate(trans, 0, 0)
        // mat4.multiply(state.modelMatrix)
        // state.modelMatrix.set(mat4)
        state.modelMatrix.elements[12] += trans

        _piecesTrans()
    
        return count
      },
      /**
       * @description: 依据距离移动fence，基于fence坐标系
       * @param {number} distance 移动fence的距离，大于0向max移动，小于零向min移动
       * @return {{ count: number, change: boolean }} 实际移动的数量和是否有变化
       */
      transByDistance (distance: number): { count: number, change: boolean } {
        const pieces = state.pieces

        // 边界检测
        if (distance > 0) {
          const left = state.pieces[0] - state.eachPieceWidth
          if (left + distance > -1) distance = -1 - left
        } else {
          const right = state.pieces[state.count - 1] + state.eachPieceWidth

          if (right + distance < 1) distance = 1 - right
        }

        if (distance === 0) return {
          count: 0,
          change: false
        }

        for (let i = 0, len = state.count; i < len; i++) {
          pieces[i] += distance
        }

        let count = Math.floor(Math.abs(distance) / state.eachPieceWidth / 2)
        if (count !== 0 && distance < 0) {
          count = -count
        }

        state.visibleIndex.min -= count
        state.visibleIndex.max -= count
        
        if (state.visibleIndex.min < 0) state.visibleIndex.min = 0
        if (state.visibleIndex.max > state.count - 1) state.visibleIndex.max = state.count - 1

        state.visibleLength = state.visibleIndex.max - state.visibleIndex.min + 1
        state.modelMatrix.elements[12] += distance

        _piecesTrans()
        
        return {
          count,
          change: true
        }
      },
      /**
       * @description: 根据输入倍数转换出最接近输入倍数的2的次幂数
       * @param {number} multiple 倍数 > 1
       * @return {number}
       */  
      getMaxMultiple (multiple: number) {
        if (multiple < 1) return 1
        let result = 1
        while (result <= multiple) {
          result *= 2
        }
        return result / 2
      },
      /**
       * @description: 依据沿fence方向归一化后的比例值获取fence中心对应的沿fence方向归一化后的比例
       * @param {number} distance 距离值
       * @return {number}
       */  
      getFenceMiddlePositionByDistance (distance: number) {
        const index = methods.getFenceIndexByDistance(distance)
        return methods.getFenceMiddlePositionByFenceIndex(index)
      },
      /**
       * @description: 依据沿fence的索引值，获取fence中心对应沿fence方向归一化后的比例
       * @param {number} index fence索引
       * @return {number}
       */ 
      getFenceMiddlePositionByFenceIndex (fenceIndex: number) {
        return methods.fencePositionTrans(state.pieces[fenceIndex])
      },
      /**
       * @description: fence刻度值转换为[0-1]
       * @param {number} position fence刻度值
       * @return {*}
       */      
      fencePositionTrans (position: number) {
        return (position + 1) / 2
      },
      /**
       * @description: 沿fence方向获取指定位置fence的索引
       * @param {number} distance 沿fence方向归一化后的比例
       * @return {number}
       */  
      getFenceIndexByDistance (distance: number): number {
        // if (distance < 0) distance = 0
        // if (distance > 1) distance = 1

        const eachPieceWidth = state.eachPieceWidth
        let ds = (-1 - (state.pieces[state.visibleIndex.min] - state.eachPieceWidth)) * 0.5
        // 计算精度不足可能引发BUG
        if (ds < 0) ds = 0
        const result = distance + ds

        let index = Math.floor(result / eachPieceWidth) + state.visibleIndex.min
        // 计算精度不足可能引发BUG
        if (index >= state.count) index = state.count - 1
        if (index < 0) index = 0

        return index
      }
    }

    const result = reactive({
      ...toRefs(state),
      ...methods
    })

    return result
  }
}