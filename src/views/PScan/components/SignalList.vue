<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-13 14:30:37
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-13 14:51:55
 * @FilePath: \zxi-device\src\views\PScan\components\SignalList.vue
 * @Description: 信号识别结果
 -->

<script setup lang="ts">
import { IBaseLink, IServerSignal } from '@/types'
import { PropType, ref } from 'vue'
import BaseLink from '@/components/BaseLink/BaseLink.vue'
import { IClientPosition, Listen } from 'mcharts/index'

defineProps({
  lists: {
    type: Array as PropType<Array<IServerSignal>>,
    default: () => []
  },
  hopSpeed: { type: String }
})

const trigger = ref<IBaseLink>({
  position: { clientX: 0, clientY: 0 },
  mouseOrTouch: '',
  value: 0,
  describe: '',
  propoerty: {}
})

/** 
 * @description: 跳转监测
 * @param {IServerSignal} row
 * @return {*}
 */
function handleMonitor (e: MouseEvent | TouchEvent, row: IServerSignal) {
  const position: IClientPosition = { clientX: 0, clientY: 0 }

  let mouseOrTouch: string

  if ('touches' in e) {
    mouseOrTouch = Listen.TOUCH
    position.clientX = e.touches[0].clientX
    position.clientY = e.touches[0].clientY
  } else {
    mouseOrTouch = Listen.MOUSE
    position.clientX = e.clientX
    position.clientY = e.clientY
  }

  trigger.value = {
    position,
    mouseOrTouch,
    value: row.bindingFrequency,
    describe: row.bindingFrequency + 'MHz',
    propoerty: {}
  }
}
</script>

<template>
  <div>
    <BaseLink
      :trigger="trigger"/>
    <ZXIScroll class="zxi-scroll">
      <p class="hopSpeed" v-if="hopSpeed">{{hopSpeed}}</p>
      <el-table :data="lists" border style="width: 100%">
        <el-table-column center prop="bindingFrequency" label="频率(MHz)" min-width="90" />
        <el-table-column center prop="bindingBandWidth" label="带宽(kHz)" min-width="80" />
        <el-table-column center prop="power" label="幅度" min-width="50" />
        <el-table-column center prop="remark" label="频段" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column center prop="beginTimeStr" label="出现时间" min-width="135" />
        <el-table-column center prop="endTimeStr" label="消失时间" min-width="135" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button @click="(e) => handleMonitor(e, scope.row)"
              >跳转</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </ZXIScroll>
  </div>
</template>

<style scoped lang="less">
.zxi-scroll{
  width: 100%;
  height: 100%;
}
.hopSpeed{
  padding: 5px;
}
</style>