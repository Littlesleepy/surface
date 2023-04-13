/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-02 11:27:21
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-09 14:04:33
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\ZXISpectrumAndFall\type.ts
 * @Description: 
 */
import { ClampForce, IMarker, IPositionResult, Marker, Measure, Threshold, ToolTip } from '../core'
import { IAxisXValue, IAxisYValue, IZXIMenu } from '../types'
import { Listen } from '..'
import { FallMeasure, IFallMeasurePoint } from './FallMeasure'

export { SpectrumData } from './spectrum'
export { FallData } from './fall'
export * from './FallMeasure'

/**
 * @description: 频谱双击事件结果
 */
 export interface ISpectrumDbClickResult {
  /**
   * @description: fence的索引
   */ 
  fenceIndex: number
  /**
   * @description: 数据索引
   */ 
  dataIndex: number
  /**
   * @description: X轴对应值
   */  
  value: number
  /**
   * @description: 原生事件
   */  
  baseEvent: TouchEvent | MouseEvent
  /**
   * @description: 场景事件
   */
  sceneEvent: Listen
  /**
   * @description: 触屏或者鼠标
   */
  mouseOrTouch: string
}

/**
 * @description: 频谱参数接口
 */
export interface ISpectrumParams {
  /**
   * @description: 起始频率（MHz）
   */  
  begin: number
  /**
   * @description: 结束频率（MHz）
   */ 
  end: number
  /**
   * @description: 带宽（MHz）
   */
  bandwidth?: number
  /**
   * @description: 步进（MHz）
   */  
  step?: number
}
/**
 * @description: 频谱输入数据
 */
export interface ISpectrumInputData {
  data: Float32Array,
  /**
   * @description: 格林威治时间数值
   */  
  time: number,
  /**
   * @description: 首帧时差
   */  
  timeSpan?: number
}
/**
 * @description: 数据统计接口
 */
export interface ISpectrumStatisticalBuffer {
  input: Float32Array,
  max: Float32Array,
  min: Float32Array,
  sum: Float64Array,
  mean:  Float32Array,
  count: Map<number, number>
}

export interface IFallDataBuffer<T> {
  /**
   * @description: 数据缓存区
   */  
  data: Array<T>
  /**
   * @description: 可视区最大数据容量
   */  
  maxRow: number
  /**
   * @description: 一行数据长度
   */
  oneRowLength: number
  /**
   * @description: 可视区顶部所用数据索引
   */
  topRow: number,
  /**
   * @description: 总的数据容量
   */
  toltalRow: number
}
/**
 * @description: 频谱附加曲线数据
 */
export interface IAdditionalCurve {
  /**
   * @description: 数据
   */  
  data: Float32Array
  /**
   * @description: 颜色，rgb通道归一化[0-1]
   */
  color: Array<number>
}

export class Controls {
  /**
   * @description: 柱状图
   */  
  static zhuzhuangtu = 'zhuzhuangtu'
  /**
   * @description: 包络图
   */
  static baoluotu = 'baoluotu'
  /**
   * @description: 瀑布图
   */
  static pubutu = 'pubutu'
  /**
   * @description: 峰值
   */
  static fengzhi = 'fengzhi'
  /**
   * @description: 均值
   */
  static junzhi = 'junzhi'
  /**
   * @description: 谷值
   */
  static guzhi = 'guzhi'
  /**
   * @description: 峰标
   */
  static fengbiao = 'fengbiao'
  /**
   * @description: 测量
   */
  static celiang = 'celiang'
  /**
   * @description: 筛选
   */
  static shaixuan = 'shaixuan'
  /**
   * @description: 频率划分
   */
  static pinlvhuafen = 'pinlvhuafen'
  /**
   * @description: 门限
   */
  static menxian = 'menxian'
  /**
   * @description: 瀑布图纵向缩放
   */
  static fallZoom = 'fallZoom'  
  /**
   * @description: 瀑布图测量
   */
  static fallCeliang = 'fallCeliang'  
  /**
   * @description:标注
   */
  static biaozhu = 'biaozhu'
  /**
   * @description:重置
   */
  static reset = 'reset'
}
/**
 * @description: ZXISpectrumAndFall频谱数据池
 */
