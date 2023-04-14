<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 16:59:40
 * @Description: 亚音频解码
 * 
-->

<script setup lang="ts">
import { PropType, StyleValue, ref } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import { ISubaudioDecodingData } from './type'

const props = defineProps({
  inputData: {
    type: Array as PropType<Array<ISubaudioDecodingData>>,
    default: () => { return [] }
  },
  wrapperStyle: [Object, String, Array] as PropType<StyleValue | undefined>
})
const root = ref<HTMLDivElement>()

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <ZXIScroll class="base-scroll" :wrapperStyle="wrapperStyle">
      <el-table
        :data="inputData"
        style="width: 100%"
        empty-text="暂无数据"
        :border="true"
        header-cell-class-name="header-cell-class"
        cell-class-name="cell-class">
        <el-table-column prop="decodingName" :resizable="true" :show-overflow-tooltip="true" label="解码类型" min-width="45" />
        <el-table-column prop="decodingResult" :resizable="true" :show-overflow-tooltip="true" label="解码结果" min-width="50" />
        <el-table-column prop="decodingCount" :resizable="true" :show-overflow-tooltip="true" label="解码次数" min-width="26" />
      </el-table>
    </ZXIScroll>
  </div>
</template>

<style scoped lang="less">
.base-scroll{
  width: 100%;
  height: 100%;
}
</style>