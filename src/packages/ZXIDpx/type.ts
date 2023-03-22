import { IPositionResult, ToolTip } from '../core'
import { IAxisXValue, IAxisYValue } from '../types'
/**
 * @description: 荧光谱组件输入数据
 */
export interface IDpxIputData {
  /**
   * @description: 数据
   */  
  data: Uint8Array
  /**
   * @description: 每两个数字代表一列数据的有效起始索引，第一个为开始索引，第二个为结束索引
   */  
  indexs: Float32Array
}

export interface IDPXParams {
  /**
   * @description: 起始频率（MHz）
   */  
  begin: number
  /**
   * @description: 结束频率（MHz）
   */ 
  end: number
  /**
   * @description: 带宽（MHz）
   */
  bandwidth: number
  /**
   * @description: fft点数
   */  
  fftpoints: number
}
/**
 * @description: 数字荧光谱数据池
 */
export interface IDpxPool {
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