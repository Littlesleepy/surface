/*
 * @Author: shiershao
 * @Date: 2022-06-08 09:57:54
 * @LastEditTime: 2022-09-30 10:41:37
 * @Description: 
 * 
 */
/**
 * @description: UI帮助类
 */
export class UI {
  static readonly tableHeight698 = 698

  static readonly windowWidth1600 = 1600

  static readonly windowWidth1466 = 1466

  /**
   * @description: 进入全屏
   * @param {HTMLElement} dom html元素
   * @return {void}
   */

  static async fullScreen (dom: HTMLElement) {
    return await dom.requestFullscreen()
  }
  /**
   * @description: 退出全屏
   * @return {void}
   */

  static async exitFullscreen () {
    return await document.exitFullscreen()
  }
  /**
   * @description: 全屏切换
   * @param {HTMLElement} dom html元素
   * @return {void} resolve一个字符串，'exit'退出全屏，'full'进入全屏，reject失败
   */
  
  static async fullScreenToggle (dom: HTMLElement) {
    // 先判断当前状态
    if (document.fullscreenElement) { // 已全屏则退出
      return await this.exitFullscreen().then(() => {
        return Promise.resolve('exit')
      })
    } else {
      // 进入全屏
      return await this.fullScreen(dom).then(() => {
        return Promise.resolve('full')
      })
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

  /**
   * @description: 刷新或者加载事件监听
   * @param {() => void} refresh 刷新回调函数
   * @param {() => void} load 第一次加载回调函数
   */
    
  static refreshOrLoad (refresh?: () => void, load?: () => void) {
    if (window.performance.navigation.type === 1) { // 刷新
      if (refresh) refresh()
    } else { // 加载
      if (load) load()
    }
  }
}