/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-02 15:21:33
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-13 09:14:44
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXISpectrumScanAndFall\type.ts
 * @Description: 
 */
import { ClampForce, FallMeasure, IFallDataBuffer, IFallMeasurePoint, IPositionResult, Measure, ToolTip } from '..'

/**
 * @description: 扫描频谱输入数据
 */
export interface ISpectrumScanInputData {
  data: Float32Array
  frequency: number
  sc: number
  time: number
  endIndex?: number
  endTime?: number
  startIndex?: number
  startTime?: number
  zoom?: number
}

/**
 * @description: ZXISpectrumScanAndFall频谱数据池
 */
export interface ISpectrumScanAndFallFallPool {
  /**
   * @description: 瀑布图数据存储
   */
  inputDataBuffer: IFallDataBuffer<ISpectrumScanInputData>
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip纵向位置
   */
  toolTipPositionX: number | undefined
  /**
   * @description: toolTip选取第几行
   */
  whichRow: number | undefined
  /**
   * @description: toolTip选取的哪一行数据
   */
  whichRowData: ISpectrumScanInputData | undefined
  /**
   * @description: 夹取工具
   */  
  clampForce: ClampForce | undefined
  /**
   * @description: 夹取结果
   */ 
  clampForceResult: { begin: number, end: number } | undefined
  /**
   * @description: 测量组件
   */
  measureTool: Measure
  /**
  * @description: 测量位置
  */
  measurePosition: Map<string, IPositionResult> | undefined
}

/**
 * @description: ZXISpectrumScanAndFall频谱数据池
 */
export interface ISpectrumScanAndFallSpectrumPool {
  /**
   * @description: 瀑布图数据存储
   */
  inputDataBuffer: IFallDataBuffer<ISpectrumScanInputData>
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip纵向位置
   */
  toolTipPositionX: number | undefined
  /**
   * @description: toolTip选取第几行
   */
  whichRow: number | undefined
  /**
   * @description: toolTip选取的哪一行数据
   */
  whichRowData: ISpectrumScanInputData | undefined
  /**
   * @description: 测量组件
   */
  measureTool: FallMeasure
  /**
   * @description: 测量位置
   */
  measurePosition: Array<IFallMeasurePoint> | undefined
}

export * from './marker'