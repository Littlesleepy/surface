<script setup lang="ts">
import { WatchStopHandle, PropType, watch, onBeforeUnmount } from 'vue'
import ZXISwitchButton from '../ZXISwitchButton'
import { ISwitchButtons } from './type'

const props = defineProps({
  btnValues: {
    type: Object as PropType<Record<string, boolean>>,
    default: () => { return {} }
  },
  buttons: {
    type: Array as PropType<Array<ISwitchButtons>>,
    default: () => []
  }
})

const stopWatch: Array<WatchStopHandle> = []

props.buttons.forEach(item => {
  if (item.repelName) {
    stopWatch.push(watch(() => props.btnValues[item.paramName], (v) => {
      if (v) {
        item.repelName!.forEach(name => {
          props.btnValues[name] = false
        })
      }
    }, { immediate: true }))
  }
})

onBeforeUnmount(() => {
  stopWatch.forEach(stop => stop())
})

</script>

<template>
  <div class="container">
    <ZXISwitchButton
      class="button"
      v-for="(item, i) in buttons"
      :key="i" v-model="btnValues[item.paramName]"
      :style="`${item.style ?? ''}`">
      <div class="content">
        <i v-if="item.iconName" :class="['iconfont', item.iconName]" :style="`${item.iconStyle ?? ''}`"/>
        <p v-if="item.label" :style="`${item.labelStyle ?? ''}`">{{ item.label }}</p>
      </div>
    </ZXISwitchButton>
  </div>
</template>

<style scoped lang="less">
.content{
  display: flex;
}
.container{
  display: flex;
  .button{
    padding: 10px;
    box-sizing: border-box;
  }
}
</style>