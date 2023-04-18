/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 16:26:09
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\storage\localStorage.ts
 * @Description:
 */
import { Axios } from '@/server'
import { ElMessage } from 'element-plus'
import { EParamsType } from '@/types'

/**
 * @description: 设备接口
 */
export interface IDeviceFunc {
  description: string
  enableTask: boolean
  functionKey: string
  name: string
  orderIndex: number
  subjectionKey: string
}

/**
 * @description: 功能每项参数接口
 */
export interface IParam {
  currentValue: string | null
  defaultValue: string | null | boolean
  hide: boolean
  maxValue: number
  minValue: number
  paramName: string
  paramNameOfSimplifiedChinese: string
  paramType: EParamsType
  valueList: Array<string> | null
}

/**
 * @description: 功能接口
 */
export interface IFunction {
  functionName: string
  isSuccess: boolean
  paramsList: Array<IParam>
}

/**
 * @description: 本地保存的参数列表
 */
export interface IParamsCache {
  [p: string]: Array<IParam>
}

export class localStorageKey {
  static KEY_USER_TOKEN = 'USER_TOKEN'

  static KEY_USER_LOGIN = 'USER_LOGIN'
  /**
   * @description: 功能列表缓存key
   */

  static readonly KEY_FUNCTIONS = 'local_measureFunctionKeys'
  /**
   * @description: 每项功能参数列表
   */

  static readonly KEY_FUNCTIONPARAMLISTS = 'local_parameterOfApparatus'
  /**
   * @description: 每一项功能参数值缓存
   */

  static readonly KEY_FORMS = 'local_RuleForms'
  /**
   * @description: 每一项功能附加参数缓存
   */

  static readonly KEY_VICEFORMS = 'local_viceForms'
  /**
   * @description: 设备信息
   */

  static readonly KEY_DEVICEINFO = 'local_baseInfo'
  /**
   * @description: 主机工况
   */
  static readonly KEY_WORKINGMODE = 'Working_mode'
  /**
   * @description: 主题名称
   */
  static readonly KEY_THEME_NAME = 'theme_name'
}

/**
 * @description: 检查设置缓存
 * @return {Promise<string>} 检查和设置的结果状态
 */
export async function localCache (): Promise<boolean> {
  getBaseInfo()
  // 获取功能
  let dataFunc:IDeviceFunc[] | undefined = []
  dataFunc = await getDeviceFunction()
  if (!dataFunc || dataFunc.length === 0) {
    return false
  }
  // 获取功能参数
  const success = await oneOffGetFunctionParams(dataFunc)
  if (!success) {
    return false
  }
  // 功能参数处理
  getLocalRuleForms()
  // 检测附加参数缓存
  checkViceForms()

  return true
}
/* ............................................设备功能及对应参数缓存对比更新............................................ */

/**
 * @description: 设置功能及参数的本地缓存方法
 * @return {Promise<Array<IDeviceFunc>>}
 */
async function getDeviceFunction (): Promise<Array<IDeviceFunc> | undefined> { // 获取设备功能
  return await Axios({
    url: 'api/Device/deviceFunction',
    method: 'get'
  }).then(msg => {
    const funcs: Array<IDeviceFunc> = msg.data
    console.log(funcs)
    localStorage.setItem(localStorageKey.KEY_FUNCTIONS, JSON.stringify(funcs)) // 1.缓存key: local_measureFunctionKeys
    return funcs
  }).catch((err) => {
    ElMessage.error(`请求设备功能异常：${err}`)
    return undefined
  })
}

// 一次性获取功能参数
async function oneOffGetFunctionParams (funcs: Array<IDeviceFunc>): Promise<boolean> {
  const reg: Array<string> = []
  funcs.forEach((x: IDeviceFunc) => {
    reg.push(x.functionKey)
  })
  return await Axios({
    url: 'api/Device/functionsParam',
    method: 'get',
    headers: {
      'content-type': 'application/json'
    },
    params: {
      functionKeys: reg.toString()
    }
  }).then(msg => {
    let funcs: Array<IFunction> = msg.data
    // 部分功能参数特殊处理
    funcs = changeFunctionParams(funcs)
    const parameterOfApparatus: IParamsCache = {}
    funcs.forEach(x => { parameterOfApparatus[x.functionName] = x.paramsList })
    localStorage.setItem(localStorageKey.KEY_FUNCTIONPARAMLISTS, JSON.stringify(parameterOfApparatus)) // 2.缓存key: local_parameterOfApparatus
    return true
  }).catch((err) => {
    ElMessage.error(`请求功能参数异常：${err}`)
    return false
  })
}
/**
 * @description: 参数列表特殊处理需求
 * @param {Array<any>} params 参数列表
 * @return {*}
 */
function changeFunctionParams (params: Array<IFunction>): Array<IFunction> {
  for (let i = 0, len = params.length; i < len; i++) {
    const item = params[i]
    // 后端给的部分默认值改造
    for (let j = 0, len = item.paramsList.length; j < len; j++) {
      const param = item.paramsList[j]
      // 布尔值改造
      if (param.paramType === EParamsType.boolean && param.defaultValue !== null) {
        param.defaultValue = param.defaultValue === 'true' ? true : false
      }
    }
  }
  return params
}
/**
 * @description: 本地缓存任务输入记录初始化
 */
