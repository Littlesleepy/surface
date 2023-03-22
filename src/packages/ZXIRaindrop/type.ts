/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-07 14:44:05
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-07 14:44:19
 * @FilePath: \zxi-device\src\packages\ZXIRaindrop\type.ts
 * @Description: 
 */
import { IPositionResult, Regions, ToolTip } from '../core'

export interface IRaindropData {
  time: Date
  quality: Float32Array
  bearing: Float32Array
}

export interface IRaindropPool {
  /**
   * @description: 步进
   */  
  step: number
  /**
   * @description: 角度和频率构成的坐标系中每一个交叉点的质量
   */  
  qualityBuffer: Array<Float32Array>
  /**
   * @description: 质量，时间，角度缓存器
   */  
  bufferArray: Array<IRaindropData>
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
  /**
   * @description: 框选器
   */  
  regions: Regions
  /**
   * @description: 框选角度
   */  
  regionAngle: { max: number, min: number }
  /**
   * @description: 框选结果
   */  
  regionPosition: Map<string, IPositionResult> | undefined
}