export interface ISpectrumAndFallSpectrumPool {
  /**
   * @description: 步进
   */  
  step: number
  /**
   * @description: 水平方向轴当前最大值最小值
   */
  spectrumXvalue: IAxisXValue
  /**
   * @description: 纵向轴当前最大值最小值
   */
  spectrumYvalue: IAxisYValue
  /**
   * @description: 频谱使用数据
   */  
  usingData: ISpectrumInputData
  /**
   * @description: 统计数据
   */
  statisticalBuffer: ISpectrumStatisticalBuffer
  /**
   * @description: 筛选组件
   */
  dbThreshold: Threshold
  /**
   * @description: 筛选门限位置
   */
  dbThresholdPosition: Map<string, IPositionResult> | undefined
  /**
   * @description: 筛选门限值
   */
  dbThresholdValue: IAxisYValue
  /**
   * @description: 单门限组件
   */
  singleThreshold: Threshold
  /**
   * @description: 单门限位置
   */
  singleThresholdPosition: Map<string, IPositionResult> | undefined
  /**
   * @description: 单门限
   */
  singleThresholdValue: { value: number }
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip位置
   */  
  toolTipPosition: number | undefined
  /**
   * @description: 控制按钮
   */  
  btnValues: ISpectrumAndFallBtn
  /**
   * @description: 测量组件
   */
  measureTool: Measure
  /**
   * @description: 测量位置
   */
  measurePosition: Map<string, IPositionResult> | undefined
  /**
   * @description: marker实例
   */
  marker: Marker
  /**
   * @description: marker管理器
   */
  markerManagers: Set<{ dataIndex: number, frequency: number, add: boolean }>
  /**
   * @description: marker顶部按钮触发器
   */
  markerManagerTrigger: IZXIMenu & { dataIndex: number }
  /** 
   * @description: 添加marker
   * @param {Array} frequencys 如果添加长度为零，则清空所有marker
   * @return {*} 返回有效的添加或者清除的的marker集合
   */  
  addMarker: (frequencys: Array<number>) => Map<number, IMarker> | undefined
}

/**
 * @description: ZXISpectrumAndFall频谱数据池
 */
export interface ISpectrumAndFallFallPool {
  /**
   * @description: 瀑布图数据存储
   */
  inputDataBuffer: IFallDataBuffer<ISpectrumInputData>
  /**
   * @description: 游离组件
   */
  toolTip: ToolTip
  /**
   * @description: toolTip纵向位置
   */
  toolTipPositionX: number | undefined
  /**
   * @description: toolTip选取第几行
   */
  whichRow: number | undefined
  /**
   * @description: toolTip选取的哪一行数据
   */
  whichRowData: ISpectrumInputData | undefined
  /**
   * @description: 夹取工具
   */  
  clampForce: ClampForce | undefined
  /**
   * @description: 夹取结果
   */ 
  clampForceResult: { begin: number, end: number } | undefined
  /**
   * @description: 测量组件
   */
  measureTool: FallMeasure
  /**
   * @description: 测量位置
   */
  measurePosition: Array<IFallMeasurePoint> | undefined
}

export interface ISpectrumAndFallBtn {
  zhuzhuangtu:boolean
  baoluotu: boolean
  pubutu:boolean
  pubutusave: number
  fengzhi: boolean
  junzhi: boolean
  guzhi: boolean
  fengbiao: boolean
  celiang: boolean
  shaixuan: boolean
  menxian: boolean
  pinlvhuafen: boolean
  fallCeliang: boolean
}

export interface ISelectFrequency {
  fenceIndex: number
  dataIndex: number
  value: number
  baseEvent: MouseEvent | TouchEvent
  sceneEvent: Listen
  mouseOrTouch: 'touch' | 'mouse'
}