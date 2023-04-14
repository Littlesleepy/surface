<script setup lang="ts">
import { computed, PropType } from 'vue';

interface ITabHeader {
  name: string
  ratio: number
  mL?: number
  mR?: number
}

const props = defineProps({
  headers: {
    type: Array as PropType<Array<Array<ITabHeader> | string>>,
    default: () => []
  },
  modelValue: { default: 0 }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: number)
}>()

const tabId = computed({
  get: () => props.modelValue,
  set: (v) => {
    emit('update:modelValue', v)
  }
})

const autoStyle = computed(() => {
  if (props.headers.length > 0) {
    const first = props.headers[0]
    if (typeof first === 'string') return true
    return false
  }

  return true
})

function backResult(data: Array<Array<ITabHeader> | string>) {
  const result: Array<{ name: string, style: string }> = []

  if (!autoStyle.value) {
    // 总行数
    const rowLen = data.length
    data.forEach((row, indexRow) => {
      let totalRatio = 0;
      (row as Array<ITabHeader>).forEach(item => {
        totalRatio += item.ratio
        totalRatio += item.mL ?? 0
        totalRatio += item.mR ?? 0
      })
      // 不是最后一行，加margin-bottom: 5px;
      const marginBottom = indexRow < rowLen - 1 ? 'margin-bottom: 5px;' : ''

      // 每一行有总列数
      const columnLen = row.length;
      (row as Array<ITabHeader>).forEach((item, indexColumn) => {
        // 计算宽度
        const width = item.ratio / totalRatio * 100
        let widthStyle = '', marginRight = ''
        if (item.mL !== undefined || item.mR !== undefined) {// 自定义间隔
          widthStyle = `width: ${width}%;`
          if (item.mL !== undefined) {
            widthStyle += `margin-left: ${item.mL / totalRatio * 100}%;`
          }
          if (item.mR !== undefined) {
            widthStyle += `margin-right: ${item.mR / totalRatio * 100}%;`
          }
        } else { // 默认样式
          widthStyle = indexColumn < columnLen - 1 ? `width: calc(${width}% - 5px);` : `width: ${width}%;`
          // 不是最后一列，加margin-right: 5px;
          marginRight = indexColumn < columnLen - 1 ? 'margin-right: 5px;' : ''
        }

        const obj = {
          style: marginBottom + widthStyle + marginRight,
          name: item.name
        }

        result.push(obj)
      })
    })
  } else {
    (data as Array<string>).forEach(name => {
      result.push({
        name: name,
        style: ''
      })
    })
  }

  return result
}

const headerTrance = computed(() => backResult(props.headers))


</script>

<template>
  <div>
    <div class="container" :class="{ autoStyle }">
      <ZXIButton
        class="button"
        v-for="(header, i) in headerTrance"
        :key="i"
        @click="tabId = i"
        :selected="tabId === i"
        :style="header.style">
        <pre class="tab-item-font">{{ header.name }}</pre>
      </ZXIButton>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}
.autoStyle{
  flex-wrap: nowrap;
  :nth-child(2n){
    margin: 0 @btnSpace;
  }
}
.tab-item-font{
  font-size: @font20;
}
.button{
  padding: 5px 10px!important;
}
</style>