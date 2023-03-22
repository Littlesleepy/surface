/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-15 14:07:41
 * @FilePath: \zxi-device\src\helper\task.ts
 * @Description: 
 */

import { IDeviceFunc, ITaskList } from '@/types'
import { localStorageKey } from '@/storage'

/**
 * @description: 任务列表后台数据接口
 */
interface IServerTaskList {
  additionalParams: string
  createTime: string
  duration: string
  durationStr: string
  id: number
  isTimeTask: boolean
  loop: boolean
  loopSets: string
  measureFunctionKey: string
  measureParams: string
  rawDataList: Array<any>
  remark: string
  startTime: string
  stopTime: string
  taskStatus: string
  title: string
}

/**
 * @description: 任务帮助工具类
 */
export class Task {
  static readonly taskStatusEn = {
    Created: 'Created',
    Waiting: 'Waiting',
    Running: 'Running',
    Finished: 'Finished',
    Error: 'Error',
    Stoped: 'Stoped'
  }

  static readonly taskStatusCn = {
    Created: '未开始',
    Waiting: '未开始',
    Running: '进行中',
    Finished: '已完成',
    Error: '出错',
    Stoped: '停止'
  }

  /**
   * @description: 任务管理部分数据格式转换
   * @param {Array<IServerTaskList>} data 后台返回数据
   * @return {Array<ITaskList>} 格式转换后的数据
   */  

  static taskFormatConverter (data: Array<IServerTaskList>): Array<ITaskList> {
    const nameObj = Task.functionChineseName()
    const taskLists: Array<ITaskList> = []
    data.forEach(x => {
      const task: ITaskList = {
        remark: x.remark,
        id: x.id,
        title: x.title,
        // 更改任务状态
        taskStatus: Task.taskStatusTranslation(x.taskStatus),
        // 英文功能名保留
        functionEn: x.measureFunctionKey,
        // 更改功能
        measureFunctionKey: nameObj[x.measureFunctionKey],
        // 任务参数
        measureParams: x.measureParams,
        // 创建时间
        createTime: x.createTime.replace(/(T)|(\.)\d*/g, ' '),
        startTime: x.startTime.replace(/(T)|(\.)\d*/g, ' '),
        stopTime: x.stopTime.replace(/(T)|(\.)\d*/g, ' '),
        // 定时任务
        isTimeTask: x.isTimeTask ? '是' : '否',
        // 执行时长
        duration: x.isTimeTask ? x.durationStr : '无限制',
        loopSets: x.loopSets ? Task.dateConversion(x.loopSets) : '否'
      }
      taskLists.push(task)
    })
    return taskLists
  }
  /**
   * @description: 任务状态翻译
   */

  static taskStatusTranslation (name: string): string {
    switch (name) {
    case Task.taskStatusEn.Created: return '未开始'
    case Task.taskStatusEn.Waiting: return '未开始'
    case Task.taskStatusEn.Running: return '进行中'
    case Task.taskStatusEn.Error: return '出错'
    case Task.taskStatusEn.Stoped: return '停止'
    default: return '已完成'
    }
  }
  /**
   * @description: 功能名翻译
   */ 

  static functionChineseName () {
    const obj: any = {}
    const funcs: Array<IDeviceFunc> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONS)!)
    funcs.forEach(x => {
      obj[x.functionKey] = x.name
    })
    return obj
  }

  /**
   * @description: 日期转换data: []
   * @param {string} data
   * @return {string}
   */  

  static dateConversion = function (data: string): string {
    const rg = data.split('')
    // 升序
    rg.sort(function (a, b) { return Number(a) - Number(b) })
    const arr: Array<string> = []
    rg.forEach(x => {
      switch (x) {
      case '1': arr.push('一 ')
        break
      case '2': arr.push('二 ')
        break
      case '3': arr.push('三 ')
        break
      case '4': arr.push('四 ')
        break
      case '5': arr.push('五 ')
        break
      case '6': arr.push('六 ')
        break
      default: arr.push('日')
      }
    })
    return arr.toString().replace(/,/g, '')
  }
}