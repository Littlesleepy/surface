/**
 * @description: 画板控制按钮类型接口
 */
export interface IBtncontrols {
  /**
   * @description: 按钮类型
   */  
  type: EBtncontrolType
  /**
   * @description: 名称
   */  
  title: string
  /**
   * @description: 按钮英文名
   */  
  paramName: string
  value?: any,
  options?: Array<{ label: string , value: string }>,
  activeColor?: string
  /** 
   * @description: 该按钮打开时必须关闭的按钮名称列表
   */
  repelName?: Array<string>
  /** 
   * @description: 显示隐藏
   */
  show?: boolean
}

export enum EBtncontrolType {
  /**
   * @description: 开关
   */  
  switch,
  /**
   * @description: 单选
   */  
  radio,
  /**
   * @description: 按钮
   */
  button
}