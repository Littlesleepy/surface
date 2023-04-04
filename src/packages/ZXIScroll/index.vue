<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-03-22 10:03:16
 * @Description: 滚动组件
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, StyleValue } from 'vue'
import BScroll, { Options } from '@better-scroll/core'
import MouseWheel, { MouseWheelOptions } from '@better-scroll/mouse-wheel'
import ScrollBar, { ScrollbarOptions } from '@better-scroll/scroll-bar'
import Pullup from '@better-scroll/pull-up'

BScroll.use(MouseWheel)
  .use(ScrollBar)
  .use(Pullup)

const props = defineProps({
  goBottom: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  scrollbar: {
    type: Object as PropType<ScrollbarOptions> ,
    default: () => {
      return {
        fade: true,
        interactive: true
      }
    }
  },
  preventDefault: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  // 内部滚动部分样式
  scrollStyle: {
    type: [Object, String, Array] as PropType<StyleValue | undefined>,
  },
  mouseWheel: {
    type: Boolean as PropType<MouseWheelOptions>,
    default: true
  },
  // 最外层大小固定的容器样式
  wrapperStyle: {
    type: [Object, String, Array] as PropType<StyleValue | undefined>,
    default: () => {
      return {
        backgroundColor: 'rgb(255, 255, 255)'
      }
    }
  },
  pullingUp: {
    type: Function as PropType<() => Promise<any>>,
    default: undefined
  }
})

const root = ref<HTMLDivElement>()

onMounted(() => {
  watchResize.observe(wrapper.value!)
})

onBeforeUnmount(() => {
  watchResize.unobserve(wrapper.value!)
})

const scroll = ref<BScroll>()

const scrolldom = ref<HTMLDivElement>()

const wrapper = ref<HTMLDivElement>()

const scrollOptions: Options = {
  bounce: true,
  probeType: 3,
  momentum: true,
  preventDefault: props.preventDefault,
  preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|SPAN|DIV|LI|UL|P|IMG|TD|I)$/ },
  click: false,
  mouseWheel: props.mouseWheel,
  scrollbar: props.scrollbar,
  stopPropagation: false,
  pullUpLoad: {
    threshold: -65
  },
  disableMouse: false,
  disableTouch: false
}

const watchResize = new ResizeObserver(() => {
  initScroll()
})

// 记录包围高度
let wrapperHeight = 0

function initScroll (): void {
  if (!wrapper.value) return
  if (scroll.value === undefined) {
    wrapperHeight = wrapper.value.clientHeight

    scroll.value = new BScroll(scrolldom.value!, scrollOptions)
    // 注册滑到底部事件
    scroll.value.on('pullingUp', () => {
      if (props.pullingUp) {
        props.pullingUp().then(() => {
          scroll.value!.finishPullUp()
        }).catch(() => {
          scroll.value!.finishPullUp()
        })
      }
    })
  } else {
    setTimeout(() => {
      if (wrapper.value) {
        // 只有高度发生变化时才刷新
        if (wrapperHeight !== wrapper.value.clientHeight && wrapper.value.clientHeight !== 0) {
          wrapperHeight = wrapper.value.clientHeight
          scroll.value!.refresh()
        }
      }
    }, 100)
  }
  if (props.goBottom) {
    scroll.value.scrollTo(0, scroll.value.maxScrollY)
  }
}

function scrollBottom () {
  if (scroll.value) {
    scroll.value.scrollTo(0, scroll.value.maxScrollY)
  }
}

defineExpose({
  root,
  scrollBottom
})
</script>

<template>
  <div>
    <div class="scroll-container">
      <div class="scroll-father" ref="scrolldom" :style="wrapperStyle" @wheel.stop @contextmenu.prevent>
        <div ref="wrapper">
          <div :style="scrollStyle" ref="root">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.scroll-container{
  width: 100%;
  height: 100%;
  position: relative;
  .scroll-father{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    >div{
      width: 100%;
      >div{
        width: 100%;
      }
    }
  }
}
</style>
