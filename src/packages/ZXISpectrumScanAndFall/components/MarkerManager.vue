<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-06 16:16:47
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 14:34:33
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXISpectrumScanAndFall\components\MarkerManager.vue
 * @Description: 
 -->

<script setup lang="ts">
import { ElTable } from 'element-plus'
import { PropType, ref, watch, nextTick, computed } from 'vue'
import { Marker, PopupMenu, Shader } from '../../core'
import { ISpectrumInputData, IUnit, IZXIMenu } from '../../types'
import { UseTheme } from '../../styles'
import MarkerChain from './MarkerChain.vue'

interface IData {
  dataIndex: number
  frequency: number
  curValue: number
  maxValue: number
  minValue: number
  aveValue: number
}

const props = defineProps({
  trigger: {
    type: Object as PropType<IZXIMenu>,
    default: () => {
      return {
        position: { clientX: 0, clientY: 0 },
        mouseOrTouch: ''
      }
    }
  },
  marker: {
    type: Object as PropType<Marker>
  },
  markerManagers: {
    type: Object as PropType<Set<{ dataIndex: number, frequency: number, add: boolean }>>,
    default: () => new Set()
  },
  statisticalBuffer: {
    default: () => {
      return {
        input: new Float32Array(),
        max: new Float32Array(),
        min: new Float32Array(),
        sum: new Float64Array(),
        mean:  new Float32Array(),
        count: new Map<number, number>()
      }
    }
  },
  usingData: {
    type: Object as PropType<ISpectrumInputData>,
    default: () => {
      return { data: new Float32Array(), time: 0 }
    }
  },
  step: { default: 0 },
  scaleX: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: 'MHz',
        parse: (v: number) => {
          return `频率：${parseFloat(v.toFixed(6))}MHz|${parseFloat((v * 1000).toFixed(3))}kHz`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(6))
        }
      }
    }
  },
  scaleY: {
    type: Object as PropType<IUnit>,
    default: () => {
      return {
        unit: 'dBuV',
        parse: (v: number) => {
          return `幅度：${v.toFixed(1)} dBuV|${(v - 107).toFixed(1)} dBm`
        },
        transform: (v: number) => {
          return parseFloat(v.toFixed(1))
        }
      }
    }
  }
})

const open = ref(false)

const inputData = ref<Array<IData>>([])

const chainData = computed(() => {
  if (props.usingData.data.length) return props.usingData.data

  return new Float32Array()
})

const table = ref<InstanceType<typeof ElTable>>()

const measure = ref<HTMLDivElement>()

watch(props.statisticalBuffer, (v) => {
  if (open.value) {
    inputData.value.forEach((item) => {
      const index = item.dataIndex
      if (index < v.max.length) {
        item.maxValue = parseFloat(v.max[index].toFixed(1))
        item.minValue = parseFloat(v.min[index].toFixed(1))
        item.aveValue = parseFloat(v.mean[index].toFixed(1))
      }
    })
  }
})

function setInputData() {
  if (props.marker) {
    props.markerManagers.forEach((item) => {
      if (item.add) {
        const index = item.dataIndex
        inputData.value.push({
          dataIndex: index,
          frequency: item.frequency,
          curValue: parseFloat(props.usingData.data[item.dataIndex].toFixed(1)),
          maxValue: parseFloat(props.statisticalBuffer.max[index].toFixed(1)),
          minValue: parseFloat(props.statisticalBuffer.min[index].toFixed(1)),
          aveValue: parseFloat(props.statisticalBuffer.mean[index].toFixed(1))
        })
      } else {
        for (let i = 0, len = inputData.value.length; i < len; i++) {
          if (inputData.value[i].dataIndex === item.dataIndex) {
            inputData.value.splice(i, 1)
            break
          }
        }
      }
    })

    nextTick(() => {
      if (_popupMenu && props.trigger && open.value) _popupMenu.trigger(props.trigger.position, props.trigger.mouseOrTouch)
    })
  }
}

watch(() => props.markerManagers, setInputData)

let _popupMenu: PopupMenu | undefined

function getPopupMenu(popupMenu: PopupMenu) {
  _popupMenu = popupMenu
  popupMenu.options.width = 550
  popupMenu.infoTag.instance.style.width = '550px'

  popupMenu.afterClose.set('0', () => {
    open.value = false
  })

  popupMenu.afterOpen.set('0', () => {
    open.value = true
  })
}

watch(() => props.usingData, (v) => {
  inputData.value.forEach(item => {
    const value = v.data[item.dataIndex]
    if (value !== undefined) item.curValue = parseFloat(value.toFixed(1))
  })
})

watch(() => props.trigger, () => {
  if (table.value) table.value.sort('frequency', 'ascending')
})

</script>

<template>
  <MarkerChain
    :usingData="chainData"
    :marker="marker"
    :scaleX="scaleX"
    :scaleY="scaleY"
    :step="step" />
  <ZXIMenu @popupMenu="getPopupMenu" :trigger="trigger">
    <div class="container">
      <el-table
        class="table"
        ref="table"
        :data="inputData"
        style="width: 100%"
        empty-text="暂无数据"
        :border="false"
        row-key="frequency"
        header-cell-class-name="header-cell-class"
        cell-class-name="cell-class">
        <el-table-column prop="frequency" :show-overflow-tooltip="true" label="频率(MHz)" min-width="100" />
        <el-table-column prop="curValue" :show-overflow-tooltip="true" label="瞬时值" min-width="80" />
        <el-table-column prop="maxValue" :show-overflow-tooltip="true" label="最大值" min-width="80" />
        <el-table-column prop="minValue" :show-overflow-tooltip="true" label="最小值" min-width="80" />
        <el-table-column prop="aveValue" :show-overflow-tooltip="true" label="平均值" min-width="80" />
      </el-table>
    </div>
  </ZXIMenu>
</template>

<style scoped lang="less">
:deep(.header-cell-class){
  background-color: v-bind('UseTheme.theme.var.tipBgColor')!important;
  color: v-bind('UseTheme.theme.var.tipColor');
}
:deep(.cell-class){
  background-color: v-bind('UseTheme.theme.var.tipBgColor')!important;
  color: v-bind('UseTheme.theme.var.tipColor');
}
.container{
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  :deep(.table) {

    background-color: v-bind('UseTheme.theme.var.tipBgColor');
    .el-table__empty-text{
      color: v-bind('UseTheme.theme.var.tipColor')!important;
    }
  }
}
</style>