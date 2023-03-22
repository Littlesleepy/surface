/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-11-21 14:37:54
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\helper\sundry.ts
 * @Description: 
 */
/**
 * @description: 杂项类
 */
export class Sundry {
  /**
   * @description: 深度拷贝一个对象（修改对象索引地址）
   * @param {any} newObj 接收拷贝内容对象
   * @param {any} oldObj 被拷贝对象
   * @return {void}
   */
  
  static deepCopy (newObj: any, oldObj: any): void {
    let item: any
    for (const k in oldObj) {
      item = oldObj[k]
      // 1.item是否是数组
      if (Object.prototype.toString.call(item) === '[object Array]') {
        newObj[k] = []
        this.deepCopy(newObj[k], item)
      // 2.item是否是对象
      } else if (Object.prototype.toString.call(item) === '[object Object]') {
        newObj[k] = {}
        this.deepCopy(newObj[k], item)
      // 3.item是简单数据类型
      } else {
        newObj[k] = item
      }
    }
  }
  /**
   * @description: 浏览器运行设备判断
   * @return {boolean} true为pc
   */

  static whichOS (): { isTablet: boolean, isPhone: boolean, isAndroid: boolean, isPc: boolean } {
    const ua = navigator.userAgent
    const isWindowsPhone = /(?:Windows Phone)/.test(ua)
    const isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone
    const isAndroid = /(?:Android)/.test(ua)
    const isFireFox = /(?:Firefox)/.test(ua)
    const isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua))
    const isPhone = /(?:iPhone)/.test(ua) && !isTablet
    const isPc = !isPhone && !isAndroid && !isSymbian
    return {
      isTablet: isTablet,
      isPhone: isPhone,
      isAndroid: isAndroid,
      isPc: isPc
    }
  }

  /**
   * @description: 生产GUID
   * @return {string} GUID
   */  

  static guid (): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8)
      return v.toString(16)
    })
  }
  /** 
   * @description: 计算大型数组的最大值
   * @param {any} arr 大型数组
   * @return {*}
   */  
  static max (arr: any) {
    let len = arr.length
    if (len <= 0) throw new Error('数组长度必须大于零')
    let max = arr[0]

    let item = max
    for (let i = 0; i < len; i++) {
      item = arr[i]
      if (item > max) {
        max = item
      }
    }

    return max
  }

  /** 
   * @description: 计算大型数组的最小值
   * @param {any} arr 大型数组
   * @return {*}
   */  
   static min (arr: any) {
    let len = arr.length
    if (len <= 0) throw new Error('数组长度必须大于零')
    let min = arr[0]
    let item = min
    for (let i = 0; i < len; i++) {
      item = arr[i]
      if (item < min) {
        min = item
      }
    }

    return min
  }
}