<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-15 09:53:35
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-16 09:05:49
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseDialog\BaseDialog.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseDialog'
}
</script>
<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { UseTheme } from 'mcharts/index'

const props = defineProps({
  modelValue: { default: false },
  width: { default: '60%' },
  modal: { default: true },
  title: { default: '' },
  showClose: { default: true },
  center: { type: Boolean },
  delay: { type: Boolean }
})

const emit = defineEmits<{
  (e: 'update:modelValue', result: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: (v) => {
    emit('update:modelValue', v)
  }
})

const opacity = computed(() => show.value ? 1 : 0)
const pointerEevents = computed(() => {
  if (props.modal) {
    return show.value ? 'auto' : 'none'
  }
  return 'none'
})
const containerBgColor = computed(() => props.modal ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)')

const contentPointerEevents = computed(() => show.value ? 'auto' : 'none')

const zIndex = computed(() => show.value ? 2000 : -1)

function close () {
  show.value = false
}

const titleStyle = {
  fontSize: '2.5rem',
  color: UseTheme.theme.var.color,
  margin: props.center ? 'auto' : 'auto 0'
}

// body是否懒加载
const bodyDelay = ref(!props.delay)

watch(show, () => {
  if (!bodyDelay.value) bodyDelay.value = true
})

</script>

<template>
  <div class="container"  @click.self="close">
    <div class="content">
      <div class="header">
        <slot name="header" :close="close" :titleStyle="titleStyle">
          <div class="mock-header">
            <h4 :style="titleStyle">{{ title }}</h4>
            <el-button v-show="showClose"  @click="close">关闭</el-button>
          </div>
        </slot>
      </div>
      <div class="body" v-if="bodyDelay">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: v-bind(zIndex);
  height: 100%;
  background-color: v-bind(containerBgColor);
  overflow: auto;
  opacity: v-bind(opacity);
  pointer-events: v-bind(pointerEevents);
  display: flex;
  .content{
    margin: auto;
    pointer-events: v-bind(contentPointerEevents);
    width: v-bind(width);
    display: flex;
    flex-direction: column;
    background-color: v-bind('UseTheme.theme.ControlBtn.backgroundColor');
    .header {
      padding: 2rem;
      padding-bottom: 1rem;
      margin-right: 1.6rem;
      .mock-header{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
    }
    .body {
      padding: 3rem 2rem;
      color: v-bind('UseTheme.theme.var.color');
    }
  }
}
</style>