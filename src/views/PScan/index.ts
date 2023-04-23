/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-21 11:45:29
 * @FilePath: \zxi-surface\src\views\PScan\index.ts
 * @Description: 
 */
import { CustomTheme } from '@/types'

/**
 * @description: 后端信号识别接口
 */
export interface IServerAutoThreshold {
  hopSpeed?: number
  signals: Array<any>
  autoThreshold: Float32Array
}

export interface ISample {
  att: string
  begin: number
  characteristicSpectrum: Float32Array
  end: number
  endTime: string
  id: string
  remark: string
  sampleSignals: Array<Pick<any, 'amplitude' | 'bindingBandWidth' | 'bindingFrequency' | 'bindingCenterIndex'> >
  startTime: string
  step: number
  threshold: Float32Array
  workMode: string
}

export type ISampleData = IServerAutoThreshold & {
  peak: Float32Array
  params: {
    begin: number
    end: number
    step: number
    attenuation: string,
    rfworkmode: string
  }
}

export { useSample } from './components/useSample'

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useFrameStore, useServerStore } from 'store/index'
import { ESwitchState, IAdditionalCurve, ISpectrumAndFallSpectrumPool, ISpectrumScanInputData, ITargetIcon, Scene, ZXISpectrumScanAndFall } from 'mcharts/index'
import { useRoute } from 'vue-router'
import { ReceiveDataOptions, makeSpectrumData, ReceiveData } from '@/server'
import { setLinkTrigger } from '@/types'
import { ElMessage } from 'element-plus'
import { useSample } from './components/useSample'
import { Sundry } from '@/helper'
import { ToExport } from "helper/dataExports/index";

/**
 * @description: 后端信号识别频率接口
 */
export interface IServerSignal {
  bindingFrequency: number
  bindingBandWidth: number
  bindingCenterIndex: number
  amplitude: number
  bindingString: string
  beginTimeStr: string
  endTimeStr: string | null
  /** 
   * @description: 幅度
   */
  power: number
  remark: string
}

