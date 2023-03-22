import { IPositionResult, ToolTip } from '../core'
import { IAxisYValue } from '../types'

/**
 * @description: 后台返回IQ数据接口
 */
export interface IIQData {
  iData: Float32Array
  qData: Float32Array
}

/**
 * @description: IQ星座图数据池
 */
export interface IIQVectorPool {
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: IPositionResult | undefined
  /**
   * @description: 横纵向轴当前最大值最小值
   */
  scale: IAxisYValue
}