<script setup lang="ts">
import { PropType, ref, watch } from 'vue'
import { IUnitAxis } from '../../types'
import { Marker, Shader } from '../../core'
import { UseTheme } from '../../styles'

const props = defineProps({
  usingData: {
    type: Object as PropType<Float32Array | Map<string, { data: Float32Array, color?: string }>>,
    default: () => {
      return { data: new Float32Array(), time: 0 }
    }
  },
  marker: {
    type: Object as PropType<Marker>
  },
  scaleX: {
    type: Object as PropType<IUnitAxis>,
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
    type: Object as PropType<IUnitAxis>,
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
  },
  step: { default: 0 }
})

const root = ref<HTMLDivElement>()

watch(() => props.usingData, (v) => {
  caculateDsy()
})


const dsX = ref('')
const dsY = ref('')
watch(() => props.marker, (marker) => {
  if (marker) {
    marker.chain.el.appendChild(root.value!)
    marker.afterLink.set('0', (start, end) => {
      const ds = props.scaleX.transform((end.index - start.index) * props.step)
      dsX.value = `${ds} ${props.scaleX.unit}`

      caculateDsy()
    })
  }
})

function caculateDsy () {
  if (props.marker && props.marker.chain.start && props.marker.chain.end) {
    let usingData
    if (Object.prototype.toString.call(props.usingData) === '[object Map]') {
      const _data = props.usingData as Map<string, { data: Float32Array, color?: string }>
      if (_data.size === 1) {
        for (const [, data] of _data) {
          usingData = data.data
        }
      } else {
        return
      }
    } else {
      usingData = props.usingData
    }

    const startIndex = props.marker.chain.start.index
    const endIndex = props.marker.chain.end.index

    const start = usingData[startIndex]
    const end = usingData[endIndex]

    if (start !== undefined && end !== undefined) {
      if (start === Shader.BACKGROUND_COLOR || end === Shader.BACKGROUND_COLOR) {
        dsY.value = ''
      } else {
        dsY.value = `${props.scaleY.transform(end - start)} ${props.scaleY.unit}`
      }
    }
  }
}

defineExpose({
  root
})

</script>

<template>
  <div ref="root" class="measure">
    <i class="iconfont icon-sanjiaoxing" />
    <span class="content">{{dsX}}</span>
    <span class="content">{{dsY}}</span>
  </div>
</template>

<style scoped lang="less">
.measure{
  min-width: 350px;
  margin: auto;
  color: v-bind('UseTheme.theme.var.color');
  font-size: 20px;
  display: flex;
  height: 30px;
  padding: 5px;
  box-sizing: border-box;
  position: relative;
  top: -30px;
  .iconfont{
    font-size: 25px;
    display: block;
    transform-origin: center;
    transform: rotate(180deg);
  }
  .content{
    padding: 0 5px;
  }
}
</style>