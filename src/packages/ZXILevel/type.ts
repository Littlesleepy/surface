import { IPositionResult, Threshold, ToolTip } from '../core'
import { IAxisYValue } from '../types'
/**
 * @description: 电平图输入数据
 * @return {*}
 */
export interface ILevelData {
  time: Date
  data: number
}

/**
 * @description: 电平图绘制类型
 */
export enum ELevelType {
  /**
   * @description: 线条
   */  
  line,
  /**
   * @description: 柱状
   */
  bar
}

/**
 * @description: ZXILevel电平图数据池
 */
export interface ILevelPool {
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
  /**
   * @description: 缓存数据
   */  
  buffer: Map<string, Array<ILevelData>>
  /**
   * @description: 单门限组件
   */
  singleThreshold: Threshold
  /**
   * @description: 单门限位置
   */
  singleThresholdPosition: Map<string, IPositionResult> | undefined
  /**
   * @description: 单门限
   */
  singleThresholdValue: { value: number }
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
  /**
   * @description: 控制按钮
   */  
  btnValues: {
    threshold: boolean
  }
}