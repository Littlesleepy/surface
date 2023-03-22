import { IPositionResult, ToolTip } from '../core'
import { IAxisXValue, IAxisYValue } from '../types'

/**
 * @description: 后台返回眼图数据接口
 */
export interface IEyeData {
  sampleRate: number
  baudRate: number
  eyePhaseData: Float32Array
  eyeAmplitudeData: Float32Array
}
/**
 * @description: 眼图数据池
 */
export interface IEyePool {
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: IPositionResult | undefined
  /**
   * @description: 水平方向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
}