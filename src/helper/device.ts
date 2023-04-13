/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-16 14:21:48
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\helper\device.ts
 * @Description: 
 */

import { localStorageKey } from '@/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * @description: 设备帮助类
 */
import { IDeviceParamsPanle, IParam, EParamsType, IParamElement } from 'types/index'
import * as ZHelper from 'mcharts/index'
import { ECaculate, IUnitGroup, Keyboard } from 'mcharts/index'

export class Device extends ZHelper.Device {
  /**
  * @description: 构造参数输入面板
  * @param {Array} data 单台设备某个功能下对应的可用参数
  * @return {IDeviceParamsPanle} 设备参数输入面板表单、验证规则、元素渲染数据
  */
 
  static createParamsPanleForDevice (data: Array<IParam>): IDeviceParamsPanle {
    const rules: any = {}
    const elements: Array<IParamElement> = []
    const form: any = {}
    let id = 1
    data.forEach(x => {
      // 单位
      const reg = /(?<=\()[A-Za-z]+(?=\))/
      const result = x.paramNameOfSimplifiedChinese.match(reg)
      const unit = result ? result[0] : undefined

      // 名称
      const regName = /.+(?=\()/
      const nameR = x.paramNameOfSimplifiedChinese.match(regName)
      const title = nameR ? nameR[0] : x.paramNameOfSimplifiedChinese

      const obj: IParamElement = {
        title,
        tooltip: x.paramNameOfSimplifiedChinese,
        paramName: x.paramName,
        disabled: false,
        unit,
        show: !x.hide,
        id: 0,
        type: x.paramType
      }
      // 输入型inputLists
      if (x.paramType === EParamsType.range) {
        obj.id = id
        obj.placeholder = x.minValue + '~' + x.maxValue
        obj.minValue = x.minValue
        obj.maxValue = x.maxValue
        elements.push(obj)
        id++
        // 构造rules
        rules[x.paramName] = [
          { required: true, message: '不能为空', trigger: 'blur' },
          {
            validator: (rule: any, value: any, callback: any) => {
              if (value > parseFloat(x.maxValue.toString()) || value < parseFloat(x.minValue.toString())) {
                return callback(new Error('min:' + x.minValue + ' max:' + x.maxValue))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
        // 构造form
        form[x.paramName] = x.minValue
      }
      // 选择型selectLists
      if (x.paramType === EParamsType.enum) {
        obj.id = id
        // 生成valueList
        // const isFFT: boolean = x.paramName.indexOf('fftpoints') > -1 && !forbidFFt
        const arr: Array<any> = []
        x.valueList!.forEach((m: any) => {
          let label = m
          let num = Number(m)
          let useUnit: string | undefined
          if (!isNaN(num)) {
            useUnit = unit
            if (unit) {
              // 值单位转换
              const r = Keyboard.unitMultipleFormat(num, unit)
              if (r) {
                label = r.num
                useUnit = r.unit
              }
            }
          }

          const aObj: any = {}
          aObj.id = id
          aObj.value = m
          aObj.label = label + `  ${useUnit ?? ''}`
          aObj.tooltip = ''
          arr.push(aObj)
          id++
        })
        obj.valueList = arr
        elements.push(obj)
        id++
        // 构造form
        form[x.paramName] = arr[0].value
      }
      // 开关boolLists
      if (x.paramType === EParamsType.boolean) {
        obj.id = id
        elements.push(obj)
        id++
        // 构造form
        form[x.paramName] = false
      }
    })
    return { rules, elements, form }
  }

  /**
   * @description: 功能参数本地缓存
   * @param {string} key 功能名
   * @param {any} value 功能名参数和值得对象{}
   * @return {void}
   */  

  static functionParamsLocaCache (key: string, value: any): void {
    // 更新本地缓存中的表单
    const localRuleForms = JSON.parse(localStorage.getItem(localStorageKey.KEY_FORMS)!)
    localRuleForms[key] = value
    localStorage.setItem('local_RuleForms', JSON.stringify(localRuleForms))
  }
  /**
   * @description: 表单数据提交整理为字符串
   * @param {{}} data 用户输入数据{}
   * @return {string} 'key=value,key=value.....'
   */ 

  static formDataString = function (data: any): string {
    let reg = ''
    for (const i in data) { reg += i + '=' + data[i] + ',' }
    reg = reg.slice(0, reg.length - 1) // 去除尾部','

    return reg
  }

  /**
   * @description: 多个表单数据组织
   * @param {Array} forms 多个表
   * @return {string}
   */  

  static formsDataString (forms: Array<any>): string {
    const arr: Array<string> = []
    forms.forEach(x => {
      const reg = Device.formDataString(x)
      arr.push(reg)
    })
    return JSON.stringify(arr)
  }

  /**
   * @description: 任务编辑功能参数反解, 例如reg：polarize=垂直极化,frequency=98,bandwidth=40000,demodulation=不解调,squelch=-100..... => {}
   * @param {*} data 设备参数字符串
   * @return {any}
   */

  static paramStringToForm (data: string): any {
    const form: any = {}
    const dataStr = data.split(',')
    dataStr.forEach(x => {
      const arr: Array<any> = x.split('=')
      if (arr[1] === 'true') { arr[1] = true }
      if (arr[1] === 'false') { arr[1] = false }
      form[arr[0]] = arr[1]
    })
    return form
  }

  /** 
   * @description: 功能间跳转链接key
   * @return {*}
   */ 
  static linkKey = {
    frequency: 'frequency'
  } 

  /** 
   * @description: 功能间跳转链接描述
   * @return {*}
   */  
  static linkDescribe = new Map([
    ['SingleBearing', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['WidebandBearing', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['SingleMeasure', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['CIQStream', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['DPX', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['FHAnalysis', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['IFStreamDiskRecord', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['SA', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['FFMX', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency', 'def'])
      ]
    ])],
    ['SignalRecognitionAnalysis', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency', 'def'])
      ]
    ])],
    ['FHSMA', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['BroadcastMonitoringGuarantee', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['ClusterMonitoringGuarantee', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])],
    ['HandheldSingleMeasure', new Map([
      [Device.linkKey.frequency ,
        new Set(['frequency'])
      ]
    ])]
  ])
}