/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-21 13:29:53
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\index.ts
 * @Description: 
 */
import './assets/styles/icon/iconfont.css'

import { App, Plugin } from 'vue'
import ZXIScroll from './ZXIScroll'
import ZXIAxisX from './ZXIAxisX'
import ZXIAxisY from './ZXIAxisY'
import ZXIControlBtn from './ZXIControlBtn'
import ZXIIcons from './ZXIIcons'
import ZXIFrequencyDivision from './ZXIFrequencyDivision'
import ZXISpectrumAndFall from './ZXISpectrumAndFall'
import ZXIAxisTimeY from './ZXIAxisTimeY'
import ZXISpectrumLine from './ZXISpectrumLine'
import ZXISpectrumLines from './ZXISpectrumLines'
import ZXISampleLines from './ZXISampleLines'
import ZXISpectrumScanAndFall from './ZXISpectrumScanAndFall'
import ZXILevel from './ZXILevel'
import ZXIAxisTimeX from './ZXIAxisTimeX'
import ZXIDpx from './ZXIDpx'
import ZXIPointAndLines from './ZXIPointAndLines'
import ZXIIQVector from './ZXIIQVector'
import ZXIIQWave from './ZXIIQWave'
import ZXIEye from './ZXIEye'
import ZXICompass from './ZXICompass'
import ZXITabs from './ZXITabs'
import ZXILightLines from './ZXILightLines'
import ZXIItu from './ZXIItu'
import ZXIModulate from './ZXIModulate'
import ZXIScrollInfo from './ZXIScrollInfo'
import ZXISubaudioDecoding from './ZXISubaudioDecoding'
import ZXIHighlight from './ZXIHighlight'
import ZXITv from './ZXITv'
import ZXINoSampleLines from './ZXINoSampleLines'
import ZXIStatisticalY from './ZXIStatisticalY'
import ZXICompassControl from './ZXICompassControl'
import ZXIRaindrop from './ZXIRaindrop'
import ZXILevelPillar from './ZXILevelPillar'
import ZXIShortMessage from './ZXIShortMessage'
import ZXITimeDomainLines from './ZXITimeDomainLines'
import ZXIToolTipInfo from './ZXIToolTipInfo'
import ZXICountLines from './ZXICountLines'
import ZXIMenu from './ZXIMenu'
import ZXIInput from './ZXIInput'
import ZXISelect from './ZXISelect'
import ZXISwitch from './ZXISwitch'

export type ZXIScrollType = InstanceType<typeof ZXIScroll>
export type ZXIAxisXType = InstanceType<typeof ZXIAxisX>
export type ZXIAxisYType = InstanceType<typeof ZXIAxisY>
export type ZXIControlBtnType = InstanceType<typeof ZXIControlBtn>
export type ZXIIconsype = InstanceType<typeof ZXIIcons>
export type ZXIFrequencyDivisionType = InstanceType<typeof ZXIFrequencyDivision>
export type ZXISpectrumAndFallType = InstanceType<typeof ZXISpectrumAndFall>
export type ZXIAxisTimeYType = InstanceType<typeof ZXIAxisTimeY>
export type ZXISpectrumLineType = InstanceType<typeof ZXISpectrumLine>
export type ZXISpectrumLinesType = InstanceType<typeof ZXISpectrumLines>
export type ZXISampleLinesType = InstanceType<typeof ZXISampleLines>
export type ZXISpectrumScanAndFallType = InstanceType<typeof ZXISpectrumScanAndFall>
export type ZXILevelType = InstanceType<typeof ZXILevel>
export type ZXIAxisTimeXType = InstanceType<typeof ZXIAxisTimeX>
export type ZXIDpxType = InstanceType<typeof ZXIDpx>
export type ZXIPointAndLinesType = InstanceType<typeof ZXIPointAndLines>
export type ZXIIQVectorType = InstanceType<typeof ZXIIQVector>
export type ZXIIQWaveType = InstanceType<typeof ZXIIQWave>
export type ZXIEyeType = InstanceType<typeof ZXIEye>
export type ZXICompassType = InstanceType<typeof ZXICompass>
export type ZXITabsType = InstanceType<typeof ZXITabs>
export type ZXILightLinesType = InstanceType<typeof ZXILightLines>
export type ZXIItuType = InstanceType<typeof ZXIItu>
export type ZXIModulateType = InstanceType<typeof ZXIModulate>
export type ZXIScrollInfoType = InstanceType<typeof ZXIScrollInfo>
export type ZXISubaudioDecodingType = InstanceType<typeof ZXISubaudioDecoding>
export type ZXIHighlightType = InstanceType<typeof ZXIHighlight>
export type ZXITvType = InstanceType<typeof ZXITv>
export type ZXINoSampleLinesType = InstanceType<typeof ZXINoSampleLines>
export type ZXIStatisticalYType = InstanceType<typeof ZXIStatisticalY>
export type ZXICompassControlType = InstanceType<typeof ZXICompassControl>
export type ZXIRaindropType = InstanceType<typeof ZXIRaindrop>
export type ZXILevelPillarType = InstanceType<typeof ZXILevelPillar>
export type ZXIShortMessageType = InstanceType<typeof ZXIShortMessage>
export type ZXITimeDomainLinesType = InstanceType<typeof ZXITimeDomainLines>
export type ZXIToolTipInfoType = InstanceType<typeof ZXIToolTipInfo>
export type ZXICountLinesType = InstanceType<typeof ZXICountLines>
export type ZXIMenuType = InstanceType<typeof ZXIMenu>
export type ZXIInputType = InstanceType<typeof ZXIInput>
export type ZXISelectType = InstanceType<typeof ZXISelect>
export type ZXISwitchType = InstanceType<typeof ZXISwitch>

