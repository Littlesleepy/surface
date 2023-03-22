import { ToolTip } from '../core'
import { IAxisXValue } from '../types'

export interface IStatisticalYPool {
  /**
   * @description: 水平方向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
}