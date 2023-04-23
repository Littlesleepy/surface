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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ISpectrumInputData, IHighlightItem, ZXISpectrumAndFall, EAxisXType, IITUData, IModulateData, ISubaudioDecodingData, ESwitchState } from 'mcharts/index'
import { ElMessage } from 'element-plus'

import { setLinkTrigger } from '@/types'
// import { ToExport } from '@/helper/dataExport'
import { ToExport } from "helper/dataExports/index";
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

  const clear = computed(() => store.s_playButton === ESwitchState.open)

  const params = computed(() => {
    const form = store.s_form
    
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
    store.m_formOne({ key: 'frequency', value: trigger.value.value })
  }

  const markers = ref<Array<number>>([])

  const { trigger, selectFrequency } = setLinkTrigger()

  // 重置
  const reset = ref(false)

  watch([() => store.s_form.bandwidth, () => store.s_form.frequency], () => {
    reset.value = !reset.value
  })

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
  
  const subaudioDecoding = ref<Array<ISubaudioDecodingData>>([])

  const ITU = ref<Array<IITUData>>([])
  const modulate = ref<Array<IModulateData>>([])
  const decodingState = ref<Array<string>>([])
  
  // ITU
  optionsChild.set('ITU', {
    control: (data) => {
      ITU.value = data.data
    }
  })
  // 模式识别
  optionsChild.set('MODE', {
    control: (data) => {
      modulate.value = data.data
    }
  })
  // 数字语音解调/解码状态
  optionsChild.set('LOGTEXTSTATE', {
    control: (data) => {
      decodingState.value = data.data
    }
  })
  // 亚音频解码
  optionsChild.set('SUBAUDIODATA', {
    control: (data) => {
      const arr: Array<ISubaudioDecodingData> = []
      if (data) {
        data.cdcss_n.forEach(element => {
          arr.push(element)
        })
        data.cdcss_p.forEach(element => {
          arr.push(element)
        })
        data.ctcss.forEach(element => {
          arr.push(element)
        })
      }
      subaudioDecoding.value = arr
    }
  })

  options.set('DATA', { children: optionsChild })
  ReceiveData.add(options)

  // watch(() => store.s_playButton, (btn) => {
  //   if (btn === ESwitchState.open) {
  //     cacheAudioData = undefined
  //   }
  // })

  watch(() => store.s_playButton, (btn) => {
    if (btn === ESwitchState.open) {
      subaudioDecoding.value = []
      ITU.value = []
      modulate.value = []
      decodingState.value = []
    }
  })

  ToExport.beforExport.set('params', () => {
    // ToExport.DATA.clear()
    // ToExport.DOM.clear()
    ToExport.reset()
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
    clear,
    route,
    spectrum,
    changeFrequency,
    selectFrequency,
    trigger,
    markers,
    audioSpectrum,
    audioParams,
    subaudioDecoding,
    ITU,
    modulate,
    decodingState,
    reset
  }
}