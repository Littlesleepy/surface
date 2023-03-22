/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-01 16:43:02
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-01 16:43:12
 * @FilePath: \zxi-device\src\packages\ZXICompassControl\type.ts
 * @Description: 
 */

/**
 * @description: 带有质量和电平的罗盘图
 */
export interface ICompassControl {
  time: Date
  bearing: Float32Array
  level: number
  quality: Float32Array
}