export * from './styles'
export * from './types'
export * from './core'
export * from './helper'
export * from './zaudio/zaudio'

export {
  ZXIScroll,
  ZXIAxisX,
  ZXIAxisY,
  ZXIControlBtn,
  ZXIIcons,
  ZXIFrequencyDivision,
  ZXISpectrumAndFall,
  ZXIAxisTimeY,
  ZXISpectrumLine,
  ZXISpectrumLines,
  ZXISampleLines,
  ZXISpectrumScanAndFall,
  ZXILevel,
  ZXIAxisTimeX,
  ZXIDpx,
  ZXIPointAndLines,
  ZXIIQVector,
  ZXIIQWave,
  ZXIEye,
  ZXICompass,
  ZXITabs,
  ZXILightLines,
  ZXIItu,
  ZXIModulate,
  ZXIScrollInfo,
  ZXISubaudioDecoding,
  ZXIHighlight,
  ZXITv,
  ZXINoSampleLines,
  ZXIStatisticalY,
  ZXICompassControl,
  ZXIRaindrop,
  ZXILevelPillar,
  ZXIShortMessage,
  ZXITimeDomainLines,
  ZXIToolTipInfo,
  ZXICountLines,
  ZXIMenu,
  ZXIInput,
  ZXISelect,
  ZXISwitch
}

const components = [
  ZXIScroll,
  ZXIAxisX,
  ZXIAxisY,
  ZXIControlBtn,
  ZXIIcons,
  ZXIFrequencyDivision,
  ZXISpectrumAndFall,
  ZXIAxisTimeY,
  ZXISpectrumLine,
  ZXISpectrumLines,
  ZXISampleLines,
  ZXISpectrumScanAndFall,
  ZXILevel,
  ZXIAxisTimeX,
  ZXIDpx,
  ZXIPointAndLines,
  ZXIIQVector,
  ZXIIQWave,
  ZXIEye,
  ZXICompass,
  ZXITabs,
  ZXILightLines,
  ZXIItu,
  ZXIModulate,
  ZXIScrollInfo,
  ZXISubaudioDecoding,
  ZXIHighlight,
  ZXITv,
  ZXINoSampleLines,
  ZXIStatisticalY,
  ZXICompassControl,
  ZXIRaindrop,
  ZXILevelPillar,
  ZXIShortMessage,
  ZXITimeDomainLines,
  ZXIToolTipInfo,
  ZXICountLines,
  ZXIMenu,
  ZXIInput,
  ZXISelect,
  ZXISwitch
]

const zcharts: Plugin = {
  install: (app: App) => {
    // 注册
    components.forEach(component => {
      if (app.component(component.name) === undefined) {
        app.component(component.name, component)
      }
    })
  }
}

export default zcharts
