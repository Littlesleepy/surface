<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-16 10:58:58
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 14:41:09
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseParamsBranch\BaseParamsBranch.vue
 * @Description: 
 -->

<script setup lang="ts">
import { h, onMounted, PropType, VNode, watch, render, ref, computed, isRef, toRef } from 'vue'
import { BaseParamsType } from '../BaseParams/type'
import { IMockPanleState, EParamsType, IWorkMode } from '..'
import { IParamBranch } from './type'
import { Keyboard } from 'mcharts/ZXIkeyboard'

const props = defineProps({
  master: {
    type: Object as PropType<BaseParamsType>
  },
  params: {
    type: Array as PropType<Array<Array<IParamBranch>>>,
    default: () => []
  }
})

const paramsTrance = computed(() => {
  const result = new Map<string, Omit<IParamBranch,'ratio'> & { style: string }>()
  // 总行数
  const rowLen = props.params.length
  props.params.forEach((row, indexRow) => {
    let totalRatio = 0
    row.forEach(item => totalRatio += item.ratio)
    // 不是最后一行，加margin-bottom: 5px;
    const marginBottom = indexRow < rowLen - 1 ? 'margin-bottom: 5px;' : ''

    // 每一行有总列数
    const columnLen = row.length
    row.forEach((item, indexColumn) => {
      if (indexColumn < columnLen - 1) {

      } else {

      }
      // 计算宽度
      const width = item.ratio / totalRatio * 100
      const widthStyle = indexColumn < columnLen - 1 ? `width: calc(${width}% - 5px);` : `width: ${width}%;`
      // 不是最后一列，加margin-right: 5px;
      const marginRight = indexColumn < columnLen - 1 ? 'margin-right: 5px;' : ''

      result.set(item.paramName, {
        name: item.name,
        paramName: item.paramName,
        style: marginBottom +  widthStyle + marginRight
      })
    })
  })

  return result
})

const root = ref<HTMLDivElement>()

</script>

<template>
  <div class="container" ref="root">
    <el-form
      v-if="master"
      :model="master.form"
      :rules="master.rules"
      class="demo-ruleForm"
      :hide-required-asterisk="true">
      <template v-for="item in master.elements">
        <el-form-item :style="paramsTrance.get(item.paramName)!.style" class="zxi-form-item" v-if="paramsTrance.has(item.paramName)" :key="item.id" :prop="item.paramName" v-show="item.show">
          <ZXIInput
            v-if="item.type === EParamsType.range"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :max="item.maxValue"
            :min="item.minValue"
            :name="paramsTrance.get(item.paramName)!.name"
            :unit="item.unit"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :readonly="true" />
          <ZXISelect
            v-if="item.type === EParamsType.enum"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :name="paramsTrance.get(item.paramName)!.name"
            :unit="item.unit"
            :disabled="item.disabled">
            <el-option
              v-for="select in item.valueList"
              :key="select.id"
              :label="select.label"
              :value="select.value" />
          </ZXISelect>
          <ZXISwitch
            v-if="item.type === EParamsType.boolean"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :name="paramsTrance.get(item.paramName)!.name"
            :disabled="item.disabled" />
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  box-sizing: border-box;
  :deep(.demo-ruleForm) {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .zxi-form-item{
      margin: 0px;
    }
  }
}
</style>