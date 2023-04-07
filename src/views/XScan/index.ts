 import { Device } from '@/helper/device'
 import { onBeforeUnmount, Ref, watch } from 'vue'
 /** 
  * @description: fft点数参数选项的label更改
  * @param {string} fftKey fft的键名称
  * @param {string} bandWidthKey 带宽的键名称
  * @param {Ref} elements UI列表
  * @param {Ref} form 表单
  * @param {string} title fft点数参数名称修改
  * @return {*}
  */
 export function fftToResolutionRatio (fftKey: string, bandWidthKey: string, elements: Ref<Array<any>>, form: Ref<any>, title: string, stopWatch = false) {
   caculate(fftKey, bandWidthKey, elements, form, title)
 
   const stop = watch(() => form.value[bandWidthKey], () => {
     caculate(fftKey, bandWidthKey, elements, form, title)
   })
 
   if (!stopWatch) {
     onBeforeUnmount(() => {
       stop()
     })
   } else {
     return stop
   }
 }
 
 function caculate (fftKey: string, bandWidthKey: string, elements: Ref<Array<any>>, form: Ref<any>, title: string) {
   elements.value.forEach(el => {
     // 修改全景频谱点数
     if (el.paramName === fftKey) {
       const realWidth = Device.getSamplingRateByBandwidth(Number(form.value[bandWidthKey]))
       el.title = title
       el.tooltip = title
       el.valueList.forEach(x => {
         const step = realWidth / Number(x.value)
         x.label = frequncyTrance(step)
       })
     }
   })
 }
 
 /** 
  * @description: kHz转换
  * @param {number} step kHz
  * @return {*}
  */    
 export function frequncyTrance (step: number) {
   if (step > 1000) {
     return step / 1000 + 'MHz'
   } else if (step < 1) {
     return step * 1000 + 'Hz'
   } else {
     return step + 'kHz'
   }
 }