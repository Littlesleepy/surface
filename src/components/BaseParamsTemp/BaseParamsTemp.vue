<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-21 11:22:30
 * @FilePath: \zxi-device\src\components\BaseParamsTemp\BaseParamsTemp.vue
 * @Description: 
 -->
<script lang="ts">
export default defineComponent({
  name: 'BaseParamsTemp'
})
</script >

<script setup lang="ts">
import { PropType, StyleValue, defineComponent, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as Helper from 'helper/index'
import { ESwitchState } from 'mcharts/index'
import { EParamsType } from '@/types'

const props = defineProps({
  params: { type: Object, default: () => {} },
  elements: { type: Array as PropType<Array<any>>, default: () => [] },
  rules: { type: Object, default: () => { return {} } },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off
  },
  tooltip: { type: Boolean, default: false },
  itemStyle: {
    type: Object as PropType<StyleValue>,
    default: () => { return { width: '45%' } }
  },
  cache: { type: Boolean, default: true },
  routeName: {
    type: String
  },
  labelWidth: {
    default: '130px'
  }
})

const emit = defineEmits<{
  (e: 'paramsChange'): void
}>()

let oldDMRdebw = '25' // DMR自动解调带宽

let olddPMRdebw = '25' // DMR自动解调带宽

function getParams (value: string, key: string) {
  // 解调参数影响随路音频
  if (key === 'demodulation' && value === '不解调') {
    if ('tcpaudio' in props.params && props.params.tcpaudio === true) {
      props.params.tcpaudio = false
      ElMessage.success('已关闭随路音频')
    }
  }
  if (key === 'demodulation' && value !== '不解调') {
    if ('tcpaudio' in props.params && props.params.tcpaudio === false) {
      props.params.tcpaudio = true
      ElMessage.success('已打开随路音频')
    }
  }
  // 解调模式TETRA、自动数字语音仅支持带宽25kHz
  if (key === 'demodulation' && (value === 'TETRA' || value === '自动数字语音')) {
    if ('bandwidth' in props.params && props.params.bandwidth !== '25') {
      props.params.bandwidth = '25'
      ElMessage.error(`解调模式${value}仅支持带宽25kHz`)
    }
  }
  if (key === 'bandwidth' && value !== '25' && 'demodulation' in props.params && (props.params.demodulation === 'TETRA' || props.params.demodulation === '自动数字语音')) {
    props.params.bandwidth = '25'
    ElMessage.error(`解调模式${props.params.demodulation}仅支持带宽25kHz`)
  }
  // 解调模式DMR仅支持带宽25和12.5kHz
  if (key === 'demodulation' && value === 'DMR') {
    if ('bandwidth' in props.params && props.params.bandwidth !== '25' && props.params.bandwidth !== '12.5') {
      props.params.bandwidth = '25'
      ElMessage.error('解调模式DMR仅支持带宽12.5/25kHz')
    }
  }
  if (key === 'bandwidth' && (value !== '25' && value !== '12.5') && 'demodulation' in props.params && props.params.demodulation === 'DMR') {
    props.params.bandwidth = oldDMRdebw
    ElMessage.error('解调模式DMR仅支持带宽12.5/25kHz')
  }
  // 解调模式dPMR仅支持带宽25和12.5和6kHz
  if (key === 'demodulation' && value === 'dPMR') {
    if ('bandwidth' in props.params && props.params.bandwidth !== '25' && props.params.bandwidth !== '12.5' && props.params.bandwidth !== '6') {
      props.params.bandwidth = '25'
      ElMessage.error('解调模式dPMR仅支持带宽6/12.5/25kHz')
    }
  }
  if (key === 'bandwidth' && (value !== '25' && value !== '12.5' && value !== '6') && 'demodulation' in props.params && props.params.demodulation === 'dPMR') {
    props.params.bandwidth = olddPMRdebw
    ElMessage.error('解调模式dPMR仅支持带宽6/12.5/25kHz')
  }
  // 向上层组件提示需要抛出ruleForm
  emit('paramsChange')
  // 缓存参数，注意是否需要保存参数
  if (props.cache && props.routeName) Helper.Device.functionParamsLocaCache(props.routeName, props.params)
}

function watchRuleForm () {
  // 自动参数
  if ('bandwidth' in props.params && (props.params.bandwidth === '25' || props.params.bandwidth === '12.5')) {
    oldDMRdebw = props.params.bandwidth
  }
  if ('bandwidth' in props.params && (props.params.bandwidth === '25' || props.params.bandwidth === '12.5' || props.params.bandwidth === '6')) {
    olddPMRdebw = props.params.bandwidth
  }
}

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    props.elements.forEach(sx => { sx.disabled = true })
  } else {
    props.elements.forEach(sx => { sx.disabled = false })
  }
})

watch(() => props.params, watchRuleForm, { deep: true })

</script>

<template>
  <div>
    <div class="temporary-params-container">
      <ZXIScroll class="base-scroll">
        <el-form
        :model="params"
        :rules="rules"
        ref="ruleForm1"
        :label-width="labelWidth"
        class="demo-ruleForm"
        label-position="left"
        :hide-required-asterisk="true">
          <el-tooltip class="item" v-for="item in elements" :key="item.id" effect="dark" :content="item.title" placement="right" :disabled="tooltip">
            <el-form-item :style="itemStyle" :prop="item.paramName" :label="item.title">
              <el-input
                v-if="item.type === EParamsType.range"
                @change="getParams(params[item.paramName], item.paramName)"
                v-model="params[item.paramName]"
                type="number"
                title=""
                :placeholder="item.placeholder"
                :disabled="item.disabled" />
              <el-select
                v-if="item.type === EParamsType.enum"
                @change="getParams(params[item.paramName], item.paramName)"
                v-model="params[item.paramName]"
                :disabled="item.disabled">
                <el-option
                  v-for="select in item.valueList"
                  :key="select.id"
                  :label="select.label"
                  :value="select.value" />
              </el-select>
              <el-switch
                v-if="item.type === EParamsType.boolean"
                @change="getParams(params[item.paramName], item.paramName)"
                v-model="params[item.paramName]"
                :disabled="item.disabled" />
            </el-form-item>
          </el-tooltip>
        </el-form>
      </ZXIScroll>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.temporary-params-container{
  width: 100%;
  height: 100%;
  .base-scroll{
    width: 100%;
    height: 100%;
    :deep(.el-form){
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      .el-form-item{
        .el-form-item__label{
          width: 100%;
        }
      }
    }
    :deep(.el-select){
      display: block!important;
    }
  }
}
</style>