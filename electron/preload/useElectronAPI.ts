/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-07 16:53:04
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-18 16:53:16
 * @FilePath: \zxi-surface\electron\preload\useElectronAPI.ts
 * @Description: 
 */
import { contextBridge, ipcRenderer } from 'electron'
/** 
 * @description: 设置window.electronAPI
 * @return {*}
 */
export function useElectronAPI () {
  contextBridge.exposeInMainWorld('electronAPI', {
    readConfig: () => ipcRenderer.invoke(PreloadName.readConfig),
    controlApp: (status: 'min' | 'max' | 'close') => ipcRenderer.send(PreloadName.controlApp, status),
    toggleDevTools: () => ipcRenderer.send(PreloadName.toggleDevTools),
    cleanCache:()=>ipcRenderer.send(PreloadName.cleanCache)
  })
}

export class PreloadName {
  /** 
   * @description: 传递配置文件
   */  
  static readConfig = 'readConfig'
  /** 
   * @description: 控制app的状态，最大化、最小化、退出
   */  
  static controlApp = 'controlApp'
  /** 
   * @description: 打开调试工具
   */
  static toggleDevTools = 'toggleDevTools'
  /** 
   * @description: 清除缓存
   */
  static cleanCache = 'cleanCache'
}