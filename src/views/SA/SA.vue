<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-21 11:53:32
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-21 17:02:55
 * @FilePath: \zxi-surface\src\views\SA\SA.vue
 * @Description: 
 -->
 <script setup lang="ts">
 import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
 import { useFrameStore } from 'store/index'
 import { ISpectrumInputData, IPointAndLineData, IIQData, IEyeData, ESwitchState, ZXISpectrumAndFall, ZXIPointAndLines, ZXIIQVector, ZXIEye, UseTheme } from 'mcharts/index'
 import { ReceiveDataOptions, makeSpectrumData, ReceiveData } from '@/server'
 import { ElMessage } from 'element-plus'
 import BaseLink from '@/components/BaseLink/BaseLink.vue'
 import BaseTabHeader from 'cp/BaseTabHeader/BaseTabHeader.vue'
 import { setLinkTrigger, CustomTheme, BaseParamsType } from '@/types'
 import { Sundry } from 'helper/index'
 import { ToExport } from "helper/dataExports/index";
 import { useRoute } from 'vue-router'
 
 const store = useFrameStore()
 
 const symaftData = ref<Map<string, IPointAndLineData>>(new Map())
 
 const symbefData = ref<Map<string, IPointAndLineData>>(new Map())
 
 const symaftStr = ref('')
 
 const spectrum = ref<Array<ISpectrumInputData>>([])
 
 const params = computed(() => {
   const form = store.s_form
   return {
     begin: Number(form.frequency) - form.bandwidth / 2000,
     end: Number(form.frequency) + form.bandwidth / 2000,
     bandwidth: Number(form.bandwidth) / 1000
   }
 })
 
 const iqData = ref<IIQData>({
   iData: new Float32Array(),
   qData: new Float32Array()
 })
 
 const eyeData = ref<IEyeData>({
   sampleRate: 0,
   baudRate: 0,
   eyePhaseData: new Float32Array(),
   eyeAmplitudeData: new Float32Array()
 })
 
 const markers = ref<Array<number>>([])
   
 const { trigger, selectFrequency } = setLinkTrigger()
 
 function changeFrequency () {
   store.m_formOne({ key: 'frequency', value: trigger.value.value })
 }
 
 // 数据接收
 const options: ReceiveDataOptions = new Map()
 const optionsChild: ReceiveDataOptions = new Map()
 // 频谱数据
 optionsChild.set('SPECTRUMDATA', {
   control: (data) => { spectrum.value = [makeSpectrumData(data)] }
 })
 function getSymaftStr (data: Float32Array, column = 32) {
   let string = ''
   // 32个数据一行，计算多少行
   const hasRow = Math.ceil(data.length / column)
   // 最后一行个数
   const lastRowNum = data.length % column
   for (let i = 0; i < hasRow; i++) {
     let maxJ = i === hasRow - 1 ? lastRowNum : column
     for (let j = 0; j < maxJ; j++) {
       const s = data[i * column + j]
       if (s === undefined) break
       string += '0' + s + ' '
       if ((j + 1) % 4 === 0 && j !== column - 1) string += '  '
     }
     string += '\n'
   }
 
   return string
 }
 // 最终码流数据
 function watchSymaftData (data) {
   const result = new Float32Array(data.symbolData)
   // 最终码流图
   symaftData.value.set('0', {
     colorLine: UseTheme.theme.IQVector.lineColor,
     colorPoint: UseTheme.theme.IQVector.pointColor,
     data: result
   })
   // 码元列表
   symaftStr.value = getSymaftStr(result)
 }
 optionsChild.set('AFTERDECODESYMBOL', { control: watchSymaftData })
 // 判决前码流数据
 function watchSymabefData (data) {
   symbefData.value.set('1', {
     colorLine:  UseTheme.theme.IQVector.lineColor,
     colorPoint: UseTheme.theme.IQVector.pointColor,
     data: new Float32Array(data.symbolData)
   })
 }
 optionsChild.set('BEFOREDECODESYMBOL', { control: watchSymabefData })
 // IQ
 optionsChild.set('IQDATA', {
   control: (data) => {
     iqData.value = { iData: new Float32Array(data.iData), qData: new Float32Array(data.qData) }
   }
 })
 // 眼图
 optionsChild.set('EYEPHASEDATA', {
   control: (data) => {
     eyeData.value = {
       sampleRate: data.sampleRate,
       baudRate: data.baudRate,
       eyePhaseData: new Float32Array(data.eyePhaseData),
       eyeAmplitudeData: new Float32Array(data.eyeAmplitudeData)
     }
   }
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
 
 watch(() => store.s_playButton, (btn) => {
   if (btn === ESwitchState.open) {
     symaftData.value.clear()
     symbefData.value.clear()
     symaftStr.value = ''
     spectrum.value = []
     iqData.value.iData = new Float32Array()
     iqData.value.qData = new Float32Array()
   }
 })
 
 // 导出结果
 const route = useRoute()
 const spInstnce = ref<InstanceType<typeof ZXISpectrumAndFall>>()
 const plInstance0 = ref<InstanceType<typeof ZXIPointAndLines>>()
 const plInstance1 = ref<InstanceType<typeof ZXIPointAndLines>>()
 const spIQVector = ref<InstanceType<typeof ZXIIQVector>>()
 const spEye = ref<InstanceType<typeof ZXIEye>>()
 
 ToExport.beforExport.set('0', () => {
  //  ToExport.DATA.clear()
  //  ToExport.DOM.clear()
  ToExport.reset()
 
   // 参数
   const r = Sundry.formatParams(route.meta.functionKey!)
   ToExport.addTable(r.title, r.headers, r.formatData, 0)
   // 频谱
   if (spectrum.value.length > 0) ToExport.addDom('频谱', spInstnce.value!.root!, 1)
   // 星座图
   if (iqData.value.iData.length > 0) ToExport.addDom('星座图', spIQVector.value!.root!, 2)
   // 眼图
   if (eyeData.value.eyePhaseData.length > 0) ToExport.addDom('眼图', spEye.value!.root!, 3)
   // 码元列表
   if (symaftStr.value) {
     const str = getSymaftStr(symaftData.value.get('0')!.data, 44)
     ToExport.addText('码元列表', str, 4)
   }
   // 最终码流图
   if (symaftData.value.size > 0) ToExport.addDom('最终码流图', plInstance0.value!.root!, 5)
   // 最终码流图
   if (symaftData.value.size > 0) ToExport.addDom('判决前码流图', plInstance1.value!.root!, 6)
 })
 
 // 主题注册
 const symaftStrColor = ref(`var(${CustomTheme.prefix}SAsymaftStr, ${CustomTheme.theme.logColor})`)
 const dataArr = [symaftData, symbefData]
 const themeKey = CustomTheme.on(() => {
   const op = UseTheme.theme.IQVector
   dataArr.forEach(item => {
     for (const [, line] of item.value) {
       line.colorLine = op.lineColor
       line.colorPoint = op.pointColor
       item.value = new Map(item.value)
     }
   })
 
   symaftStrColor.value = `var(${CustomTheme.prefix}SAsymaftStr, ${CustomTheme.theme.logColor})`
 })

 const master = ref<BaseParamsType>()

 onMounted(()=>{
  console.log(master.value?.elements);
  
 })
 
 onBeforeUnmount(() => {
   CustomTheme.off(themeKey)
 })
 const tabId = ref(0)
 </script>
 
 <template>
   <BaseMonitorFrame>
     <BaseLink :trigger="trigger">
       <div class="base-link">
         <el-button type="primary" round @click="changeFrequency" :disabled="store.s_playButton === ESwitchState.open">切换频率</el-button>
         <el-button type="primary" round @click="() => { markers = [trigger.value as number] }">标注</el-button>
       </div>
       <hr style="margin-top: .5rem"/>
     </BaseLink>
     <template #set>
      <BaseParams ref="master" :dynamicParam="false" />
    </template>
     <div class="SA">
      <div class="center-left">
        <ZXISpectrumAndFall
      class="spectrum-and-fall"
      ref="spInstnce"
      name=""
      :params="params"
      :inputData="spectrum"
      :setTool="[{ name: 'pubutu', value: false }]"
      :switchLever="store.s_playButton"
      :markers="markers"
      @selectFrequency="selectFrequency" >
      <template #header>
          <BaseParamsBranch
            class="params-branch0"
            :params="[
              [
                { name: '频率', paramName: 'frequency', ratio: 11 },
                { name: '带宽', paramName: 'bandwidth', ratio: 11 },
                { name: '解调模式', paramName: 'digitaldemod', ratio: 11 },
              ]
            ]"
            :master="master" />
        </template>
    </ZXISpectrumAndFall>
    <div class="base-tabs">
        <BaseTabHeader class="tab-nav" :headers="[
            [{ name: '最终流码图', ratio: 1 }],
            [{ name: '码元列表', ratio: 1 }],
            [{ name: '判决前码流图', ratio: 1 }],
          ]" v-model="tabId" />
        <ZXITabs
          class="tab-panes"
          :style="{flex:'auto'}"
          :wrapperStyle="{ border: 'none' }"
          :hidHeader="true"
          v-model="tabId">
          <ZXIPointAndLines
            class="lable-content"
            ref="plInstance0"
            :inputData="symaftData"
            :switchLever="store.s_playButton" />
          <ZXIScroll class="lable-content" :wrapperStyle="{ backgroundColor: UseTheme.theme.var.backgroundColor }">
            <pre class="symaftStr">{{symaftStr}}</pre>
          </ZXIScroll>
          <ZXIPointAndLines
            class="lable-content"
            ref="plInstance1"
            :inputData="symbefData"
            :switchLever="store.s_playButton"/>
        </ZXITabs>
      </div>
      </div>
      <div class="center-right">
        <div class="parm">
          <BaseParamsBranch
            class="params-branch0"
            :params="[
              [
                { name: '码元速率', paramName: 'baudrate', ratio: 11 },
              ]
            ]"
            :master="master" />
        </div>
        <ZXIIQVector
          class="iq-vector-image"
          ref="spIQVector"
          :inputData="iqData"
          :name="'星座图'"
          :switchLever="store.s_playButton" />
          <ZXIEye
          :inputData="eyeData"
          ref="spEye"
          class="eye-image"
          :switchLever="store.s_playButton" />
      </div>
    
     </div>
  
   </BaseMonitorFrame>
 </template>
 
 <style scoped lang="less">
 @import url('theme');
 .base-link{
   display: flex;
   justify-content: center;
 }
 .SA{
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: @btnSpace;
  display: flex;
  // flex-direction: column;
  .center-left{
    flex: auto;
    // width: 70%;
    display: flex;
    flex-direction: column;
  }
  .center-right{
    margin-left: 5px;
    display: flex;
    flex-direction: column;
    height: 100%;
    aspect-ratio: 1/2;
    .parm{
      height: 40px;
      margin-bottom: 5px;
    }

    .iq-vector-image,.eye-image{
      // height: 50%;
      flex: auto;
      aspect-ratio: 1/1;
      // aspect-ratio: 1/2;
      :deep(.iq-vector-image-container){
        flex-direction: column-reverse;
      }
    }
  }

  .spectrum-and-fall{
    height: 50%;
    
  }
  .base-tabs{
    flex: auto;
    display: flex;
    .tab-nav{
      max-width: 150px;
    }
    .tab-panes{
      .lable-content{
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        .symaftStr{
          box-sizing: border-box;
          padding: 5px;
          font-size: 1.475rem;
          color: v-bind('UseTheme.theme.var.color');
        }
      }
    }
  }
 }

 
 </style>