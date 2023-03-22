/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-01 09:11:20
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 15:45:22
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\styles\useTheme.ts
 * @Description: 主题切换
 */


export interface IGlobalTheme {
  /** 
   * @description: 图像背景颜色
   */  
  backgroundColor?: Array<number>
  /** 
   * @description: 字体颜色
   */
  color?: Array<number>
  /** 
   * @description: 刻度颜色
   */
  scaleColor?: Array<number>
  /** 
   * @description: 边框颜色
   */
  borderColor?: Array<number>
  /** 
   * @description: 提示框、弹出框背景颜色
   */  
  tipBgColor?: Array<number>
  /** 
   * @description: 提示框、弹出框字体颜色
   */ 
  tipColor?: Array<number>
  /** 
   * @description: 标识线颜色
   */  
  tagBgColor?: Array<number>
  /** 
   * @description: 标识线选中后颜色
   */
  tagSelectColor?: Array<number>
  /** 
   * @description: 一些显示文字信息的背景颜色（例如ITU、调制识别等）
   */  
  textInfoBgColor?: Array<number>
  /** 
   * @description: 一些显示文字信息的文字颜色（例如ITU、调制识别等）
   */ 
  textInfoColor?: Array<number>
  /** 
   * @description: 遮罩颜色
   */
  markerColor?: Array<number>
  /** 
   * @description: 遮罩被选中颜色
   */
  markerSelectColor?: Array<number>
}

interface IDpx {
  /** 
   * @description: 荧光谱轮廓线条颜色[0-1, 0-1, 0-1, 0-1?]
   */    
  lineColor?: Array<number>
}

interface IDrawer {
  /** 
   * @description: 按钮边框背景颜色'var(--zxi--Drawer--borderBgColor, 颜色名、十六进制、RGB、RGBA)'
   */    
  borderBgColor?: string
  /** 
   * @description: 按钮边框背景颜色'var(--zxi--Drawer--borderButtonColor, 颜色名、十六进制、RGB、RGBA)'
   */
  borderButtonColor?: string
}

interface IEye {
  /** 
   * @description: 眼图线条颜色，颜色名、十六进制、RGB、RGBA
   */    
  lineColor?: string
}

interface IHighlight {
  /** 
   * @description: 遮罩颜色'var(--zxi--Highlight--markerColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  markerColor?: string
}

interface IIQVector {
  /** 
   * @description: 星座图线条颜色，颜色名、十六进制、RGB、RGBA
   */ 
  lineColor?: string
  /** 
   * @description: 星座图点颜色，颜色名、十六进制、RGB、RGBA
   */
  pointColor?: string
}

interface IIcons {
  /** 
   * @description: 信号指示字体颜色var(--zxi--Icons--color, 颜色名、十六进制、RGB、RGBA)'
   */  
  color?: string
}

interface ILevel {
  /** 
   * @description: 线条颜色，颜色名、十六进制、RGB、RGBA
   */  
  lineColor?: string
  /** 
   * @description: 柱状颜色，二纬颜色数组（由下往上）[[0-1, 0-1, 0-1]]
   */ 
  barColor?: Array<Array<number>>
}

interface ILevelPillar {
  /** 
   * @description: 电平柱状图背景颜色var(--zxi--LevelPillar--backgroundColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  backgroundColor?: string
  /** 
   * @description: 电平柱状图电平值颜色var(--zxi--LevelPillar--levelColor, 颜色名、十六进制、RGB、RGBA)'
   */
  levelColor?: string
}

interface IRaindrop {
  /** 
   * @description: 雨点颜色，二纬颜色数组（由0往100）[[0-1, 0-1, 0-1]]
   */ 
  raindropColor?: Array<Array<number>>
}

interface ISpectrumAndFall {
  /** 
   * @description: 柱状颜色，二纬颜色数组（由下往上）[[0-1, 0-1, 0-1]]
   */ 
  barColor?: Array<Array<number>>
  /** 
   * @description: 包络线颜色[0-1, 0-1, 0-1]
   */ 
  baoluotuColor?: Array<number>
  /** 
   * @description: 峰值线颜色[0-1, 0-1, 0-1]
   */
  fengzhiColor?: Array<number>
  /** 
   * @description: 均值线颜色[0-1, 0-1, 0-1]
   */
  junzhiColor?: Array<number>
  /** 
   * @description: 谷值线颜色[0-1, 0-1, 0-1]
   */
  guzhiColor?: Array<number>
  /** 
   * @description: Y轴宽度(px)
   */
  axisYWidth?: string
  /** 
   * @description: 瀑布图Y轴颜色，颜色名、十六进制、RGB、RGBA
   */
  fallAxisYColor?: string
  /** 
   * @description: 网格颜色，[0-1, 0-1, 0-1, 0-1?]
   */
  gridColor?: Array<number>
}