function getLocalRuleForms () {
  const formString = localStorage.getItem(localStorageKey.KEY_FORMS)
  let form: any = {}
  if (formString) form = JSON.parse(formString)
  const parameterOfApparatus: IParamsCache = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)
  // 构造localRuleForms
  const localRuleForms: any = {}
  // F为功能名称
  Object.keys(parameterOfApparatus).forEach(F => {
    const value: any = {}
    // 当前设备功能参数数组
    const NParame = parameterOfApparatus[F]
    // 判断当前设备功能在原来缓存中是否存在
    if (F in form) {
      // 缓存功能参数对象
      const LParame = form[F]
      // 遍历该对象
      NParame.forEach(P => {
        // 判断该功能参数在原缓存中是否存在
        if (P.paramName in LParame) {
          // 判断缓存的参数的值是否在当前设备可合法使用
          const LParameValue = LParame[P.paramName]
          // 1、range类型数据
          if (P.paramType === EParamsType.range) {
            value[P.paramName] = P.minValue
            if (Number(LParameValue) >= Number(P.minValue) && Number(LParameValue) <= Number(P.maxValue)) {
              value[P.paramName] = LParameValue
            }
          }
          // 2、enum类型数据
          if (P.paramType === EParamsType.enum) {
            value[P.paramName] = P.valueList![0]
            P.valueList!.forEach(E => {
              if (E === LParameValue) {
                value[P.paramName] = LParameValue
              }
            })
          }
          // 3、boolean类型数据
          if (P.paramType === EParamsType.boolean) {
            value[P.paramName] = LParameValue
          }

        } else {
          if (P.paramType === EParamsType.range) { value[P.paramName] = parseFloat(((P.minValue + P.maxValue) / 2).toFixed(0)) }
          if (P.paramType === EParamsType.enum) { value[P.paramName] = P.valueList![0] }
          if (P.paramType === EParamsType.boolean) { value[P.paramName] = false }
        }
      })
    } else {
      const initialParams = Config.initialParams[F]

      for (let i = 0, len = NParame.length; i < len; i++) {
        const P1 = NParame[i]
        const parameter = P1.paramName
        // A、本地配置参数
        if (initialParams) {
          const initialV = initialParams[parameter]
          if (initialV !== undefined) {
            value[parameter] = initialV

            // 检查默认值是否规范
            // 1、range类型数据
            if (P1.paramType === EParamsType.range) {
              if (initialV <= P1.maxValue && initialV >= P1.minValue) continue
            }

            // 2、enum类型数据
            if (P1.paramType === EParamsType.enum) {
              let has = false
              P1.valueList!.forEach(item => {
                if (item === initialV) has = true
              })

              if (has) continue
            }

            // 3、boolean类型数据
            if (P1.paramType === EParamsType.boolean) continue
          }
        }

        // B、是否自带默认值
        if (P1.defaultValue !== null) {
          value[parameter] = P1.defaultValue

          // 检查默认值是否规范
          // 1、range类型数据
          if (P1.paramType === EParamsType.range) {
            const defaultValue = Number(P1.defaultValue)
            if (defaultValue <= P1.maxValue && defaultValue >= P1.minValue) continue
          }

          // 2、enum类型数据
          if (P1.paramType === EParamsType.enum) {
            let has = false
            P1.valueList!.forEach(item => {
              if (item === P1.defaultValue) has = true
            })

            if (has) continue
          }

          // 3、boolean类型数据
          if (P1.paramType === EParamsType.boolean) continue
        }

        // C服务没有指定默认参数
        // 1、range类型数据
        if (P1.paramType === EParamsType.range) {
          value[parameter] = P1.minValue
        }
        // 2、enum类型数据
        if (P1.paramType === EParamsType.enum) {
          value[parameter] = P1.valueList![0]
        }
        // 3、boolean类型数据
        if (P1.paramType === EParamsType.boolean) {
          value[parameter] = false
        }
      }

    }
    localRuleForms[F] = value
  })

  localStorage.setItem(localStorageKey.KEY_FORMS, JSON.stringify(localRuleForms)) // 3.缓存key: local_RuleForms
}
/**
 * @description: 检测附加参数缓存
 */
function checkViceForms () {
  const formString = localStorage.getItem(localStorageKey.KEY_VICEFORMS)
  if (!formString) {
    localStorage.setItem(localStorageKey.KEY_VICEFORMS, JSON.stringify({}))
  }
}
/**
 * @description: 获取设备基础信息
 * @return {void}
 */
function getBaseInfo () {
  // 设备信息
  Axios({
    url: 'api/Device/deviceName'
  }).then((msg) => {
    localStorage.setItem(localStorageKey.KEY_DEVICEINFO, JSON.stringify(msg.data))
  }).catch((err) => {
    ElMessage.error(err)
  })

  Axios({
    url: 'api/Device/deviceAppWorkeModeInfos'
  }).then((msg) => {
    localStorage.setItem(localStorageKey.KEY_WORKINGMODE, JSON.stringify(msg.data))
  }).catch((err) => {
    localStorage.setItem(localStorageKey.KEY_WORKINGMODE, JSON.stringify([]))
  })
}