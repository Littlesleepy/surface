<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-16 10:58:58
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 14:41:09
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseParamsBranch\BaseParamsBranch.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseParamsBranch'
}
</script>

<script setup lang="ts">
import { PropType, watch, ref, watchEffect } from 'vue'
import { BaseParamsType, IParamElement } from '../BaseParams/type'
import { EParamsType } from '..'
import { IParamBranch } from './type'

const props = defineProps({
  master: {
    type: Object as PropType<BaseParamsType>
  },
  params: {
    type: Array as PropType<Array<Array<IParamBranch>>>,
    default: () => []
  },
  reset: { default: false },
  noWrap: { type: Boolean }
})

const paramsTrance = ref<Array<IParamElement & { name: string, style: string }>>([])

function backResult () {
  const result: Array<IParamElement & { name: string, style: string }> = []
  if (props.master) {
    const data = props.params
    // @ts-ignore
    const elements = props.master.elements.concat(props.master.viceElements)
    // 总行数
    const rowLen = data.length
    data.forEach((row, indexRow) => {
      let totalRatio = 0
      row.forEach(item0 => {
        // 找到对应的元素判断是否加ratio
        let currentEl: IParamElement | undefined
        elements.forEach(el => {
          if (el.paramName === item0.paramName) currentEl = el
        })

        if (currentEl && !(currentEl.show !== undefined && !currentEl.show)) {
          totalRatio += item0.ratio
          totalRatio += item0.mL ?? 0
          totalRatio += item0.mR ?? 0
        }
      })
      // 不是最后一行，加margin-bottom: 5px;
      const marginBottom = indexRow < rowLen - 1 ? 'margin-bottom: 5px;' : ''

      // 每一行有总列数
      const columnLen = row.length
      row.forEach((item, indexColumn) => {
        // 找到对应的元素
        let currentEl: IParamElement | undefined
        elements.forEach(el => {
          if (el.paramName === item.paramName) currentEl = el
        })
        if (currentEl === undefined) throw new Error(`${item.paramName}`)
        // 计算宽度
        const width = item.ratio / totalRatio * 100
        let widthStyle = '', marginRight = ''

        // 判断元素是否隐藏
        if (currentEl.show !== undefined && !currentEl.show) {
          widthStyle = 'width:0%';
        } else {
          if (item.mL !== undefined || item.mR !== undefined) {// 自定义间隔
            widthStyle = `width: ${width}%;`
            if (item.mR !== undefined) {
              widthStyle += `margin-right: ${item.mR / totalRatio * 100}%;`
            } else {
              widthStyle = indexColumn < columnLen - 1 ? `width: calc(${width}% - 5px);` : `width: ${width}%;`
              widthStyle += indexColumn < columnLen - 1 ? 'margin-right: 5px;' : ''
            }
            if (item.mL !== undefined) {
              widthStyle += `margin-left: ${item.mL / totalRatio * 100}%;`
            }
          } else { // 默认样式
            widthStyle = indexColumn < columnLen - 1 ? `width: calc(${width}% - 5px);` : `width: ${width}%;`
            // 不是最后一列，加margin-right: 5px;
            marginRight = indexColumn < columnLen - 1 ? 'margin-right: 5px;' : ''
          }
        }

        const obj = {
          ...currentEl,
          style: marginBottom + widthStyle + marginRight + 'height: 100%;',
          name: item.name
        }

        result.push(obj)
      })
    })
  }

  paramsTrance.value = result
}

watchEffect(() => {
  backResult()
})

watch(() => props.reset, backResult)

const height = props.noWrap ? '100%' : 'none'

</script>

<template>
<div>
  <div class="container">
    <div
      v-if="master && paramsTrance.length"
      class="demo-ruleForm">
        <div v-for="item in paramsTrance" :style="item.style" :key="item.id" v-show="item.show === undefined ? true : item.show">
          <!-- 设备参数 -->
          <ZXIInput
            style="height: 100%;"
            v-if="item.show !== undefined && item.type === EParamsType.range"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :max="item.maxValue"
            :min="item.minValue"
            :name="item.name"
            :unit="item.unit"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :readonly="true" />
          <ZXISelect
            style="height: 100%;"
            v-if="item.show !== undefined && item.type === EParamsType.enum"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :name="item.name"
            :disabled="item.disabled">
            <el-option
              v-for="select in item.valueList"
              :key="select.id"
              :label="select.label"
              :value="select.value" />
          </ZXISelect>
          <ZXISwitch
            style="height: 100%;"
            v-if="item.show !== undefined &&  item.type === EParamsType.boolean"
            @change="master!.getParams(master!.form[item.paramName], item.paramName)"
            v-model="master.form[item.paramName]"
            :name="item.name"
            :disabled="item.disabled" />
          <!-- 附加参数 -->
          <ZXIInput
            style="height: 100%;"
            v-if="item.show === undefined && item.type === EParamsType.range"
            v-model="master.viceForm[item.paramName]"
            :max="item.maxValue"
            :min="item.minValue"
            :name="item.name"
            :unit="item.unit"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :readonly="true" />
          <ZXISelect
            style="height: 100%;"
            v-if="item.show === undefined && item.type === EParamsType.enum"
            v-model="master.viceForm[item.paramName]"
            :name="item.name"
            :unit="item.unit"
            :disabled="item.disabled">
            <el-option
              v-for="select in item.valueList"
              :key="select.id"
              :label="select.label"
              :value="select.value" />
          </ZXISelect>
          <ZXISwitch
            style="height: 100%;"
            v-if="item.show === undefined && item.type === EParamsType.boolean"
            v-model="master.viceForm[item.paramName]"
            :name="item.name"
            :disabled="item.disabled" />
        </div>
    </div>
  </div>
</div>
</template>

<style scoped lang="less">
.container{
  width: 100%;
  height: v-bind(height);
  .demo-ruleForm {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
}
</style>