interface IStatisticalY {
  /** 
   * @description: 线条颜色，颜色名、十六进制、RGB、RGBA
   */  
  lineColor?: string
}

interface ITabs {
  /** 
   * @description: 头部选中的tab的背景颜色var(--zxi--Tabs--selectBgColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  selectBgColor?: string
  /** 
   * @description: 头部选中的tab的字体颜色var(--zxi--Tabs--selectColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  selectColor?: string
  /** 
   * @description: 头部未选中的tab的颜色var(--zxi--Tabs--notSelectBgColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  notSelectBgColor?: string
  /** 
   * @description: 头部未选中的tab的字体颜色var(--zxi--Tabs--notSelectColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  notSelectColor?: string
  /** 
   * @description: 头部边框颜色var(--zxi--Tabs--borderColor, 颜色名、十六进制、RGB、RGBA)'
   */ 
  borderColor?: string
}

interface ITv {
  /** 
   * @description: 边框颜色var(--zxi--Tv--borderColor, 颜色名、十六进制、RGB、RGBA)'
   */  
  borderColor?: string
}

interface ICompass {
  /** 
   * @description: 线条颜色，颜色名、十六进制、RGB、RGBA
   */  
  lineColor?: string
}

interface ISwitchButton {
  /** 
   * @description: 背景颜色var(--zxi--SwitchButton--backgroundColor, 颜色名、十六进制、RGB、RGBA)'
   */ 
  backgroundColor?: string
  /** 
   * @description: 选中后背景颜色var(--zxi--SwitchButton--selectColor, 颜色名、十六进制、RGB、RGBA)'
   */ 
  selectColor?: string
}

export interface IZXITheme {
  /** 
   * @description: 全局样式，必须为[0-255, 0-255, 0-255, 0-1?]
   */  
  global?: IGlobalTheme
  /** 
   * @description: 荧光谱
   */  
  Dpx?: IDpx
  /** 
   * @description: 抽屉
   */  
  Drawer?: IDrawer
  /** 
   * @description: 眼图
   */
  Eye?: IEye
  /** 
   * @description: 信号高亮
   */  
  Highlight?: IHighlight
  /** 
   * @description: IQ矢量图和IQ波形图
   */
  IQVector?: IIQVector
  /** 
   * @description: 信号指示
   */  
  Icons?: IIcons
  /** 
   * @description: 电平图
   */  
  Level?: ILevel
  /** 
   * @description: 电平柱状图
   */
  LevelPillar?: ILevelPillar
  /** 
   * @description: 雨点图
   */
  Raindrop?: IRaindrop
  /** 
   * @description: 频谱图
   */ 
  SpectrumAndFall?: ISpectrumAndFall
  /** 
   * @description: 纵向统计图
   */
  StatisticalY?: IStatisticalY
  /** 
   * @description: tab组件
   */
  Tabs?: ITabs
  /** 
   * @description: tab组件
   */
  Tv?: ITv
  /** 
   * @description: 罗盘组件
   */
  Compass?: ICompass
  /** 
   * @description: 开关按钮组件 
   */
  SwitchButton?: ISwitchButton
}

