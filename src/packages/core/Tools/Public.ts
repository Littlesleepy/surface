export class Public {
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
   * @description: 将source中存在的属性赋值给target中的相同属性，如果target中对应属性值为undefined，则直接将source中值赋值给target
   * @param {object} target 目标
   * @param {object} source 源
   */  
  static copyValueFromObject (target: { [p: string]: any }, source: { [p: string]: any }) {
    for (const prop in source) {
      const value = source[prop]

      if (prop in target) {
        const type = Object.prototype.toString.call(value)
        if (type === '[object Object]') {
          const targetValue = target[prop]

          if (targetValue !== undefined) {
            Public.copyValueFromObject(targetValue, value)
          } else {
            target[prop] = value
          }
        } else {
          target[prop] = value
        }
      }
    }
  }
  /**
   * @description: 节流工具
   * @param {Function} fn 目标函数
   * @param {number} delay 间隔
   * @return {(...arg: any) => void}
   */
  static throttle (fn: any, delay: number): (...arg: any) => void {
    let pre = Date.now()
    return function (){
      const args = arguments
      const now = Date.now()
      if( now - pre >= delay){
        fn.apply(null, args)
        pre = Date.now()
      }
    }
  }
}