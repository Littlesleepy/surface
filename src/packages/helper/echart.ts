/*
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2022-09-30 10:36:20
 * @Description: 
 * 
 */
/**
 * @description: 图表帮助类
 */
export class Echart {
  /**
   * @description: 默认绘制对象色彩主题
  */  
  static readonly colors = [
    [0.85, 0, 0],
    [0, 0.85, 0],
    [0, 0, 0.85],
    [1, 0, 0.5],
    [0.85, 0, 0.85],
    [0, 0.78, 0.53],
    [1, 0.47, 0.47],
    [0.78, 0.26, 0],
    [0, 0.73, 0.85],
    [1, 0.45, 0],
    [1, 0.78, 0]
  ]
  /**
   * @description: 将数值颜色转换为css格式
   * @param {Float32Array} color 输入数值颜色
   * @return {string} css格式颜色
   */ 
   
  static colorToCss (color: Array<number>): string {
    return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
  }
  /**
   * @description: 红色
   */ 
  static readonly RED_F = [1, 0, 0]
  /**
   * @description: 红色
   */ 
   static readonly RED_S = 'rgb(255, 0, 0)'
  /**
   * @description: 绿色
   */ 
  static readonly GREEN_F = [0, 1, 0]
  /**
   * @description: 绿色
   */ 
  static readonly GREEN_S = 'rgb(0, 255, 0)'
  /**
   * @description: 蓝色
   */ 
  static readonly BLUE_F = [0, 0, 1]
  /**
   * @description: 蓝色
   */ 
  static readonly BLUE_S = 'rgb(0, 0, 255)'
  /**
   * @description: 黑色
   */ 
  static readonly BLACK_F = [0, 0, 0]
  /**
   * @description: 黑色
   */ 
  static readonly BLACK_S = 'rgb(0, 0, 0)'
  /**
   * @description: 白色
   */ 
  static readonly WHITE_F = [1, 1, 1]
  /**
   * @description: 白色
   */ 
  static readonly WHITE_S = 'rgb(255, 255, 255)'
  /**
   * @description: 橙色
   */   
  static readonly ORANGE_F = [0.882, 0.186, 0]
  /**
   * @description: 橙色
   */   
  static readonly ORANGE_S =  'rgb(225, 47, 0)'
  /**
   * @description: 紫色
   */  
  static readonly PURPLE_F = [1, 0, 1]
  /**
   * @description: 紫色
   */  
  static readonly PURPLE_S = 'rgb(255, 0, 255)'
  /**
   * @description: 默认绘图背景色
   */  
  static readonly MOCK_BG_COLOR_S = 'rgb(40, 40, 40)'
  /**
   * @description: 默认绘图背景色
   */  
  static readonly MOCK_BG_COLOR_F = [0.157, 0.157, 0.157]
}