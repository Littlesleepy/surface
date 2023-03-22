/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-03 17:14:02
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 11:33:07
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\views\SingleMeasure\index.ts
 * @Description: 
 */
import { ReceiveData, ReceiveDataOptions, makeSpectrumData } from '@/server'
import { useFrameStore, useServerStore } from '@/store'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ISpectrumInputData, IHighlightItem, ZXISpectrumAndFall, EAxisXType } from 'mcharts/index'
import { ElMessage } from 'element-plus'

// import { setLinkTrigger } from '@/types'
import { ToExport } from '@/helper/dataExport'
import { Sundry } from '@/helper'

export function useSingleMeasure () {
  const serverStore = useServerStore()
    
  const spectrumInstance0 = ref<InstanceType<typeof ZXISpectrumAndFall>>()

  const spectrumInstance1 = ref<InstanceType<typeof ZXISpectrumAndFall>>()

  const store = useFrameStore()

  const route = useRoute()

  const spectrum = ref<Array<ISpectrumInputData>>([{
    data: new Float32Array(),
    time: 0
  }])

  const hightlightItems = computed<Array<IHighlightItem>>(() => {
    if (store.s_form) {
      const arr: Array<IHighlightItem> = [{
        bandwidth: Number(store.s_form.debw) / 1000,
        centerFrequency: Number(store.s_form.frequency)
      }]
      return arr
    }
    return []
  })

  const params = computed(() => {
    const form = store.s_form
    console.log(form)
    return {
      begin: Number(form.frequency) - form.bandwidth / 2000,
      end: Number(form.frequency) + form.bandwidth / 2000,
      bandwidth: Number(form.bandwidth) / 1000
    }
  })

  const audioSpectrum = ref<Array<ISpectrumInputData>>([{
    data: new Float32Array(),
    time: 0
  }])

  const audioParams = ref({
    begin: 0,
    end: 0,
    bandwidth: 0
  })
  // /** 
  //  * @description: 可接收音频频谱数据
  //  * @return {*}
  //  */    
  // let canReceiveAudio = false

  function changeFrequency () {
    // store.m_formOne({ key: 'frequency', value: trigger.value.value })
  }

  const markers = ref<Array<number>>([])

  // const { trigger, selectFrequency } = setLinkTrigger()

  // function backItem (item: number) {
  //   canReceiveAudio = item !== 0

  //   // if (canReceiveAudio && cacheAudioData) setAboutAudio(cacheAudioData)
  // }

  // 数据接收
  const options: ReceiveDataOptions = new Map()
  const optionsChild: ReceiveDataOptions = new Map()
  // 频谱数据
  optionsChild.set('SPECTRUMDATA', {
    control: (data) => {spectrum.value = [makeSpectrumData(data)] }
  })

  // 溢出
  optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
    control: (data: { data: boolean }) => {
      if (data.data) {
        ElMessage({ message: '溢出', type: 'warning', grouping: true })
      }
    }
  })

  // 音频频谱
  // let cacheAudioData: {sampleRate: number, spectrumData: Array<number>, time: string} | undefined
  // optionsChild.set('AUDIOSPECTRUM', {
  //   control: (data) => {
  //     cacheAudioData = data

  //     if (canReceiveAudio) setAboutAudio(data)
  //   }
  // })

  // /** 
  //  * @description: 音频
  //  * @param {any} data
  //  * @return {*}
  //  */    
  // function setAboutAudio (data: any) {
  //   audioParams.value.end = data.sampleRate / 1000000
  //   audioParams.value.bandwidth = data.sampleRate / 1000000

  //   audioSpectrum.value = [{
  //     data: new Float32Array(data.spectrumData),
  //     time: new Date(data.time).getTime()
  //   }]
  // }

  options.set('DATA', { children: optionsChild })
  ReceiveData.add(options)

  // watch(() => store.s_playButton, (btn) => {
  //   if (btn === ESwitchState.open) {
  //     cacheAudioData = undefined
  //   }
  // })

  ToExport.beforExport.set('params', () => {
    ToExport.DATA.clear()
    ToExport.DOM.clear()
    // 参数
    const result = Sundry.formatParams(route.meta.functionKey!)
    ToExport.addTable(result.title, result.headers, result.formatData, 0)

    if (spectrum.value[0].data.length > 0) ToExport.addDom('信道频谱', spectrumInstance0.value!.root!, 1)

    // if (cacheAudioData) {
    //   const dom1 = spectrumInstance1.value!.root!
    //   ToExport.addDom('音频频谱', dom1, 2)
    //   // 绘制
    //   setAboutAudio(cacheAudioData)
    // }
    
    ToExport.addText('GPS信息', serverStore.s_serverStateInfo.gpsLocation.locationResult , 7)
  })

  return {
    EAxisXType,
    spectrumInstance0,
    spectrumInstance1,
    store,
    params,
    hightlightItems,
    route,
    spectrum,
    changeFrequency,
    // selectFrequency,
    // trigger,
    markers,
    audioSpectrum,
    audioParams
  }
}