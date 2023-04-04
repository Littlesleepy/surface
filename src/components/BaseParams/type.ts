/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-14 16:15:03
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-16 14:18:02
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseParams\type.ts
 * @Description: 
 */
import * as Server from '@/server'
import { IParam } from '@/types'
import { Ref } from 'vue'
import BaseParams from 'cp/BaseParams/BaseParams.vue'

export type BaseParamsType = InstanceType<typeof BaseParams>

export interface IParamsTemplate {
  functionKey: string
  name: string
  form: any
  viceForm: any
  viceElements: Array<any>
  workMode: IWorkMode | undefined
}

export interface IParamElement {
  title: string
  tooltip?: string
  paramName: string
  disabled: boolean
  unit?: string,
  show: boolean
  id: number
  type: EParamsType
  [P: string]: any
}

/**
 * @description: 设备参数输入面板接口
 */
export interface IDeviceParamsPanle {
  rules: any
  elements: Array<IParamElement>
  form: any
}

/**
 * @description: 默认参数面板内部状态
 */

export interface IMockPanleState {
  /**
   * @description: 后台分发的任务ID
   */
  taskId: Ref<number | undefined>
  /**
   * @description: 长连接
   */
  connection: Server.HubConnection | undefined
  /**
   * @description: 用户操作改变参数值
   */
  changeParam?: {
    key: string
    value: string | number
  }
  /**
   * @description: 设备参数
   */
  device: {
    form: Ref<any>
    elements: Ref<Array<any>>
    rules: Ref<any>
  }
  /**
   * @description: 附加参数
   */
  vice: {
    form: Ref<any>
    elements: Ref<Array<any>>
    rules: Ref<any>
  }
}

/**
 * @description: 参数UI类型
 */
export enum EParamsType {
  range = 'range',
  enum = 'enum',
  boolean = 'boolean',
  rangeEnum = 'rangeEnum'
}

/**
 * @description: 主机工况模式
 */
export interface IWorkMode { name: string, hidenParams: Array<IParam> }
/**
 * @description: 附加参数
 */
export interface IParamsVice {
  rules?: Record<string, any>,
  elements: Array<Omit<IParamElement, 'show'>>,
  form: Record<string, any>
}