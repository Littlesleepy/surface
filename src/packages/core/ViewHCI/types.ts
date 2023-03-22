import { Listen } from '../Event'
import { Scene } from '../Scene'

export interface IViewHCI {
  scene: Scene

  container: HTMLElement

  event: Listen

  options: {
    lock: boolean
  }
  /**
   * @description: 禁用或开启某个事件
   * @param {string} name 事件名称
   * @param {boolean} disable 禁用或开启，真禁用，假开启
   */  
  addOrRemove (name: string, disable: boolean): void
  /**
   * @description: 禁用或开启所有事件
   * @param {boolean} disable 禁用或开启，真禁用，假开启
   */ 
  addOrRemoveAll (disable: boolean): void
}

/**
 * @description: 位置描述接口
 */
export interface IPositionResult {
  /**
   * @description: 水平偏移px
   */  
  offsetX: number
  /**
   * @description: 水平偏移[0-1]
   */
  offsetPCTX: number
  /**
   * @description: 水平中间偏移[0-1]
   */
  offsetMiddlePCTX: number
  /**
   * @description: 纵向偏移px
   */
  offsetY: number
  /**
   * @description: 纵向偏移[0-1]
   */
  offsetPCTY: number
  /**
   * @description: 纵向中间偏移[0-1]
   */
  offsetMiddlePCTY: number
  /**
   * @description: fence索引
   */
  fenceIndex?: number
}