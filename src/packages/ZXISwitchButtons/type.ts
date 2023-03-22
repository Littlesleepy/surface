/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-01 10:25:02
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-01 11:10:15
 * @FilePath: \zxi-deviced:\Zzy\project\mcharts\packages\ZXISwitchButtons\type.ts
 * @Description: 
 */
export interface ISwitchButtons {
  /** 
   * @description: 按钮名称
   */  
  label?: string
  /** 
   * @description: 按钮提示信息
   */ 
  toolTip?: string
  /** 
   * @description: 按钮图标名称
   */
  iconName?: string
  /** 
   * @description: 按钮绑定键名称
   */ 
  paramName: string
  /** 
   * @description: 图标样式
   */
  iconStyle?: string
  /** 
   * @description: 名称样式
   */
  labelStyle?: string
  /** 
   * @description: 按钮样式
   */
  style?: string
  /** 
   * @description: 该按钮打开时必须关闭的按钮名称列表
   */
  repelName?: Array<string>
}