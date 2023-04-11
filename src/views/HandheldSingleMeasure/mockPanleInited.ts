/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2022-12-01 13:57:17
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-11 09:20:04
 * @FilePath: \zxi-surface\src\views\HandheldSingleMeasure\mockPanleInited.ts
 * @Description:
 */
 import { EParamsType, IMockPanleState } from '@/types'
 export function mockPanleInited (mock: IMockPanleState) {
   // 添加附加参数
   const { vice } = mock
   vice.elements.value = [{
     id:0,
     type:EParamsType.boolean,
     paramName:'playAudio',
     tooltip: '辅助音频',
     title: '辅助音频',
     disabled: false
   },{
     id:1,
     type:EParamsType.enum,
     paramName:'playSpeed',
     tooltip: '辅助音频速率',
     title: '辅助音频速率',
     disabled: false,
     valueList:[
       {
         label: 4,
         value: 4
       },
       {
         label: 5,
         value: 5
       },
       {
         label: 6,
         value: 6
       },
       {
         label: 7,
         value: 7
       },
       {
         label: 8,
         value: 8
       },
       {
         label: 9,
         value: 9
       },
       {
         label: 10,
         value: 10
       },
       {
         label: 11,
         value: 11
       },
       {
         label: 12,
         value: 12
       }
     ]
   }]
 
   if (!Object.hasOwn(vice.form.value, 'playAudio')) vice.form.value.playAudio = false
   if (!Object.hasOwn(vice.form.value, 'playSpeed')) vice.form.value.playSpeed = 7
 
 }

 