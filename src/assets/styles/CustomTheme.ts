/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-02-21 16:21:00
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-10 15:19:31
 * @FilePath: \zxi-device\src\assets\styles\CustomTheme.ts
 * @Description: 主题切换类
 */

export interface ICustomTheme {
  /** 
   * @description: 图像中仅仅只有一条线的颜色，颜色名、十六进制、RGB、RGBA
   */  
  lineColorOne?: string
  /** 
   * @description: 区域划分边框样式，'var(--device--districtBorder, 宽度 线类型 颜色名、十六进制、RGB、RGBA)'
   */  
  districtBorder?: string
  /** 
   * @description: 日志或者一些设备输出文字颜色
   */  
  logColor?: string
  /** 
   * @description: 绿色线条，颜色名、十六进制、RGB、RGBA
   */  
  lineColorGreen?: string
  /** 
   * @description: 门限线条，[0-1, 0-1, 0-1]
   */
  thresholdColor?: Array<number>
}

export class CustomTheme {
  static default = {
    lineColorOne: 'rgb(212, 103, 1)',
    districtBorder: 'var(--device--districtBorder, 2px solid rgba(196, 196, 196, 0.4))',
    logColor: 'rgb(0, 153, 0)',
    lineColorGreen: 'rgb(0, 255, 0)',
    thresholdColor: [1, 1, 1]
  } as Required<ICustomTheme>

  static theme = {
    lineColorOne: 'rgb(212, 103, 1)',
    districtBorder: 'var(--device--districtBorder, 2px solid rgba(196, 196, 196, 0.4))',
    logColor: 'rgb(0, 153, 0)',
    lineColorGreen: 'rgb(0, 255, 0)',
    thresholdColor: [1, 1, 1]
  } as Required<ICustomTheme>
  /** 
   * @description: 前缀
   * @return {*}
   */  
  static prefix = '--device--'
  /** 
   * @description: 设置主题后的操作管理
   */  
  static afterSetProperty = new Map<Symbol | string, (styles: ICustomTheme, name: string) => void>()
  /** 
   * @description: 注册
   * @param {function} listener 操作
   * @param {string} key 键
   * @return {*}
   */  
  static on (listener: (styles: ICustomTheme, name: string) => void, key?: string) {
    const _key = key ?? Symbol()

    CustomTheme.afterSetProperty.set(_key, listener)

    return _key
  }
  /** 
   * @description: 关闭某个操作
   * @param {Symbol} key 键
   * @return {*}
   */  
  static off (key: Symbol | string) {
    CustomTheme.afterSetProperty.delete(key)
  }
  /** 
   * @description: 设置主题
   * @param {ICustomTheme} styles 样式
   * @param {string} name 主题名称
   * @return {*}
   */  
  static set (styles: ICustomTheme, name: string) {
    const style = document.body.style

    const target = CustomTheme.theme
    Object.keys(styles).forEach(key => {
      const value = styles[key]
      target[key] = value

      // 监测是否含有var，有的话需要设置setProperty
      if (typeof value === 'string' && value.includes('var')) {
        const reg = /(?<=,).*(?=\))/g
        const result = value.match(reg)

        const prefix = `${CustomTheme.prefix}${key}`
        
        if (result) {
          style.setProperty(prefix, result[0])
        }
      }
    })

    for (const [, fun] of CustomTheme.afterSetProperty) {
      fun(styles, name)
    }
  }

  /** 
   * @description: 释放所有操作
   * @return {*}
   */  
  static dispose () {
    CustomTheme.afterSetProperty.clear()
  }
}