export function usePScan () {
  const store = useFrameStore()

  const route = useRoute()

  const additionalCurve = ref(new Map<string, IAdditionalCurve>())

  const icons = ref<Array<ITargetIcon>>([])

  const hopSpeed = ref()

  const scaleY = {
    unit: '%',
    parse: (v) => {
      return '占用度：' + v.toFixed(2) + '%'
    },
    transform: (v: number) => {
      return parseFloat(v.toFixed(2))
    }
  }

  const defaultValueY = { max: 120, min: 0 }

  const form = computed(() => store.s_form)

  const params = computed(() => {
    const form = store.s_form

    return {
      begin: Number(form.begin ?? 0),
      end: Number(form.end ?? 0),
      step: Number(form.step ?? 0)/ 1000
    }
  })

  const spectrumScan = ref<Array<ISpectrumScanInputData>>([{
    data: new Float32Array(),
    frequency: 0,
    sc: 0,
    time: 0
  }])

  const occupancySpectrum = ref<Array<ISpectrumScanInputData>>([{
    data: new Float32Array(),
    frequency: 0,
    sc: 0,
    time: 0
  }])

  const autoThreshold = ref<IServerAutoThreshold>({
    hopSpeed: 0,
    signals: [],
    autoThreshold: new Float32Array()
  })

  const sampleData = ref<ISampleData>({
    signals: [],
    autoThreshold: new Float32Array(),
    peak: new Float32Array(),
    params: {
      begin: 0,
      end: 0,
      step: 0,
      attenuation: '',
      rfworkmode: ''
    }
  })

  const occupyShow = computed(() => {
    if (typeof store.s_form.occupy === 'string') {
      return store.s_form.occupy === '开' ? true : false
    }
    return store.s_form.occupy
  })

  const scene1 = ref<Scene<ISpectrumAndFallSpectrumPool>>()
  function getSpectrumScene1 (scene: Scene<ISpectrumAndFallSpectrumPool>) {
    scene1.value = scene
  }

  function getSpectrumScene2 (scene: Scene<ISpectrumAndFallSpectrumPool>) {
    // @ts-ignore
    scene1.value.shareFenceTo(scene)
  }

  const markers = ref<Array<number>>([])
    
  const { trigger, selectFrequency } = setLinkTrigger()

  const { sample, getSample, beforeTaskStart } = useSample()

  // 接收数据部分注册
  const options: ReceiveDataOptions = new Map()
  const optionsChild: ReceiveDataOptions = new Map()
  // 接收门限
  function receiveThreshold (value) {
    value.autoThreshold = new Float32Array(value.autoThreshold)
    autoThreshold.value = value

    if (value.hopSpeed !== undefined) {
      hopSpeed.value = '跳数:' + value.hopSpeed.toFixed(3) + '次/s'
    } else {
      hopSpeed.value = undefined
    }
    const iconArr: Array<ITargetIcon> = []
    for (let i = 0, len = value.signals.length; i < len; i++) {
      const signal = value.signals[i]
      const item: ITargetIcon = {
        dataIndex: signal.bindingCenterIndex,
        message: signal.bindingString
      }
      iconArr[i] = item
    }
    icons.value = iconArr
    if (value.autoThreshold.length > 0) {
      additionalCurve.value = new Map([
        [
          '0',
          {
            data: value.autoThreshold,
            color: CustomTheme.theme.thresholdColor
          }
        ]
      ])

      if (store.s_form.threshold === '样本' && sample.value) {
        additionalCurve.value.set('1', {
          data: sample.value.threshold,
          color: [0.98, 0.5019, 0.0392]
        })
      }

      sampleData.value = {
        peak: scene1.value!.pool!.statisticalBuffer.max!,
        autoThreshold: value.autoThreshold,
        signals: value.signals,
        params: store.s_form
      }
    } else {
      additionalCurve.value = new Map()
    }
  }
  options.set('SIGNALMARKINFO', { control: receiveThreshold })
  optionsChild.set('FREQUENCYHOPDATA', { control: receiveThreshold })

  // 接收扫描频谱数据
  optionsChild.set('SPECTRUMDATA', {
    control: (data) => {
      spectrumScan.value = [makeSpectrumData(data)] 
    }
  })
  // 占用度
  function watchOccupy (data) {
    const value: ISpectrumScanInputData = {
      data: new Float32Array(data.occupyArray),
      frequency: store.s_form.begin,
      sc: 0,
      time: new Date(data.time).getTime()
    }
    occupancySpectrum.value = [value]
    // 自动门限优先
    if (autoThreshold.value.autoThreshold.length > 0) {
      additionalCurve.value = new Map([
        [
          '0',
          {
            data: autoThreshold.value.autoThreshold,
            color: CustomTheme.theme.thresholdColor
          }
        ]
      ])

      if (store.s_form.threshold === '样本' && sample.value) {
        additionalCurve.value.set('1', {
          data: sample.value.threshold,
          color: [0.98, 0.5019, 0.0392]
        })
      }

      sampleData.value = {
        peak: scene1.value!.pool!.statisticalBuffer.max!,
        autoThreshold: autoThreshold.value.autoThreshold,
        signals: autoThreshold.value.signals,
        params: store.s_form
      }
    } else {
      additionalCurve.value = new Map([
        [
          '0',
          {
            data: new Float32Array(data.autoThreshold),
            color: CustomTheme.theme.thresholdColor
          }
        ]
      ])
    }
  }
  optionsChild.set('OCCUPYINFO', {
    control: watchOccupy
  })

  // 溢出
  optionsChild.set(ReceiveData.key.DATA.OVERFLOW, {
    control: (data: { data: boolean }) => {
      if (data.data) {
        ElMessage({ message: '溢出', type: 'warning', grouping: true })
      }
    }
  })
  
  options.set('DATA', { children: optionsChild })

  ReceiveData.add(options)

  const currentTabId = ref(0)

  watch(() => store.s_playButton, (btn) => {
    if (btn === ESwitchState.open) {
      additionalCurve.value = new Map()
      icons.value = []
      autoThreshold.value = {
        hopSpeed: 0,
        signals: [],
        autoThreshold: new Float32Array()
      }

      sampleData.value = {
        signals: [],
        autoThreshold: new Float32Array(),
        peak: new Float32Array(),
        params: {
          begin: 0,
          end: 0,
          step: 0,
          attenuation: '',
          rfworkmode: ''
        }
      }
    }
  })

  const spectrumInstance0 = ref<InstanceType<typeof ZXISpectrumScanAndFall>>()
  const spectrumInstance1 = ref<InstanceType<typeof ZXISpectrumScanAndFall>>()

  const serverStore = useServerStore()

  // 导出
  ToExport.beforExport.set('1', () => {
    // 参数
    const result = Sundry.formatParams(route.meta.functionKey!)
    ToExport.addTable(result.title, result.headers, result.formatData, 0)

    const dom0 = spectrumInstance0.value!.root!
    ToExport.addDom('全景频谱', dom0, 1)

    if (occupyShow.value && occupancySpectrum.value.length > 0) {
      const dom1 = spectrumInstance1.value!.root!
      ToExport.addDom('占用度图像', dom1, 2)
    } else {
      // 移除
      // ToExport.delData(2)
      ToExport.deleteData(2)
    }
    // 识别结果
    if (autoThreshold.value.signals.length > 0) {
      const result = Sundry.formatSignal(autoThreshold.value.signals)
      ToExport.addTable(`${result.title}`, result.headers, result.formatData, 3)
    } else {
      // ToExport.delData(3)
      ToExport.deleteData(3)
    }
    
    ToExport.addText('GPS信息', serverStore.s_serverStateInfo.gpsLocation.locationResult , 4)
  })

  // 主题注册
  const themeKey = CustomTheme.on(() => {
    // 门限
    const line0 = additionalCurve.value.get('0')
    if (line0) {
      line0.color = CustomTheme.theme.thresholdColor
    }

    additionalCurve.value = new Map(additionalCurve.value)
  })

  onBeforeUnmount(() => {
    CustomTheme.off(themeKey)
  })

  return {
    store,
    route,
    defaultValueY,
    additionalCurve,
    icons,
    params,
    form,
    scaleY,
    hopSpeed,
    occupyShow,
    spectrumScan,
    occupancySpectrum,
    autoThreshold,
    sampleData,
    getSpectrumScene1,
    getSpectrumScene2,
    selectFrequency,
    trigger,
    markers,
    beforeTaskStart,
    scene1,
    getSample,
    currentTabId,
    spectrumInstance0,
    spectrumInstance1
  }
}