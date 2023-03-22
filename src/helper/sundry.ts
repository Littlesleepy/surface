/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 09:08:11
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\helper\sundry.ts
 * @Description: 
 */

import { IParamsCache, localStorageKey } from '@/storage'
// import { IServerSignal } from '@/types'
import { ElLoading } from 'element-plus'
import { Ref } from 'vue'
import { Sundry as ZXISundry } from 'mcharts/index'
import { IITUData, IModulateData, ISubaudioDecodingData, Public } from 'mcharts/index'

/**
 * @description: 杂项类
 */
export class Sundry extends ZXISundry {
  static createMarker (text: string | Ref<string> | undefined) {
    return ElLoading.service({
      text,
      background: 'rgba(0, 0, 0, 0.8)'
    })
  }
  /** 
   * @description: 表格数据转换为可导出类型
   * @param {Map} options Map<string| 要使用的数据的prop, string | 要使用的数据的中文名称>
   * @param {Array} data 数据
   * @return {*}
   */  
  static tableFormatForExport (options: Map<string, string>, data: Array<any>, set?: {
    booleanString?: Array<string>
  }) {
    const _options = {
      booleanString: ['开', '关']
    }

    if (set) {
      Public.copyValueFromObject(_options, set)
    }

    const headers: Array<string> = []
    for (const [, label] of options) {
      headers.push(label)
    }

    const len = data.length, formatData: Array<{ contents: Array<string> }> = new Array(len)
    for (let i = 0; i < len; i++) {
      const item = data[i]
      const row: Array<string> = []
      for (const [prop] of options) {
        let value = item[prop] ?? ''
        value = typeof value === 'boolean' ? (value ? _options.booleanString[0] : _options.booleanString[1]) : value.toString()
        row.push(value)
      }

      formatData[i] = { contents: row }
    }

    return { headers, formatData }
  }
  /** 
   * @description: 参数列表格式转换
   * @param {string} functionName 功能名称
   * @param {object} form 参数表单
   * @param {Array} element 参数描述
   * @return {*}
   */  
  static formatParams (
    functionName: string,
    form?: { [p: string]: any },
    element?: Array<{ paramNameOfSimplifiedChinese: string, paramName: string }>) {
    const paramList: IParamsCache = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)

    const params = element ?? paramList[functionName]

    const headers: Array<string> = ['名称', '值']

    const _forms = form ? form : JSON.parse(localStorage.getItem(localStorageKey.KEY_FORMS)!)[functionName]

    const len = params.length, formatData: Array<{ contents: Array<string> }> = new Array(len)

    for (let i = 0; i < len; i++){
      const p = params[i]
      let value = _forms[p.paramName]
      value = typeof value === 'boolean' ? (value ? '开' : '关') : value.toString()
      const row: Array<string> = [p.paramNameOfSimplifiedChinese, value]
      formatData[i] = { contents: row }
    }
    
    return { headers, formatData, title: '测量参数' }
  }
  /** 
   * @description: ITU参数转换为可导出格式
   * @param {Array} data ITU数据
   * @return {*}
   */  
  static formatITU (data: Array<IITUData>) {
    const options = new Map([
      ['name', '名称'], ['curValue', '瞬时值'], ['maxValue', '最大值'], ['minValue', '最小值'], ['aveValue', '平均值']
    ])
    return { ...Sundry.tableFormatForExport(options, data), title: '信道测量' }
  }

  /** 
   * @description: 调制识别转换为可导出格式
   * @param {Array} data 调制识别数据
   * @return {*}
   */  
  static formatModulate (data: Array<IModulateData>) {
    const options = new Map([
      ['name', '调制名称'], ['percent', '识别概率'], ['baudRate', '波特率']
    ])
    return { ...Sundry.tableFormatForExport(options, data), title: '调制识别' }
  }

  /** 
   * @description: 亚音解码转换为可导出格式
   * @param {Array} data 亚音解码数据
   * @return {*}
   */  
  static formatSubaudioDecoding (data: Array<ISubaudioDecodingData>) {
    const options = new Map([
      ['decodingName', '解码类型'], ['decodingResult', '解码结果'], ['decodingCount', '解码次数']
    ])
    return { ...Sundry.tableFormatForExport(options, data), title: '亚音解码' }
  }
  /** 
   * @description: 信号识别结果
   * @param {Array<IServerSignal>} data 信号识别数据
   * @return {*}
   */  
  static formatSignal (data: Array<any>) {
    const options = new Map([
      ['bindingFrequency', '频率(MHz)'], ['bindingBandWidth', '带宽(kHz)'], ['power', '幅度'],
      ['remark', '频段'], ['beginTimeStr', '出现时间'], ['endTimeStr', '消失时间']
    ])

    return { ...Sundry.tableFormatForExport(options, data), title: '信号识别结果' }
  }
  /** 
   * @description: 数字语音解调/解码状态结果
   * @param {Array} data 数据
   * @param {*} title 标题
   * @return {*}
   */  
  static formatDecodingState (data: Array<string>, title = '数字语音解调/解码状态') {
    let str = ''
    data.forEach(s => {
      str += s
      str += '\n'
    })

    return { str, title }
  }
}