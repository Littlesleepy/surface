import { IPositionResult, ToolTip } from '../core'
import { IAxisXValue, IAxisYValue } from '../types'

/**
 * @description: IQ波形图数据池
 */
export interface IIQWavePool {
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