/**
 * @description: 罗盘数据接口
 */
export interface ICompassData {
  time: Date
  bearing: Float32Array
  quality: Float32Array
}
/**
 * @description: 罗盘数据方寸接口
 */
export interface ICompassBuffer {
  time: Date   
  bearing: Float32Array
  quality: Float32Array
}

/**
 * @description: ZXICompass频谱数据池
 */
export interface ICompassPool {
  /**
   * @description: 罗盘数据缓存
   */
  bufferArray: Array<ICompassBuffer>
  /**
   * @description: 无合并每个角度次数统计
   */
  countAngleExact: Float32Array
  /**
   * @description: 合并每个角度次数统计
   */
  countAngleMerge: Float32Array
  /**
   * @description: 无合并每个角度次数最大值
   */
  maxCountExact: number
  /**
   * @description: 合并每个角度次数最大值
   */
  maxCountMerge: number
  /**
   * @description: 无合并每个角度质量统计
   */
  qualityScoreExact: Float32Array
  /**
   * @description: 合并每个角度质量统计
   */
  qualityScoreMerge: Float32Array
  /**
   * @description: 值变化，表示完成一次统计
   */
  staticEffect: boolean
}

export * from './CompassUI'