import { CSSProperties } from "vue"

/**
 * @description: 图像区域标记
 */
export interface IHighlightItem {
  /**
   * @description: 最外层遮罩样式
   */  
  style?: CSSProperties
  /**
   * @description: 带宽MHz
   */  
  bandwidth: number
  /**
   * @description: 中心频率MHz
   */  
  centerFrequency?: number
  /**
   * @description: 开始频率MHz
   */ 
  startFrequency?: number
  /**
   * @description: 顶部文字区
   */ 
  title?: {
    /**
     * @description: 顶部文字内容
     */
    content: string
    /**
     * @description: 顶部文字容器<p>元素样式
     */
    style?: CSSProperties
  },
  /**
   * @description: 中间插入元素锚点内容
   */
  html?: string
}