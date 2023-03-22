import { IPositionResult, ToolTip } from '../core'
import { IAxisXValue, IAxisYValue } from '../types'

/**
 * @description: 线条频谱图条数据接口
 */
export interface IPointAndLineData {
  /**
   * @description: 数据
   */  
  data: Float32Array
  /**
   * @description: 线条颜色
   */  
  colorLine: string
  /**
   * @description: 圆点颜色
   */
  colorPoint: string
  /**
   * @description: 圆点半径px
   */  
  pointRadius?: number
}

/**
 * @description: 点线图数据池
 */
export interface IPointAndLinePool {
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: IPositionResult | undefined
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
}