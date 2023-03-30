/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-23 11:22:01
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-01-05 11:53:13
 * @FilePath: \zxi-device\src\views\PScan\components\useSample.ts
 * @Description: 
 */
import { Device } from '@/helper'
import { useFrameStore } from '@/store'
import { IMockPanleState } from '@/types'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ISample } from '..'

export function useSample () {
  const route = useRoute()

  const store = useFrameStore()
  
  const sample = ref<ISample>()

  function getSample (s: ISample | undefined) {
    sample.value = s
    store.m_formOne({ key: 'threshold', value: '样本' })
  }
  
  function beforeTaskStart (params: { value: string }, panle: IMockPanleState) {
    const { device } = panle
    if (device.form.value.threshold === '样本') {
      if (sample.value) {
        device.form.value.begin = sample.value.begin
        device.form.value.end = sample.value.end
        device.form.value.step = sample.value.step

        const str = (route.name!).toString() + '|' + Device.formDataString(device.form.value)
        params.value = str + `,scanSampleId=${sample.value.id}`
      } else {
        ElMessage.error('信号门限为样本时必须选择一份样本')
        return false
      }
    }
    return true
  }

  return {
    sample,
    getSample,
    beforeTaskStart
  }
}