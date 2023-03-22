/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:54
 * @LastEditTime: 2022-09-30 10:36:08
 * @Description: 
 * 
 */
/**
 * @description: 时间处理类
 */

export class ZDate {
  /**
   * @description: 毫秒差转换为天/时/分/秒/毫秒
   * @param {number} msec 时间长度（毫秒）
   * @param {string} type 希望反出的时间格式，例如：'dd:hh:ss'
   * @param {boolean} ms 默认传入毫秒，如果传入为秒转换为毫秒
   * @return {*}
   */  

  static msFormat = function (msec: number, type: string, ms = true): string {
    if (!ms) { msec *= 1000 } // 默认传入毫秒，如果传入为秒转换为毫秒
    const mi = msec % 1000 // 毫秒
    let MI = mi.toString()
    if (mi < 10) MI = '00' + mi
    if (10 <= mi && mi < 100) MI = '0' + mi
    const mm = ZDate.doubleTime(Math.floor(msec % 60000 / 1000)) // 秒
    const ss = ZDate.doubleTime(Math.floor(msec % 3600000 / 60000)) // 分
    const hh = ZDate.doubleTime(Math.floor(msec % 86400000 / 3600000)) // 时
    const dd = ZDate.doubleTime(Math.floor(msec / 86400000)) // 天
    const obj: any = { dd, hh, ss, mm, MI }
    const reg = /(\w{2})/g
    let string = ''
    let result
    do {
      result = reg.exec(type)
      if (result) {
        string += obj[result[1]] + type.charAt(result.index + 2)
      }
    }
    while (result)
    return string
  }
  /**
   * @description: 时间格式不足两位数补零
   * @param {number} time 不同时间单位对应的数字
   * @return {string} 补零后的时间数字
   */  

  static doubleTime = function (time: number): string {
    if (time < 10) {
      return '0' + time
    } else {
      return time.toString()
    }
  }
  /**
   * @description: 获取日期和时刻
   * @param {Date} date 时间对象new Date()
   * @param {string} type 希望反出的时间格式，例如：'dd:hh:ss'
   * @return {string} 年月日
   */ 

  static dateFormat (date: Date, type: string):string {
    const yy = date.getFullYear()
    const MM = ZDate.doubleTime(Number(date.getMonth()) + 1)
    const dd = ZDate.doubleTime(date.getDate())
    const hh = ZDate.doubleTime(date.getHours())
    const ss = ZDate.doubleTime(date.getMinutes())
    const mm = ZDate.doubleTime(date.getSeconds())
    const MI = date.getMilliseconds()
    const obj: any = { yy, MM, dd, hh, ss, mm, MI }
    const reg = /(\w{2})/g
    let string = ''
    let result
    do {
      result = reg.exec(type)
      if (result) {
        string += obj[result[1]] + type.charAt(result.index + 2)
      }
    }
    while (result)
    return string
  }
  /**
   * @description: 格式化的时间转换为毫秒（dd:hh:mm:ss.ms）
   * @param {string} time 格式化的时间
   * @return {*}
   */  
  static formatToTime (time: string): number {
    let result = 0
    const r0 = time.match(/(?<=\.)\d+/)
    if (r0) {
      result += Number('0.'+ r0[0]) * 1000
    }

    const r1 = time.matchAll(/(?<=:)\d{2}/g)
    const r2 = [...r1]

    const first = Number(time[0] + time[1])
    switch (r2.length) {
    case 0: {
      result += first * 1000
    }
      break
    case 1: {
      result += Number(r2[0][0]) * 1000
      result += first * 60 * 1000
    }
      break
    case 2: {
      result += Number(r2[0][0]) * 60 * 1000
      result += Number(r2[1][0]) * 1000
      result += first * 60 * 60 * 1000
    }
      break
    case 3: {
      result += Number(r2[0][0]) * 60 * 60 * 1000
      result += Number(r2[1][0]) * 60 * 1000
      result += Number(r2[2][0]) * 1000
      result += first * 24 * 60 * 60 * 1000
    }
      break
    }
    
    return result
  }
}