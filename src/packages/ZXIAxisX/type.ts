/**
 * @description: X轴类型
 */
export enum EAxisXType {
  /**
   * @description: 中心对称
   */   
  symmetry,
  /**
   * @description: 开始和结束
   */
  range
}

/**
 * @description: AxisX轴值接口
 */
export interface IAxisXValue {
  max: number
  min: number
}

export interface IUnitAxis {
  /**
   * @description: 单位
   */  
  unit: string
  /**
   * @description: 数字转换处理，用于轴的数值统一处理
   */ 
  transform: (value: number) => number
}