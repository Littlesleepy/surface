/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 09:41:12
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 16:35:33
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\store\modules\frame.ts
 * @Description: 
 */

import { ESwitchState } from 'mcharts/index'
import { defineStore } from 'pinia'
import * as Helper from 'helper/index'

/**
 * @description: 文件状态store
 */
export const useFrameStore = defineStore('frame', {
  state: () => ({
    /**
     * @description: 启停按钮
     */
    s_playButton: ESwitchState.off,
    /**
     * @description: 参数面板数据
     */
    s_form: {} as any,
    /**
     * @description: 单独改变ruleForm某一项的值
     */
    s_formOne: { key: '', value: null } as { key: string, value: any },
    /**
     * @description: 动态修改某项参数结果
     * @return {*}
     */
    s_formOneResult: { result: false, key: '', value: null } as { result: boolean, key: string, value: any },
    /**
     * @description: 附加参数面板数据
     */
    s_viceForm: {} as Record<string, any>,
    /**
     * @description: 长连接任务id
     */
    s_taskId: undefined as undefined | number
  }),
  actions: {
    reset () {
      this.s_playButton = ESwitchState.off
      this.s_taskId = undefined
      this.s_form = {}
    },
    m_playButton (value?: ESwitchState) {
      if (value === undefined) {
        if (this.s_playButton === ESwitchState.off) {
          this.s_playButton = ESwitchState.open
        } else {
          this.s_playButton = ESwitchState.off
        }
      } else {
        this.s_playButton = value
      }
    },
    m_form (value: any) {
      const newObj = {}
      Helper.Sundry.deepCopy(newObj, value)
      this.s_form = newObj
    },
    m_formOne (obj: { key: string, value: any }) {
      this.s_formOne = obj
    },
    m_formOneResult (obj: { result: boolean, key: string, value: any }) {
      this.s_formOneResult = obj
    },
    m_viceForm (value: any) {
      this.s_viceForm = value
    },
    m_taskId (value: number | undefined) {
      this.s_taskId = value
    }
  }
})