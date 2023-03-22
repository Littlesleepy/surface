<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-01 10:06:20
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-08 13:49:27
 * @FilePath: \zxi-deviced:\Zzy\project\zcharts\packages\ZXIMenu\index.vue
 * @Description: 菜单
 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import { PopupMenu } from '..'
import { IZXIMenu } from './type'

const props = defineProps({
  trigger: {
    type: Object as PropType<IZXIMenu>,
    default: () => {
      return {
        position: { clientX: 0, clientY: 0 },
        mouseOrTouch: ''
      }
    }
  }
})

const emit = defineEmits<{
  (e: 'popupMenu', result: PopupMenu): void
}>()

const mount = ref<HTMLDivElement>()

const popupMenu = new PopupMenu({ width: 250, height: 78 })

emit('popupMenu', popupMenu)

watch(() => props.trigger, (v) => {
  popupMenu.trigger(v.position, v.mouseOrTouch)
})

onMounted(() => {
  if (mount.value) popupMenu.setContent(mount.value)
})

onBeforeUnmount(() => {
  popupMenu.close()
  popupMenu.dispose()
})
defineExpose({
  mount
})
</script>

<template>
  <div ref="mount">
    <slot />
  </div>
</template>