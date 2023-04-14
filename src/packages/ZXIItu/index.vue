<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-20 11:08:35
 * @Description: ITU显示组件
 * 
-->

<script setup lang="ts">
import { IITUData } from './type'
import { PropType, ref, CSSProperties, StyleValue } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import { UseTheme } from '../styles'

const props = defineProps({
  wrapperStyle: {
    type: [Object, String, Array] as PropType<StyleValue | undefined>,
  },
  inputData: {
    type: Array as PropType<Array<IITUData>>,
    default: () => { return [] }
  },
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
      <ZXIScroll :wrapperStyle="wrapperStyle" class="base-scroll">
        <el-table
          class="table"
          :data="inputData"
          style="width: 100%"
          empty-text="暂无数据"
          :border="true"
          row-key="name"
          header-cell-class-name="header-cell-class"
          cell-class-name="cell-class">
          <el-table-column prop="name" :resizable="true" :show-overflow-tooltip="true" label="名称" min-width="55" />
          <el-table-column prop="curValue" :resizable="true" :show-overflow-tooltip="true" label="瞬时值" min-width="30" />
          <el-table-column prop="maxValue" :resizable="true" :show-overflow-tooltip="true" label="最大值" min-width="30" />
          <el-table-column prop="minValue" :resizable="true" :show-overflow-tooltip="true" label="最小值" min-width="30" />
          <el-table-column prop="aveValue" :resizable="true" :show-overflow-tooltip="true" label="平均值" min-width="30" />
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