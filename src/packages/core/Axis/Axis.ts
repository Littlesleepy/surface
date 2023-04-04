/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-01-31 15:55:11
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-28 14:46:55
 * @FilePath: \zxi-deviced:\Zzy\project\mcahrts\packages\core\Axis\Axis.ts
 * @Description: 
 */
import { Fence } from '../Fence'
import { IOffsetPosition, Listen } from '../Event'
import { Public } from '../Tools'
import { Canvas } from '../Render/Canvas/Canvas'
import { Scene } from '../Scene'
import { UseTheme } from '../../styles'
import { reactive, toRefs} from 'vue'

export interface IAxisOptions {
  direction?: string
  /**
   * @description: 刻度绘制厚度
   */ 
  scaleLength?: number
  /**
   * @description: 刻度绘制
   */ 
  axisLine?: {
    color?: string
    splitNumber?: number
    splitLength?: number
  },
  /**
   * @description: 刻度值配置
   */  
  scaleNum?: {
    width?: number
    /**
     * @description: 字体大小rem
     */
    fontSize?: number
    color?: string
  }
  lock?: boolean
  minMoveDistanceForTrance?: number
  tansProportion?: number
}

export type AxisType = ReturnType<typeof Axis.create>

export class Axis {
  /**
   * @description: 创建坐标轴
   * @param {Scene} scene 场景
   * @param {HTMLDivElement} container 容器
   * @param {IAxisOptions} options 配置
   * @return {*}
   */  
  static readonly create = function (scene: Scene, container: HTMLDivElement, options?: IAxisOptions) {
    const state = reactive({
      /**
       * @description: 需要赋值的刻度值数量
       */      
      scaleNum: 0,
      /**
       * @description: 轴的方向，竖向或者横向
       */      
      direction: Fence.TRANSVERSE
    })

    const _container = container

    const _scene = scene

    const _manager = new Set<string>([
      'wheel', 'touchstart', 'touchmove', 'touchend'
    ])

    const _resizeObserver = new ResizeObserver(() => {
      methods.getScaleNum()
    })
    
    const _options = {
      scaleLength: 10,
      axisLine: {
        color: UseTheme.theme.rgb.scaleColor,
        splitNumber: 1,
        splitLength: 0.5
      },
      scaleNum: {
        width: 40,
        fontSize: 20,
        color: UseTheme.theme.var.color
      },
      lock: false,
      minMoveDistanceForTrance: 20,
      tansProportion: 0.25
    }

    let _startPosition: IOffsetPosition | undefined
    
    if (options) {
      if (options.direction) state.direction = options.direction

      Public.copyValueFromObject(_options, options)
    }
    scene.disposeManager.add(() => { methods.dispose() })

    const canvasContainer = document.createElement('div')
    const _canvas = document.createElement('canvas')
    canvasContainer.appendChild(_canvas)

    const _scaleUlContainer = document.createElement('ul')

    _container.style.display = 'flex'

    canvasContainer.style.position = 'relative'

    _canvas.style.position = 'absolute'
    _canvas.style.width = '100%'
    _canvas.style.height = '100%'

    _scaleUlContainer.style.listStyle = 'none'
    _scaleUlContainer.style.margin = '0px'
    _scaleUlContainer.style.padding = '0px'
    _scaleUlContainer.style.display = 'flex'
    _scaleUlContainer.style.flexWrap = 'nowrap'
    _scaleUlContainer.style.justifyContent = 'space-between'
    _scaleUlContainer.style.fontSize = `${_options.scaleNum.fontSize}px`
    _scaleUlContainer.style.color = _options.scaleNum.color

    if (state.direction === Fence.TRANSVERSE) {
      _container.appendChild(canvasContainer)
      _container.appendChild(_scaleUlContainer)

      container.style.flexDirection = 'column'
      canvasContainer.style.height = `${_options.scaleLength}px`
    } else {
      _container.appendChild(_scaleUlContainer)
      _container.appendChild(canvasContainer)

      _scaleUlContainer.style.flexDirection = 'column'
      _scaleUlContainer.style.width = `${_options.scaleNum.width}px`
      canvasContainer.style.width = `${_options.scaleLength}px`
    }

    const _event = new Listen(container)

    const _renderCtx = new Canvas(_canvas)

    _resizeObserver.observe(_container)

    const methods = {
      wheel (e: WheelEvent) {
        const fence = _scene.fence
        if (!_options.lock && fence !== undefined && state.direction === fence.direction) {

          const count = Math.floor(fence.baseFence.visibleLength * _options.tansProportion)
          if (e.deltaY > 0) { // 向min
            fence.transByCount(-count)
          } else { // 向max
            fence.transByCount(count)
          }
        }
      },

      touchstart () {
        const fence = _scene.fence
        if (_options.lock || fence === undefined ||
          fence.direction !== state.direction || _event.touchPosition.size !== 1) return
        _startPosition = _event.touchPosition.get(0)
      },

      touchmove () {
        const fence = _scene.fence
        if (_options.lock || fence === undefined ||
          fence.direction !== state.direction || _event.touchPosition.size !== 1 || _startPosition === undefined) return
        const currentPosition = _event.touchPosition.get(0)!

        let distance = 0
        if (state.direction === Fence.TRANSVERSE) {
          distance = currentPosition.offsetX - _startPosition.offsetX
        } else {
          distance = currentPosition.offsetY - _startPosition.offsetY
        }

        if (Math.abs(distance) > _options.minMoveDistanceForTrance) {
          _startPosition = currentPosition
          const count = Math.floor(fence.baseFence.visibleLength * _options.tansProportion)
          if (distance > 0) { // 向max
            fence.transByCount(count)
          } else {
            fence.transByCount(-count)
          }
        }
      },

      touchend () {
        const fence = _scene.fence
        if (_options.lock || fence === undefined || fence.direction !== state.direction) return

        if (_event.touchPosition.size === 1) {
          _startPosition = _event.touchPosition.get(0)!
        } else {
          _startPosition = undefined
        }
      },

      renderAxisLine () {
        const width = _canvas.clientWidth
        const height = _canvas.clientHeight
        const ctx = _renderCtx.ctx
        const splitNumber = _options.axisLine.splitNumber
        const splitLength = _options.axisLine.splitLength
        const lineCount = splitNumber * (state.scaleNum - 1) + 1
        let dx, ds

        _renderCtx.contextRefresh()

        ctx.clearRect(0, 0, width, height)
        ctx.strokeStyle = _options.axisLine.color
        ctx.lineWidth = 1
        ctx.beginPath()
        if (state.direction === Fence.TRANSVERSE) {
          dx = width / (lineCount - 1)
          for (let i = 0; i < lineCount; i++) {
            ds = i * dx
            ctx.moveTo(ds, 0)
            if (i % splitNumber === 0) {
              ctx.lineTo(ds, height)
            } else {
              ctx.lineTo(ds, height * splitLength)
            }
          }
          ctx.moveTo(0, 0)
          ctx.lineTo(width, 0)
          ctx.stroke()
        } else {
          dx = height / (lineCount - 1)
          for (let i = 0; i < lineCount; i++) {
            ds = i * dx
            ctx.moveTo(width, ds)
            if (i % splitNumber === 0) {
              ctx.lineTo(0, ds)
            } else {
              ctx.lineTo(width * (1 - splitLength), ds)
            }
          }
          ctx.moveTo(width, 0)
          ctx.lineTo(width, height)
          ctx.stroke()
        }
      },

      setScaleNumber (values: Array<string | number>) {
        const children = _scaleUlContainer.children
        for (let i = 0, len = children.length; i < len; i++) {
          const li = children[i]
          const span = li.children[0]
          span.textContent = values[i].toString()
        }
      },

      watchScaleNumber (dLength: number) {
        // 构造刻度元素
        const children = _scaleUlContainer.children
        if (dLength > 0) {
          const fragment = document.createDocumentFragment()
          for (let i = 0; i < dLength; i++) {
            const li = document.createElement('li')
            const span = document.createElement('span')
            li.appendChild(span)
            
            fragment.appendChild(li)
          }
          _scaleUlContainer.appendChild(fragment)
        }

        if (dLength < 0) {
          for (let i = 0, len = Math.abs(dLength); i < len; i++) {
            const li = children[children.length - 1]
            _scaleUlContainer.removeChild(li)
          }
        }

        if (state.direction === Fence.TRANSVERSE) {
          for (let i = 0, len = children.length; i < len; i++) {
            const li = children[i] as HTMLLIElement
            if (i === 0) {
              li.style.textAlign = 'left'
              li.style.flex = '1'
            } else if (i === len - 1) {
              li.style.textAlign = 'right'
              li.style.flex = '1'
            } else {
              li.style.textAlign = 'center'
              li.style.flex = '2'
            }
          }
        } else {
          for (let i = 0, len = children.length; i < len; i++) {
            const li = children[i] as HTMLLIElement
            const span = li.children[0] as HTMLLIElement
            li.style.display = 'flex'
            span.style.margin = 'auto'
            if (i === 0) {
              span.style.marginTop = '0px'
              li.style.flex = '1'
            } else if (i === len - 1) {
              span.style.marginBottom = '0px'
              li.style.flex = '1'
            } else {
              li.style.flex = '2'
            }
          }
        }
      },
      getScaleNum () {
        const oldValue = state.scaleNum
        if (state.direction === Fence.TRANSVERSE) {
          const width = _container.clientWidth
          if (width <= 800) {
            state.scaleNum = 3
          } else if (width > 800 && width <= 1100) {
            state.scaleNum = 5
          } else {
            state.scaleNum = 7
          }
        } else {
          const height = _container.clientHeight
          if (height <= 200) {
            state.scaleNum = 3
          } else if (height > 200 && height <= 300) {
            state.scaleNum = 4
          } else if (height > 300 && height <= 500) {
            state.scaleNum = 5
          } else {
            state.scaleNum = 6
          }
        }

        methods.watchScaleNumber(state.scaleNum - oldValue)

        methods.renderAxisLine()
      },

      dispose () {
        _event.dispose()
        _resizeObserver.unobserve(_container)
      }
    }

    for (const key of _manager) {
      _event[key].add(methods[key])
    }

    const result = reactive({
      ...toRefs(state),
      setScaleNumber: methods.setScaleNumber,
      renderAxisLine: methods.renderAxisLine,
      dispose: methods.dispose,
      options: _options
    })

    return result
  }
}