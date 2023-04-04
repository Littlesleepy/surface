<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-22 14:38:54
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-01-05 11:00:44
 * @FilePath: \zxi-device\src\views\PScan\components\Sample.vue
 * @Description: 样本管理器
 -->

<script setup lang="ts">
import { Axios } from '@/server'
import { useFrameStore } from '@/store'
import { ElMessage } from 'element-plus'
import { computed, PropType, ref, watch } from 'vue'
import { ILineData, EAxisXType, ITargetIcon, ESwitchState } from 'mcharts/index'
import { ISample, ISampleData } from '..'
import { Sundry, UI } from '@/helper'
import { useRoute } from 'vue-router'

enum EviewFrom {
  sample,
  threshold
}

const props = defineProps({
  inputData: {
    type: Object as PropType<ISampleData>,
    default: () => {
      return {
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
  },
  viewCurrent: { default: false }
})

const emit = defineEmits<{
  (e: 'result', result: ISample | undefined): void
}>()

const store = useFrameStore()

const currentSample = ref<ISample>()

const samples = ref<Array<ISample>>([])

const remark = ref('')

const spectrumData = ref<Map<string, ILineData>>(new Map())

const spectrumParams = ref({ begin: 0, end: 0 })

const tags = ref<Array<ITargetIcon>>([])

const spectrumLinesRefresh = ref(false)

let viewFrom = EviewFrom.sample

/** 
 * @description: 保存样本
 * @return {*}
 */    
function saveSample () {
  if (props.inputData.autoThreshold.length > 0) {
    const params = props.inputData.params
    const data = {
      begin: params.begin,
      end: params.end,
      step: params.step,
      att: params.attenuation,
      workMode: params.rfworkmode,
      remark: remark.value,
      threshold: Array.from(props.inputData.autoThreshold),
      characteristicSpectrum: Array.from(props.inputData.peak),
      sampleSignals: props.inputData.signals
    }

    Axios({
      url: 'api/Monitor/scanSample/save',
      method: 'post',
      params: {
        taskId: store.s_taskId
      },
      data
    }).then(() => {
      remark.value = ''
      ElMessage.success('样本保存成功')
      openSample()
    }).catch(err => {
      ElMessage.error(err.data)
    })
  } else {
    ElMessage.warning('请先识别信号')
  }
}

function openSample () {
  const marker = Sundry.createMarker({
    text: '请稍后。。。'
  })
  Axios({
    url: 'api/Monitor/scanSample/query'
  }).then((msg) => {
    msg.data.forEach(s => {
      s.startTime = new Date(s.startTime).toLocaleString()
      s.endTime = new Date(s.endTime).toLocaleString()
    })

    samples.value = msg.data
  }).catch(err => {
    ElMessage.error(err.data)
  }).finally(marker.close)
}
openSample()

function deleteSample (sample: ISample) {
  Axios({
    url: 'api/Monitor/scanSample/delete/' + sample.id,
    method: 'delete'
  }).then(() => {
    openSample()

    if (currentSample.value && currentSample.value.id === sample.id) {
      currentSample.value = undefined

      // 如果当前绘制图像数据来自样本，则清除
      if (viewFrom === EviewFrom.sample) {
        spectrumLinesRefresh.value = !spectrumLinesRefresh.value
        tags.value = []
      }
      emit('result', undefined)
    }
    ElMessage.success('删除成功')
  }).catch(err => {
    ElMessage.error(err.data)
  })
}

function useSample (sample: ISample) {
  Axios({
    url: 'api/Monitor/scanSample/query/' + sample.id
  }).then((msg) => {
    currentSample.value = sample

    const s: ISample = msg.data
    view(
      s.sampleSignals,
      new Float32Array(s.characteristicSpectrum),
      new Float32Array(s.threshold),
      s
    )
    viewFrom = EviewFrom.sample
    emit('result', s)
  }).catch(err => {
    ElMessage.error(err.data)
  })
}

function view (
  signals: Array<{ bindingCenterIndex: number, bindingFrequency: number, bindingBandWidth: number }>,
  peak: Float32Array,
  autoThreshold: Float32Array,
  params: { begin: number, end: number }) {
  spectrumParams.value.end = Number(params.end)
  spectrumParams.value.begin = Number(params.begin)

  const _tags: Array<ITargetIcon> = []
  signals.forEach(item => {
    _tags.push({
      dataIndex: item.bindingCenterIndex,
      message: `${item.bindingFrequency}MHz @${item.bindingBandWidth}kHz`
    })
  })
  tags.value = _tags

  const data: Map<string, ILineData> = new Map()
  data.set('峰值', {
    color: 'red',
    data: peak
  })

  data.set('样本', {
    color: 'rgb(0, 240, 0)',
    data: autoThreshold
  })

  spectrumData.value = data
}

function seeCurrentSample () {
  if (props.viewCurrent) {
    if (props.inputData.autoThreshold.length > 0) {
      view(
        props.inputData.signals,
        props.inputData.peak,
        props.inputData.autoThreshold,
        props.inputData.params
      )
      viewFrom = EviewFrom.threshold
    } else {
      spectrumLinesRefresh.value = !spectrumLinesRefresh.value
      tags.value = []
    }
  }
}

watch([() => props.viewCurrent, () => props.inputData], seeCurrentSample)
</script>

<template>
  <div class="container">
    <!-- 第一行 -->
    <div class="first-row">
      <!-- 第一列 -->
      <div class="box first-column">
        <p style="font-weight: 700;padding-bottom: 10px;">样本储存</p>
        <el-input type="textarea" :rows="5" v-model="remark" placeholder="备注" />
        <el-button
          style="margin-top: 10px;"
          type="primary"
          @click="saveSample"
          :disabled="inputData.autoThreshold.length === 0">保存当前样本</el-button>
        <el-button
          style="margin-top: 5px;margin-left: 0px;"
          type="info"
          @click="seeCurrentSample"
          :disabled="inputData.autoThreshold.length === 0">查看当前样本</el-button>
      </div>
      <!-- 第二列 -->
      <div class="box second-column">
        <p style="font-weight: 700;padding-bottom: 10px;">样本列表</p>
        <ZXIScroll class="zxi-scroll">
          <el-table
            :data="samples"
            style="width: 100%;height: 100%;">
            <el-table-column type="expand">
              <template #default="props">
                <div class="expand">
                  <span>开始时间：{{ props.row.startTime}}</span>
                  <span>结束时间：{{ props.row.endTime}}</span>
                  <span>衰减：{{ props.row.att}}</span>
                  <span>射频工作模式：{{ props.row.workMode}}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="begin" label="开始频率(MHz)" min-width="120" />
            <el-table-column prop="end" label="结束频率(MHz)" min-width="120" />
            <el-table-column prop="step" label="分辨率(KHz)" min-width="110" />
            <el-table-column prop="remark" label="备注" min-width="150" :show-overflow-tooltip="true" />
            <el-table-column label="操作" min-width="130">
              <template #default="scope">
                <div style="display: flex;">
                  <el-button
                    :disabled="store.s_playButton === ESwitchState.open"
                    :type="currentSample && scope.row.id === currentSample.id ? 'success' : 'info'"
                    @click="useSample(scope.row)">使用</el-button>
                  <el-button
                    type="danger"
                    :disabled="store.s_playButton === ESwitchState.open"
                    @click="deleteSample(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </ZXIScroll>
      </div>
    </div>
    <!-- 第二行 -->
    <ZXISpectrumLines
      class="spectrumLines"
      :params="spectrumParams"
      :switchLever="ESwitchState.open"
      :inputData="spectrumData"
      :defaultValueY="{ max: 75, min: 0 }"
      :xScaleType="EAxisXType.range"
      :refresh="spectrumLinesRefresh"
      :tags="tags" />
  </div>
</template>

<style scoped lang="less">
@import url('theme');
@borderColor: #b9b9b9;
.container{
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  .first-row{
    display: flex;
    flex: auto;
    .box{
      border: 1px solid @borderColor;
      padding: 10px;
      font-size: @font20;
    }
    .first-column{
      min-width: 15rem;
      max-width: 25rem;
      width: 30%;
      margin-right: 10px;
      display: flex;
      flex-direction: column;
    }
    .second-column{
      flex: auto;
      display: flex;
      flex-direction: column;
      .zxi-scroll{
        flex: auto;
      }
    }
  }
  .spectrumLines{
    margin-top: 10px;
    width: 100%;
    height: 30rem;
  }
}
.expand{
  display: flex;
  padding: 10px;
  >span{
    padding-right: 20px;
  }
}

</style>