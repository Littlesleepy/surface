<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-07 14:11:23
 * @Description: 
 * 
-->

<script setup lang="ts">
import { PropType, StyleValue, ref } from 'vue'
import { IModulateData } from './type'
import { ElTable, ElTableColumn } from 'element-plus'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Array as PropType<Array<IModulateData>>,
    default: () => { return [] }
  },
  wrapperStyle: [Object, String, Array] as PropType<StyleValue | undefined>,
  name: { type: String }
})

const root = ref<HTMLDivElement>()

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="wrapper">
      <p v-if="name">{{name}}</p>
      <ZXIScroll class="base-scroll" :wrapperStyle="wrapperStyle">
        <el-table
          class="table"
          :data="inputData"
          row-key="name"
          style="width: 100%" empty-text="暂无数据"
          :border="true"
          header-cell-class-name="header-cell-class"
          cell-class-name="cell-class">
          <el-table-column prop="name" :resizable="true" :show-overflow-tooltip="true" label="调制名称" min-width="35" />
          <el-table-column prop="percent" :resizable="true" :show-overflow-tooltip="true" label="识别概率" min-width="40" />
          <el-table-column prop="baudRate" :resizable="true" :show-overflow-tooltip="true" label="波特率" min-width="30" />
        </el-table>
      </ZXIScroll>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/theme');
.wrapper{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  >p{
    height: @headerHeight;
    line-height: @headerHeight;
    color: v-bind('UseTheme.theme.var.color');
    font-size: 12px;
    background-color:v-bind('UseTheme.theme.var.backgroundColor');
    padding: 0 10px;
  }
  .base-scroll{
    flex: auto;
  }
}
</style>