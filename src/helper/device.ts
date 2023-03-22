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

      const obj: IParamElement = {
        title: x.paramNameOfSimplifiedChinese,
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
        x.valueList!.forEach((m: any)=> {
          const aObj: any = {}
          aObj.id = id
          aObj.value = m
          aObj.label = m
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
  * @description: 部分功能默认参数
  */ 

  static readonly localCacheMockValue = {
    SingleMeasure: {
      frequency: '98',
      bandwidth: '1000',
      spectrummode: '快速模式',
      avgcount: '1',
      debw: '100',
      demodulation: '不解调',
      squelch: '-100',
      attenuation: '自动',
      detector: '平均',
      rfworkmode: '常规模式',
      decode: '无',
      itumeasure: false,
      recognise: false,
      tcpaudio: false
    },
    PScan: {
      begin: '80',
      end: '500',
      step: '25',
      attenuation: '自动',
      rfworkmode: '常规模式',
      scanmode: '快速模式',
      avgcount: '1',
      framerate: '5',
      firstrfatt: true
    },
    SpectrumEvaluate: {
      begin: '30',
      end: '6000',
      step: '25',
      framerate: '1'
    },
    SingleBearing: {
      polarize: '垂直极化',
      frequency: '98',
      bandwidth: '1000',
      demodulation: '不解调',
      squelch: '0',
      attenuation: '自动',
      dfmode: '常发信号',
      rfworkmode: '常规模式',
      threshold: '-100',
      spectrum: true,
      tcpaudio: false
    },
    ListBearing: {
      polarize: '垂直极化',
      frequency: '98.1',
      bandwidth: '4000',
      demodulation: '不解调',
      squelch: '-50',
      attenuation: '自动',
      dfmode: '常发信号',
      rfworkmode: '常规模式',
      threshold: '-10',
      dwelltime: '5',
      holdtime: '1',
      spectrum: true
    },
    MScan: {
      frequency: '101.7',
      bandwidth: '5000',
      demodulation: '不解调',
      squelch: '-50',
      attenuation: '自动',
      rfworkmode: '常规模式',
      threshold: '-10',
      dwelltime: '5',
      holdtime: '1',
      spectrum: true,
      tcpaudio: false,
      itumeasure: true,
      recognise: true
    },
    ADSBDemod: {
      nacpexceptionthreshold: '5'
    },
    MCAnalysis: {
      panspectrum: true
    },
    FFMX: {
      itumeasure: true,
      chspectrum: true,
      recognise: true
    }
  }

  /**
   * @description: 频率表测向和频率表扫描频率表为空新建频率表方法
   * @param {string} name 功能名称
   * @param {() => void} addItem 添加一项的方法
   * @return {void}
   */  
  static async addCarWhenEmpty (name: string, addItem: () => void) {
    const funcParams = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)[name]
    // 输入验证
    let validation
    funcParams.forEach(x => {
      if (x.paramName === 'frequency') { validation = x }
    })
    await ElMessageBox.prompt('请输入频率', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'number',
      inputValidator: (value) => {
        const valueT = Number(value)
        return (valueT <= Number(validation.maxValue) && valueT >= Number(validation.minValue))
      },
      inputErrorMessage: `${validation.minValue}~${validation.maxValue}`
    }).then(({ value }) => {
      // 修改缓存的频率值
      const ruleForm = JSON.parse(localStorage.getItem(localStorageKey.KEY_FORMS)!)[name]
      ruleForm.frequency = value
      Device.functionParamsLocaCache(name, ruleForm)
      addItem()
      ElMessage({
        type: 'success',
        message: '新建频率: ' + value + 'MHz'
      })
    }).catch(() => {
      ElMessage({
        type: 'info',
        message: '取消输入'
      })
    })
  }
  /**
   * @description: 服务器返回任务的参数逆解为包含对象的数组，用于频谱图任务信息面板渲染
   * @param {string} name 功能名
   * @param {string} data 参数组合字符串
   * @return { panle: Array<{ key: string, value: string }>, form: { [p: string]: any } }
   */ 

  static reverseParseParams = function (name: string, data: string):
  { panle: Array<{ key: string, value: string }>, form: { [p: string]: any } } {
    const arr: Array<{ key: string, value: string }> = []
    const useFunctionArr: Array<IParam> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)[name] // 用于翻译参数名
    const strToArray = data.split(',')
    const form: { [p: string]: any } = {}

    strToArray.forEach(str => {
      const keyValue = str.split('=')
      const key = keyValue[0]
      let value = keyValue[1] as any

      if (value === 'true') value = true
      if (value === 'false') value = false

      form[key] = value
      // 找到对应的中文名，隐藏一些参数
      const param: { key: string, value: string } = { key: '', value: '' }
      for (let i = 0, len = useFunctionArr.length; i < len; i++) {
        const item = useFunctionArr[i]
        if (item.paramName === key && !item.hide) {
          param.key = item.paramNameOfSimplifiedChinese
          if (value === false) value = '关'
          if (value === true) value = '开'
          param.value = value
          arr.push(param)
          break
        }
      }
    })
    return { panle: arr, form }
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