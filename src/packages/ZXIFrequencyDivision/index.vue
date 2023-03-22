<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-20 11:08:08
 * @Description: 频率划分
 * 
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import { IAxisXValue } from '../types'
import frequencyDivision from './FrequencyDivision.json'
import { IFrequencyDivision } from './type'
import { UseTheme } from '../styles'

interface IList {
  id: number
  name: string
  style: any
}

const props = defineProps({
  axisXValue: {
    type: Object as PropType<IAxisXValue>,
    default: () => {
      return { min: 0, max: 0 }
    }
  }
})


const root = ref<HTMLDivElement>()

const fDJson = frequencyDivision.content

const father = ref<Element>()

let liLists= ref<Array<IList>>([])

const watchSize = new ResizeObserver(() => {
  domCreate()
})

function domCreate () {
  if (!father.value) return
  const scale = { min: props.axisXValue.min * 1000000, max: props.axisXValue.max * 1000000 }
  let item, obj, dx, width, w, left
  dx = scale.max - scale.min
  width = father.value.clientWidth / dx
  const lists:  Array<IList> = []
  for (let i = 0, len = fDJson.length; i < len; i++) {
    obj = fDJson[i] as IFrequencyDivision
    // 确认需要创建的子节点
    if (obj.maxFrequency > scale.min && obj.minFrequency < scale.max) {
      item = { id: i, name: '', style: {} }
      // name
      item.name = obj.name
      // 样式
      if (obj.minFrequency >= scale.min && obj.maxFrequency <= scale.max) { // 完整渲染
        w = (obj.maxFrequency - obj.minFrequency) * width + 'px'
        left = (obj.minFrequency - scale.min) * width + 'px'
      } else if (obj.minFrequency <= scale.min && obj.maxFrequency >= scale.min && obj.maxFrequency <= scale.max) { // 前半截不显示
        w = (obj.maxFrequency - scale.min) * width + 'px'
        left = '0px'
      } else if (obj.minFrequency <= scale.max && obj.maxFrequency >= scale.max && obj.minFrequency >= scale.min) { // 后半截不显示
        w = (scale.max - obj.minFrequency) * width + 'px'
        left = (obj.minFrequency - scale.min) * width + 'px'
      } else { // 占据整个窗口
        w = father.value!.clientWidth + 'px'
        left = '0px'
      }
      item.style = { width: w, left: left, backgroundColor: obj.color }
      lists.push(item)
    }
  }
  liLists.value = lists
}

watch(() => props.axisXValue, domCreate)

onMounted(() => {
  watchSize.observe(father.value!)
})

onBeforeUnmount(() => {
  watchSize.unobserve(father.value!)
})

defineExpose({
  root
})

</script>

<template>
  <div ref="root">
    <div class="frequency-division-coantainer">
      <ul ref="father">
        <li v-for="item in liLists" :key="item.id" :style="item.style">{{ item.name }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('../assets/styles/them');
.frequency-division-coantainer{
  width: 100%;
  pointer-events: none;
  overflow: hidden;
  ul{
    width: 100%;
    position: relative;
    height: 16px;
    opacity: 1;
    li{
      position: absolute;
      display: block;
      top: 0;
      height: 16px;
      overflow: hidden;
      box-sizing: border-box;
      color: v-bind('UseTheme.theme.var.color');
      text-align: center;
      padding: 0 3px;
      line-height: 16px;
      text-overflow: clip;
    }
  }
}
</style>