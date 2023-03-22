import { IPositionResult, ToolTip } from '../core'
import { IAxisYValue } from '../types'

/**
 * @description: 轻量线图数据池
 */
export interface ILightLinesPool {
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
   * @description: 数据抽取后的索引
   */    
  cutDataIndexArrMap: Map<string, Float32Array>
}