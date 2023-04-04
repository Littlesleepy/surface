/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-11-23 14:39:12
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-11-25 15:10:12
 * @FilePath: \zxi-device\src\views\CIQStream\index.ts
 * @Description: 
 */
export interface IIQAnalysis {
  /** 
   * @description: 八次方谱
   */ 
  eightSpectrum: Array<number>
  /** 
   * @description: FM 解调谱
   */ 
  fmDemodulationSpectrum: Array<number>
  /** 
   * @description: 瞬时幅度包络谱
   */ 
  iaEnvelopeSpectrum: Array<number>
  /** 
   * @description: 瞬时频率包络
   */ 
  ifEnvelopeSpectrum: Array<number>
  /** 
   * @description: 测量时域
   */ 
  measureTimeDomainData: {
    /** 
     * @description: 瞬时幅度
     */
    instantAmplitudes: Array<number>
    /** 
     * @description: 瞬时频率
     */
    instantFrequencies: Array<number>
    /** 
     * @description: 瞬时相位
     */
    instantPhases: Array<number>
  }
  /** 
   * @description: 功率谱
   */  
  powerSpectrum: Array<number>
  /** 
   * @description: 四次方谱
   */ 
  quadSpectrum: Array<number>
  /** 
   * @description: 功率谱
   */ 
  spectrumData: ISpectrumData
  /** 
   * @description: 平方谱
   */ 
  squareSpectrum: Array<number>
  /** 
   * @description: 提示信息字符串
   */ 
  toolTipStr: string
  /** 
   * @description: 时域特征频谱数据
   */  
  realTimeSpectrum: {
    data: Array<number>
    time: string
    span: number
  }
}

export interface ISpectrumData {
  samplingRate: number
  spectrums: Array<{ data: Array<number>, time: string, timeSpan: number }>
}