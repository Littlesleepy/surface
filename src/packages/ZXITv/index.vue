<!--
 * @Author: shiershao
 * @Date: 2022-04-26 16:02:21
 * @LastEditTime: 2023-02-08 13:53:49
 * @Description: 
 * 
-->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import { Engine, ITextureOptions, Mesh, Program, Scene, Shader, WebGl } from '../core'
import { ESwitchState } from '../types'
import { ITvData } from './type'
import { UseTheme } from '../styles'

const props = defineProps({
  inputData: {
    type: Object as PropType<ITvData>,
    default: () => {
      return {
        data: new Uint8Array(),
        width: 0,
        height: 0
      }
    }
  },
  switchLever: {
    type: Number as PropType<ESwitchState>,
    default: ESwitchState.off,
    required: true
  }
})

const root = ref<HTMLDivElement>()

const sceneDom = ref<HTMLDivElement>()

const scene = ref<Scene>()

let mesh: Mesh

function render () {
  if (scene.value && mesh) {
    const renderData: ITextureOptions = {
      texImage2D: {
        internalformat: Mesh.LUMINANCE,
        pixels: props.inputData.data,
        width: props.inputData.width,
        height: props.inputData.height
      }
    }

    mesh.setData('u_image', renderData)

    scene.value.render3D()
  }
}

watch(() => props.inputData, render)

watch(() => props.switchLever, (btn) => {
  if (btn === ESwitchState.open) {
    
    if (scene.value) scene.value.renderCtx.clearScreen()
  }
})

let themeKey

onMounted(() => {
  if (sceneDom.value) {
    const engine = new Engine(sceneDom.value)

    const ctx = new WebGl(engine.canvas, { backgroundColor: UseTheme.theme.nl.backgroundColor })

    scene.value = new Scene(engine, ctx)

    themeKey = UseTheme.on(() => {
      ctx.options.backgroundColor =  UseTheme.theme.nl.backgroundColor

      render()
    })

    const vertexSource = `
      precision mediump float;
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main () {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `

    const fragmentSource = `
      precision mediump float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main () {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `

    const vertexShader = new Shader(scene.value, Shader.VERTEX_SHADER, vertexSource)
    const fragmentShader = new Shader(scene.value, Shader.FRAGMENT_SHADER, fragmentSource)

    const program = new Program(vertexShader, fragmentShader)

    scene.value.addProgram(program)

    const a_position = new Float32Array([
      -1, -1,
      -1, 1,
      1, -1,
      1, -1,
      -1, 1,
      1, 1
    ])

    const a_texCoord = new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1
    ])

    mesh = new Mesh(scene.value, {
      drawArrays: {
        mode: Mesh.TRIANGLES,
        count: a_position.length / 2
      }
    })

    mesh
      .setData('a_position', a_position)
      .setData('a_texCoord', a_texCoord)

    program.add(mesh)
  }
})

onBeforeUnmount(() => {
  if (scene.value) {
    UseTheme.off(themeKey)
    scene.value.dispose()
  }
})

defineExpose({
  root
})
</script>

<template>
  <div ref="root">
    <div class="ZXITv-container">
      <div class="mount" ref="sceneDom" />
    </div>
  </div>
</template>

<style scoped lang="less">
.ZXITv-container{
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-image: url('./imgs/TVtext.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: auto;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  .mount{
    width: 100%;
    height: 100%;
    border: 5px solid v-bind('UseTheme.theme.Tv.borderColor');
    box-sizing: border-box;
  }
}
</style>