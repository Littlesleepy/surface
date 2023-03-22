import { ToolTip } from '../core'
import { IAxisXValue, IAxisYValue, ISpectrumStatisticalBuffer } from'../types'

export interface ISpectrumLinePool {
  /**
   * @description: 水平方向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
  /**
   * @description: 统计数据
   */
  statisticalBuffer: ISpectrumStatisticalBuffer
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
}