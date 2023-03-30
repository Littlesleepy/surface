/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-02 10:35:09
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-02 13:34:11
 * @FilePath: \zxi-device\src\components\BaseLink\index.ts
 * @Description: 
 */
import { ref } from 'vue'
import { IClientPosition, IPosition, ISpectrumDbClickResult, Listen } from 'mcharts/index'

export interface IBaseLink {
  position: IClientPosition
  mouseOrTouch: string
  value: string | number
  describe: string
  propoerty: any
}

/** 
 * @description: BaseLink对于频率触发的组合api
 * @return {*}
 */
export function setLinkTrigger () {
  const trigger = ref<IBaseLink>({
    position: { clientX: 0, clientY: 0 },
    mouseOrTouch: '',
    value: 0,
    describe: '',
    propoerty: {}
  })
  /** 
   * @description: 接收频谱反出结果的方法
   * @param {ISpectrumDbClickResult} result 结果
   * @param {*} propoerty 设置trigger.propoerty自定义属性
   * @return {*}
   */  
  function selectFrequency (result: ISpectrumDbClickResult, propoerty = {}) {
    const { baseEvent, mouseOrTouch } = result
    const position: IClientPosition = { clientX: 0, clientY: 0 }

    position.clientX = mouseOrTouch === Listen.MOUSE ? (baseEvent as MouseEvent).clientX : (baseEvent as TouchEvent).touches[0].clientX
    position.clientY = mouseOrTouch === Listen.MOUSE ? (baseEvent as MouseEvent).clientY : (baseEvent as TouchEvent).touches[0].clientY

    trigger.value = {
      position,
      mouseOrTouch,
      value: result.value,
      describe: result.value + 'MHz',
      propoerty
    }
  }

  return {
    trigger,
    selectFrequency
  }
}