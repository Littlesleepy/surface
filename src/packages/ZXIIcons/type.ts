/**
 * @description: TargetIcon组件输入数据接口
 */
export interface ITargetIcon {
  /**
   * @description: 数据索引
   */  
  dataIndex: number
  /**
   * @description: 要显示的信息
   */  
  message?: string
  /**
   * @description: 图标
   */
  imgUrl?: string
  /**
   * @description: 每一个标记的样式
   */
  style?: {
    width?: number
    color?: string
  }
}