export class UseTheme {
  /** 
   * @description: 默认主题
   * @return {*}
   */  
  static default: Required<IZXITheme> = {
    global: {
      backgroundColor: [18, 18, 18],
      color: [220, 220, 220],
      scaleColor: [255, 255, 255],
      borderColor: [90, 90, 90],
      tipBgColor: [255, 255, 255],
      tipColor: [40, 40, 40],
      tagBgColor: [255, 255, 255],
      tagSelectColor: [255, 0, 0],
      textInfoBgColor: [255, 255, 255],
      textInfoColor: [96, 98, 102],
      markerColor: [120, 120, 120, 0.2],
      markerSelectColor: [120, 120, 120, 0.5]
    } as Required<IGlobalTheme>,
    Dpx: {
      lineColor: [1, 1, 0]
    } as Required<IDpx>,
    Drawer: {
      borderBgColor: 'var(--zxi--Drawer--borderBgColor, rgb(130, 130, 130))',
      borderButtonColor: 'var(--zxi--Drawer--borderButtonColor, rgb(220, 220, 220))'
    } as Required<IDrawer>,
    Eye: {
      lineColor: 'rgb(0, 255, 0)'
    } as Required<IEye>,
    Highlight: {
      markerColor: 'var(--zxi--Highlight--markerColor, rgba(255, 255, 255, .2))'
    } as Required<IHighlight>,
    IQVector: {
      lineColor: 'rgb(0, 255, 0)',
      pointColor: 'rgb(225, 47, 0)'
    } as Required<IIQVector>,
    Icons: {
      color: 'var(--zxi--Icons--color, rgb(252, 194, 4))'
    } as Required<IIcons>,
    Level: {
      lineColor: 'rgb(0, 255, 0)',
      barColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    } as Required<ILevel>,
    LevelPillar: {
      backgroundColor: 'var(--zxi--LevelPillar--backgroundColor, rgb(224, 56, 5))',
      levelColor: 'var(--zxi--LevelPillar--levelColor, rgb(4, 182, 18))'
    } as Required<ILevelPillar>,
    Raindrop: {
      raindropColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    } as Required<IRaindrop>,
    SpectrumAndFall: {
      barColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]],
      baoluotuColor: [0, 1, 0],
      fengzhiColor: [1, 0, 0],
      guzhiColor: [0, 0, 1],
      junzhiColor: [1, 0, 1],
      axisYWidth: '10px',
      fallAxisYColor: 'rgb(0, 255, 255)',
      gridColor: [1, 1, 1, 0.2]
    } as Required<ISpectrumAndFall>,
    StatisticalY: {
      lineColor: 'rgb(0, 255, 0)'
    } as Required<IStatisticalY>,
    Tabs: {
      selectBgColor: 'var(--zxi--Tabs--selectBgColor, rgb(255, 255, 255))',
      selectColor: 'var(--zxi--Tabs--selectColor, #409eff)',
      notSelectBgColor: 'var(--zxi--Tabs--notSelectBgColor, #e4e7ed)',
      notSelectColor: 'var(--zxi--Tabs--notSelectColor, #909399)',
      borderColor: 'var(--zxi--Tabs--borderColor, rgb(211, 211, 211))'
    } as Required<ITabs>,
    Tv: {
      borderColor: 'var(--zxi--Tv--borderColor, rgb(150, 150, 150))'
    } as Required<ITv>,
    Compass: {
      lineColor: 'rgb(0, 255, 0)'
    } as Required<ICompass>,
    SwitchButton: {
      backgroundColor: 'var(--zxi--SwitchButton--backgroundColor, rgb(60, 60, 60))',
      selectColor: 'var(--zxi--SwitchButton--backgroundColor, rgb(30, 30, 30))'
    } as Required<ISwitchButton>
  }
  static theme = {
    /** 
     * @description: 通道值rgb(0-255, 0-255, 0-255) | rgba(0-255, 0-255, 0-255, 0-1)
     */    
    rgb: {
      backgroundColor: 'rgb(18, 18, 18)',
      color: 'rgb(220, 220, 220)',
      scaleColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(90, 90, 90)',
      tipBgColor: 'rgb(255, 255, 255)',
      tipColor: 'rgb((96, 98, 102)',
      tagBgColor: 'rgb(255, 255, 255)',
      tagSelectColor: 'rgb(255, 0, 0)',
      textInfoBgColor: 'rgb(255, 255, 255)',
      textInfoColor: 'rgb(96, 98, 102)',
      markerColor: 'rgb(120, 120, 120, 0.2)',
      markerSelectColor: 'rgb(120, 120, 120, 0.5)'
    } as {
      [P in keyof IGlobalTheme]-?: string
    },
    /** 
     * @description: 归一化[0-1, 0-1, 0-1] | [0-1, 0-1, 0-1, 0-1]
     */    
    nl: {
      backgroundColor: [0.07, 0.07, 0.07],
      color: [0.862, 0.862, 0.862],
      scaleColor: [1, 1, 1],
      borderColor: [0.353, 0.353, 0.353],
      tipBgColor: [1, 1, 1],
      tipColor: [0.384, 0.384, 0.4],
      tagBgColor: [1, 1, 1],
      tagSelectColor: [1, 0, 0],
      textInfoBgColor: [1, 1, 1],
      textInfoColor: [0.384, 0.384, 0.4],
      markerColor: [0.471, 0.471, 0.471, 0.2],
      markerSelectColor: [0.471, 0.471, 0.471, 0.5]
    } as Required<IGlobalTheme>,
    /** 
     * @description: 自定义属性var(--zxi--name, rgb(0-255, 0-255, 0-255) | rgba(0-255, 0-255, 0-255, 0-1))
     */    
    var: {
      backgroundColor: 'var(--zxi--backgroundColor, rgb(18, 18, 18))',
      color: 'var(--zxi--color, rgb(220, 220, 220))',
      scaleColor: 'var(--zxi--color, rgb(255, 255, 255))',
      borderColor: 'var(--zxi--borderColor, rgb(90, 90, 90))',
      tipBgColor: 'var(--zxi--tipBgColor, rgb(255, 255, 255))',
      tipColor: 'var(--zxi--tipColor, rgb(96, 98, 102))',
      tagBgColor: 'var(--zxi--tagBgColor, rgb(255, 255, 255))',
      tagSelectColor: 'var(--zxi--tagSelectColor, rgb(255, 0, 0))',
      textInfoBgColor: 'var(--zxi--textInfoBgColor, rgb(255, 255, 255))',
      textInfoColor: 'var(--zxi--textInfoColor, rgb(96, 98, 102))',
      markerColor: 'var(--zxi--markerColor, rgba(120, 120, 120, 0.2))',
      markerSelectColor: 'var(--zxi--markerSelectColor, rgba(120, 120, 120, 0.5))'
    } as {
      [P in keyof IGlobalTheme]-?: string
    },
    /** 
     * @description: 荧光谱
     */
    Dpx: {
      lineColor: [1, 1, 0]
    } as Required<IDpx>,
    /** 
     * @description: 抽屉
     */ 
    Drawer: {
      borderBgColor: 'var(--zxi--Drawer--borderBgColor, rgb(130, 130, 130))',
      borderButtonColor: 'var(--zxi--Drawer--borderButtonColor, rgb(220, 220, 220))'
    } as Required<IDrawer>,
    Eye: {
      lineColor: 'rgb(0, 217, 0)'
    } as Required<IEye>,
    Highlight: {
      markerColor: 'var(--zxi--Highlight--markerColor, rgba(255, 255, 255, .2))'
    } as Required<IHighlight>,
    IQVector: {
      lineColor: 'rgb(0, 255, 0)',
      pointColor: 'rgb(225, 47, 0)'
    } as Required<IIQVector>,
    Icons: {
      color: 'var(--zxi--Icons--color, rgb(252, 194, 4))'
    } as Required<IIcons>,
    Level: {
      lineColor: 'rgb(0, 255, 0)',
      barColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    } as Required<ILevel>,
    LevelPillar: {
      backgroundColor: 'var(--zxi--LevelPillar--backgroundColor, rgb(224, 56, 5))',
      levelColor: 'var(--zxi--LevelPillar--levelColor, rgb(4, 182, 18))'
    } as Required<ILevelPillar>,
    Raindrop: {
      raindropColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    } as Required<IRaindrop>,
    SpectrumAndFall: {
      barColor: [[0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0]],
      baoluotuColor: [0, 1, 1],
      fengzhiColor: [1, 0, 0],
      guzhiColor: [0, 0, 1],
      junzhiColor: [1, 0, 1],
      axisYWidth: '10px',
      fallAxisYColor: 'rgb(0, 255, 255)',
      gridColor: [1, 1, 1, 0.2]
    } as Required<ISpectrumAndFall>,
    StatisticalY: {
      lineColor: 'rgb(0, 255, 0)'
    } as Required<IStatisticalY>,
    Tabs: {
      selectBgColor: 'var(--zxi--Tabs--selectBgColor, rgb(255, 255, 255))',
      selectColor: 'var(--zxi--Tabs--selectColor, #409eff)',
      notSelectBgColor: 'var(--zxi--Tabs--notSelectBgColor, #e4e7ed)',
      notSelectColor: 'var(--zxi--Tabs--notSelectColor, #909399)',
      borderColor: 'var(--zxi--Tabs--borderColor, rgba(211, 211, 211))'
    } as Required<ITabs>,
    Tv: {
      borderColor: 'var(--zxi--Tv--borderColor, rgb(150, 150, 150))'
    } as Required<ITv>,
    Compass: {
      lineColor: 'rgb(0, 255, 0)'
    } as Required<ICompass>,
    SwitchButton: {
      backgroundColor: 'var(--zxi--SwitchButton--backgroundColor, rgb(60, 60, 60))',
      selectColor: 'var(--zxi--SwitchButton--backgroundColor, rgb(30, 30, 30))'
    } as Required<ISwitchButton>
  }
  /** 
   * @description: 颜色格式转换rgba(0-255, 0-255, 0-255, 0-1?)
   * @param {Array} color 颜色[红，蓝，绿, 0-1?]通道值
   * @param {boolean} normal 如果true，color必须为rgba(0-1, 0-1, 0-1, 0-1?)
   * @return {*}
   */  
  static transColor(color: Array<number>, isNormal = false) {
    const _color = isNormal ? [color[0] * 255, color[1] * 255, color[2] * 255] : color
    if (color.length > 3) {
      return `rgba(${_color[0]}, ${_color[1]}, ${_color[2]}, ${color[3]})`
    } else {
      return `rgb(${_color[0]}, ${_color[1]}, ${_color[2]})`
    }
  }
  /** 
   * @description: 颜色值归一化[0-1, 0-1, 0-1, 0-1?]
   * @param {Array} color 颜色[0-255，0-255，0-255, 0-1?]通道值
   * @return {*}
   */  
  static normalizationColor(color: Array<number>) {
    const result = [color[0] / 255, color[1] / 255, color[2] / 255]
    if (color.length === 4) {
      result.push(color[3])
    }
    return result
  }
  /** 
   * @description: 前缀
   * @return {*}
   */  
  static prefix = '--zxi--'
  /** 
   * @description: 设置主题后的操作管理
   */  
  static afterSetProperty = new Map<Symbol | string, (styles: IZXITheme) => void>()
  /** 
   * @description: 注册
   * @param {function} listener 操作
   * @param {string} key 键
   * @return {*}
   */  
  static on (listener: (styles: IZXITheme) => void, key?: string) {
    const _key = key ?? Symbol()

    UseTheme.afterSetProperty.set(_key, listener)

    return _key
  }
  /** 
   * @description: 关闭某个操作
   * @param {Symbol} key 键
   * @return {*}
   */  
  static off (key: Symbol | string) {
    UseTheme.afterSetProperty.delete(key)
  }
  /** 
   * @description: 设置主题
   * @param {IGlobalTheme} styles
   * @param {Record<string, string>} elPlus element-plus的样式
   * @return {*}
   */  
  static set (styles: IZXITheme) {
    const style = document.body.style
    // 全局样式
    if (styles.global) {
      const target = styles.global
      Object.keys(target).forEach(key => {
        const v = target[key] as Array<number>
        const color = UseTheme.transColor(v)
        UseTheme.theme.rgb[key] = color

        UseTheme.theme.nl[key] = UseTheme.normalizationColor(v)

        UseTheme.theme.var[key] = `var(${UseTheme.prefix + key}, ${color})`

        style.setProperty(UseTheme.prefix + key, color)
      })
    }
    // 单个组件
    Object.keys(styles).forEach(key => {
      if (key !== 'global') {
        const target = UseTheme.theme[key]
        const source = styles[key]

        Object.keys(source).forEach(sKey => {
          const value = source[sKey]
          target[sKey] = value

          // 监测是否含有var，有的话需要设置setProperty
          if (typeof value === 'string' && value.includes('var')) {
            const reg = /(?<=,).*(?=\))/g
            const result = value.match(reg)

            const prefix = `${UseTheme.prefix}${key}--${sKey}`
            
            if (result) {
              style.setProperty(prefix, result[0])
            }
          }
        })
      }
    })

    for (const [, fun] of UseTheme.afterSetProperty) {
      fun(styles)
    }
  }
  /** 
   * @description: 释放所有操作
   * @return {*}
   */  
  static dispose () {
    UseTheme.afterSetProperty.clear()
  }
}