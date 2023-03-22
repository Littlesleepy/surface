export interface IUnit {
  /**
   * @description: 单位
   */  
  unit: string
  /**
   * @description: toolTip内容解析格式
   */  
  parse: (value: number) => string
  /**
   * @description: 数字转换处理，用于轴的数值统一处理
   */ 
  transform: (value: number) => number
}