import { onBeforeUnmount, ref, watch } from "vue"
import { UseTheme, ZXIAxisXType, ZXIAxisYType } from ".."
import { Mesh, Program, Scene, Shader } from "../core"
/** 
 * @description: 绘制webgl背景网格
 * @param {Scene} scene
 * @return {*}
 */
export function useGlGrid (render: any) {
  const spectrumAxisX = ref<ZXIAxisXType>()
  const spectrumAxisY = ref<ZXIAxisYType>()

  let gridLine: {
    program: Program
    mesh: Mesh
    position: Float32Array
    color: Array<number>
  } | undefined
  /** 
   * @description: 计算和设置网格
   * @return {*}
   */  
  function getGrid () {
    if (gridLine && spectrumAxisX.value?.axis && spectrumAxisY.value?.axis) {
      const countX = spectrumAxisX.value.axis.scaleNum
      const countY = spectrumAxisY.value.axis.scaleNum

      const xp = getAxisGridPosition(countX)
      const yp = getAxisGridPosition(countY, false)

      gridLine.position = new Float32Array(xp.concat(yp))

      gridLine.mesh.setData('a_position', gridLine.position)
      gridLine.mesh.options.drawArrays.count = gridLine.position.length / 2

      render()
    }
  }
  /** 
   * @description: 计算网格坐标点
   * @param {number} scaleNum
   * @return {*}
   */  
  function getAxisGridPosition (scaleNum: number, x = true) {
    const result: Array<number> = []
    const ds = 2 / (scaleNum - 1)
    for (let i = 1, len = scaleNum - 1; i < len; i++) {
      const p = -1 + ds * i
      if (x) {
        result.push(...[p, -1, p, 1])
      } else {
        result.push(...[-1, p, 1, p])
      }
    }

    return result
  }

  const stop = watch([spectrumAxisX, spectrumAxisY], (axis) => {
    if (axis[0]) {
      axis[0].afterChange.set('grid', () => {
        getGrid()
      })
    }

    if (axis[1]) {
      axis[1].afterChange.set('grid', () => {
        getGrid()
      })
    }
  })
  /** 
   * @description: 设置着色器
   * @return {*}
   */  
  function setGridProgram (scene: Scene) {
    const gridVertexSorce = `
    precision mediump float;
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position.x, a_position.y, 0.0, 1.0);
    }
    `
    const gridFragmentSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main () {
        gl_FragColor = vec4(u_color);
      } `
    const gridVertexShader = new Shader(scene, Shader.VERTEX_SHADER, gridVertexSorce)
    const gridFragmentShader = new Shader(scene, Shader.FRAGMENT_SHADER, gridFragmentSource)

    gridLine = {
      program: new Program(gridVertexShader, gridFragmentShader),
      mesh: new Mesh(scene, {
        drawArrays: {
          mode: Mesh.LINES,
          count: 0
        }
      }),
      position: new Float32Array(),
      color: UseTheme.theme.SpectrumAndFall.gridColor
    }

    gridLine.mesh
      .setData('u_color', gridLine.color)
      .setData('a_position', gridLine.position)

    gridLine.program.add(gridLine.mesh)

    scene.addProgram(gridLine.program)
  }

  function setLineColor () {
    if (gridLine) {
      gridLine.color = UseTheme.theme.SpectrumAndFall.gridColor
      gridLine.mesh.setData('u_color', gridLine.color)
    }
  }
  

  onBeforeUnmount(() => {
    stop()
  })

  return {
    setGridProgram,
    spectrumAxisX,
    spectrumAxisY,
    setLineColor
  }
}