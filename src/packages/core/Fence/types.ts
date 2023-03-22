import { FluidFenceType } from './FluidFence'
import { LayerFenceType } from './LayerFence'
import { LayersFenceType } from './LayersFence'

export interface IFenceSate {
  /**
   * @description: 期望的fence数量
   */      
  expectCount: number
  /**
   * @description: 当前缩放大小
   */      
  currentZoom: number
  /**
   * @description: 当前需要截取的数据长度
   */
  cutDataLength: number
  /**
   * @description: 实际数据长度
   */
  practicalCount: number
  /**
   * @description: 当前需要截取的数据起始索引
   */
  cutDataStartIndex: number
  /**
   * @description: fence方向
   */
  direction: string
  /**
   * @description: 配置
   */
  options: {
    /**
     * @description: 单个fence最大像素宽度
     */
    eachPieceMaxWidth: number
    /**
     * @description: 是否转换到2D坐标系，如果该值存在，则转换
     */
    coordinateTrans: undefined | HTMLElement
  }
}

export interface IFence {
  /**
   * @description: 刷新
   * @param {number} expectCount 期望的fence数量
   * @param {number} practicalCount 实际数据数量
   * @return {*}
   */   
  refresh (expectCount: number, practicalCount: number): void
  /**
   * @description: fence刷新后回调函数集
   */      
  afterRefresh: Set<() => void>,
  /**
   * @description: 缩放或者平移完成后的回调函数集
   */ 
  afterZoomOrTrans: Set<(key: string, num: number) => void>
  /**
   * @description: 缩放完成后的回调函数集
   */ 
  afterZoom: Set<(multiple: number) => void>
  /**
   * @description: 平移完成后的回调函数集
   */ 
  afterTrans: Set<(count: number) => void>
  /**
   * @description: 
   * @param {number} multiple 缩放倍数，必须是2或0.5的幂次方
   * @param {number} distance 缩放位置，沿fence方向归一化到0-1的数
   * @return {number} 实际缩放倍数
   */  
  zoomFromDistance (multiple: number, distance: number): number
  /**
   * @description: 移动fence
   * @param {number} count 移动fence的数量，大于0向max移动，小于零向min移动
   * @return {number} 平移的实际数量
   */
  transByCount (count: number): number
  /**
   * @description: 依据距离移动fence，基于fence坐标系
   * @param {number} distance 移动fence的距离，大于0向max移动，小于零向min移动
   * @return {number} 实际移动的数量
   */
  transByDistance (distance: number): number

  /**
   * @description: 根据截取数据中的索引获取对应数据在数据源中的索引
   * @param {number} index fence索引
   * @return {number | undefined}
   */  
  getDataIndexByFenceIndex (index: number): number
  /**
   * @description: 沿fence方向的指定位置获取对应数据在数据源中的索引
   * @param {number} distance 沿fence方向的指定位置
   * @return {number | undefined}
   */ 
  getDataIndexByDistance (distance: number): number
  /**
   * @description: 获取当前缩放的层级
   * @param {number} zoom 当前缩放的倍数
   * @return {*}
   */      
   getCurrentLayer (zoom: number): number
}

export type FencesType = LayerFenceType | LayersFenceType | FluidFenceType