/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-10-13 11:15:22
 * @FilePath: \zxi-device\src\helper\ui.ts
 * @Description: 
 */

import * as ZHelper from 'mcharts/index'

/**
 * @description: UI帮助类
 */
export class UI extends ZHelper.UI {
  /**
   * @description: 每个功能区查看的模式
   */  

  static watchType = {
    /**
     * @description: 任务实时查看
     */    
    watchTaskRealRime: '任务实时查看',
    /**
     * @description: 数据回放
     */ 
    watchReplay: '数据回放',
    /**
     * @description: 实时监测
     */
    watchRealTime: '实时监测'
  }
}