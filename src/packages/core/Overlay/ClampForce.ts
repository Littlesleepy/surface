/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-13 15:48:08
 * @FilePath: \packagesd:\Zzy\project\zcharts\packages\core\Overlay\ClampForce.ts
 * @Description: 夹取工具
 */

import { Fence } from '../Fence'
import { Listen } from '../Event'
import { Scene } from '../Scene'
import { Public } from '../Tools'
import { IOverlayOptions, Overlay } from './Overlay'
import { Threshold } from './Threshold'
import { UseTheme } from '../../styles'

export type IClampForceOptions = {
  /** 
   * @description: 转换到鼠标模式的键盘key
   */  
  toMouseKey?: string
  /** 
   * @description: 是否需要平移按钮
   */
  translation?: {
    show?: boolean,
    advance?: {
      title?: string
    },
    retreat?: {
      title?: string
    }
  }
  /**
   * @description: 放置截取方向，默认竖向Fence.VERTICAL
   */  
  direction?: string
  /**
   * @description: 场景
   */  
  scene?: Scene
  /**
   * @description: 相对局部截取配置
   */  
  sectionThreshold?: {
    traceByFence?: boolean
    show?: boolean
    /** 
     * @description: Threshold.TOP或者Threshold.LEFT
     */    
    tag0?: {
      offset?: number,
      backgroundColor?: string
      /**
       * @description: 门限选中后颜色
       */
      selectColor?: string
    },
    /** 
     * @description: Threshold.BOTTOM或者Threshold.RIGHT
     */ 
    tag1?: {
      offset?: number,
      backgroundColor?: string
      /**
       * @description: 门限选中后颜色
       */
      selectColor?: string
    },
    centerTag?: {
      backgroundColor?: string
      selectColor?: string
    }
    infoTag?: {
      show?: boolean
      width?: number
      height?: number
      backgroundColor?: string
      borderRadius?: string
    }
  }
  /**
   * @description: 相对全局截取配置
   */  
  allThreshold?: {
    show?: boolean
    /**
     * @description: 厚度
     */    
    thickness?: number
    /**
     * @description: 边框
     */    
    border?: string
    /** 
     * @description: Threshold.TOP或者Threshold.LEFT
     */ 
    tag0?: {
      offset?: number,
      backgroundColor?: string
      /**
       * @description: 门限选中后颜色
       */
      selectColor?: string
    },
    /** 
     * @description: Threshold.BOTTOM或者Threshold.RIGHT
     */ 
    tag1?: {
      offset?: number,
      backgroundColor?: string
      /**
       * @description: 门限选中后颜色
       */
      selectColor?: string
    },
    centerTag?: {
      backgroundColor?: string
      selectColor?: string
    }
    infoTag?: {
      show?: boolean
      width?: number
      height?: number
      backgroundColor?: string
      borderRadius?: string
    }
  },
} & IOverlayOptions

export class ClampForce {
  /** 
   * @description: 前进
   */  
  static advance: 'advance' = 'advance'
  /** 
   * @description: 后退
   */ 
  static retreat: 'retreat' = 'retreat'

  afterTranslation = new Map<string, (key: 'advance' | 'retreat') => void>()
  /**
   * @description: 打夹取功能回调函数集
   */
  afterOpen = new Map<string, (sectionThreshold?: Threshold, allThreshold?: Threshold) => void>()
  /**
   * @description: 关闭夹取功能回调函数集
   */  
  afterClose = new Map<string, () => void>()
  /**
   * @description: 截取方向，默认竖向Fence.VERTICAL
   */  
  direction = Fence.VERTICAL

  readonly scene: Scene | undefined
  /**
   * @description: 外层容器
   */  
  readonly wrapper: HTMLDivElement

  readonly container: HTMLElement
  /**
   * @description: 相对局部截取
   */  
  readonly sectionThreshold?: {
    wrapper: HTMLDivElement
    threshold: Threshold
  }
  /**
   * @description: 相对全体截取
   */  
  readonly allThreshold?: {
    wrapper: HTMLDivElement
    threshold: Threshold
    /**
     * @description: 最大最小范围
     */    
    range: {
      /** 
       * @description: 开始时间或者索引
       */      
      beginTime: number
      /** 
       * @description: 文件总时间
       */      
      toltalTime: number
      /** 
       * @description: 结束时间或者索引
       */  
      toltalCount?: number
      /** 
       * @description: 缩放倍率
       */
      zoom: number
    } | undefined
  }

  options = {
    lock: false,
    toMouseKey: 'Control',
    translation: {
      show: false,
      advance: {
        title: '前进'
      },
      retreat: {
        title: '后退'
      }
    },
    sectionThreshold: {
      traceByFence: false,
      show: true,
      tag0: {
        offset: 0.2,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        selectColor: UseTheme.theme.var.tagSelectColor
      },
      tag1: {
        offset: 0.8,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        selectColor: UseTheme.theme.var.tagSelectColor
      },
      centerTag: {
        backgroundColor: UseTheme.theme.var.markerColor,
        selectColor: UseTheme.theme.var.markerSelectColor
      },
      infoTag: {
        show: true,
        width: 200,
        height: 36,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        color: UseTheme.theme.var.tipColor,
        borderRadius: '10px'
      }
    },
    allThreshold: {
      show: true,
      thickness: 30,
      border: '1px solid white',
      tag0: {
        offset: 0.1,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        selectColor: UseTheme.theme.var.tagSelectColor
      },
      tag1: {
        offset: 0.9,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        selectColor: UseTheme.theme.var.tagSelectColor
      },
      centerTag: {
        backgroundColor: UseTheme.theme.var.markerColor,
        selectColor: UseTheme.theme.var.markerSelectColor
      },
      infoTag: {
        show: true,
        width: 200,
        height: 36,
        backgroundColor: UseTheme.theme.var.tipBgColor,
        color: UseTheme.theme.var.tipColor,
        borderRadius: '10px'
      }
    },
    closeButton: {
      show: true,
      color: 'rgb(120, 120, 120)',
      className: 'icon-guanbi',
      fontSize: '25px',
      top: '10px',
      right: '10px',
      zIndex: '100'
    }
  }

  private baseOverlay: Overlay
  /**
   * @description: 是否开启
   */  
  status = Overlay.CLOSE

  private mouseModel = false

  private mouseActivation = false

  private mousePosition: {
    begin?: MouseEvent
    end?: MouseEvent
  } = {}

  private mouseRegion: HTMLDivElement

  private translation = {
    wrapper: document.createElement('div'),
    advance: document.createElement('i'),
    retreat: document.createElement('i')
  }

  constructor (mount: HTMLElement, options?: IClampForceOptions) {

    if (options) {
      Public.copyValueFromObject(this.options, options)

      if (options.scene) this.scene = options.scene
      if (options.direction) this.direction = options.direction
    }

    this.container = mount

    if (this.direction === Fence.VERTICAL) {
      const num = this.options.closeButton.right.match(/\d+/)
      if (num) {
        this.options.closeButton.right = Number(num[0]) + this.options.allThreshold.thickness + 'px'
      }
    }

    this.baseOverlay = new Overlay(this.options)

    this.wrapper = this.baseOverlay.wrapper

    this.wrapper.style.display = 'flex'
    if (this.direction === Fence.TRANSVERSE) {
      this.wrapper.style.flexDirection = 'column'
    }

    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.addEventListener(Listen.CLICK, this.close)

      this.baseOverlay.closeButton.addEventListener(Listen.TOUCHEND, this.close)

      this.baseOverlay.closeButton.addEventListener(Listen.MOUSEDOWN, (e) => {
        e.stopPropagation()
      })
      this.baseOverlay.closeButton.addEventListener(Listen.TOUCHSTART, (e) => {
        e.stopPropagation()
      })
    }

    // 相对局部截取
    const sectionThresholdOp = this.options.sectionThreshold
    if (sectionThresholdOp.show) {
      const sectionWrapper = document.createElement('div')
      sectionWrapper.style.flex = 'auto'
      this.wrapper.appendChild(sectionWrapper)

      const tag0 = sectionThresholdOp.tag0
      const tag1 = sectionThresholdOp.tag1

      const sectionThresholdOptions = {
        traceByFence: sectionThresholdOp.traceByFence,
        centerTag: {
          type: Threshold.TOP_AND_BOTTOM,
          drag: true,
          backgroundColor: sectionThresholdOp.centerTag.backgroundColor,
          selectColor: sectionThresholdOp.centerTag.selectColor
        },
        infoTag: sectionThresholdOp.infoTag,
        showTags: new Map([[
          Threshold.TOP,
          tag0
        ],[
          Threshold.BOTTOM,
          tag1
        ]]),
        closeButton: { show: false },
        scene: this.scene
      }

      if (this.direction === Fence.TRANSVERSE) {
        sectionThresholdOptions.centerTag.type = Threshold.LEFT_AND_RIGHT
        sectionThresholdOptions.showTags = new Map([[
          Threshold.LEFT,
          tag0
        ],[
          Threshold.RIGHT,
          tag1
        ]])
      }

      const sectionThreshold = new Threshold(sectionWrapper, sectionThresholdOptions)

      sectionThreshold.wrapper.style.position = 'relative'

      sectionThreshold.infoTag!.el.style.pointerEvents = 'none'

      this.sectionThreshold = { threshold: sectionThreshold, wrapper: sectionWrapper }
    }

    // 相对全局截取
    const allThresholdOp = this.options.allThreshold
    if (allThresholdOp.show) {
      const allWrapper = document.createElement('div')
      allWrapper.style.cssText = `
        border: ${allThresholdOp.border};
        box-sizing: border-box;
      `
      this.wrapper.appendChild(allWrapper)

      const tag0 = allThresholdOp.tag0
      const tag1 = allThresholdOp.tag1

      const allThresholdOptions = {
        centerTag: {
          type: Threshold.TOP_AND_BOTTOM,
          drag: true,
          backgroundColor: allThresholdOp.centerTag.backgroundColor,
          selectColor: allThresholdOp.centerTag.selectColor
        },
        infoTag: allThresholdOp.infoTag,
        showTags: new Map([[
          Threshold.TOP,
          tag0
        ],[
          Threshold.BOTTOM,
          tag1
        ]]),
        closeButton: { show: false }
      }

      if (this.direction === Fence.TRANSVERSE) {
        allWrapper.style.height = allThresholdOp.thickness + 'px'

        allThresholdOptions.centerTag.type = Threshold.LEFT_AND_RIGHT
        allThresholdOptions.showTags = new Map([[
          Threshold.LEFT,
          tag0
        ],[
          Threshold.RIGHT,
          tag1
        ]])
      } else {
        allWrapper.style.width = allThresholdOp.thickness + 'px'
      }

      const allThreshold = new Threshold(allWrapper, allThresholdOptions)

      allThreshold.wrapper.style.position = 'relative'

      this.allThreshold = {
        threshold: allThreshold,
        wrapper: allWrapper,
        range: undefined
      }
    }

    // 鼠标绘制中间框
    this.mouseRegion = document.createElement('div')
    const regionStyle = this.mouseRegion.style
    regionStyle.cssText = `
      box-sizing: border-box;
      border-color: ${sectionThresholdOp.infoTag.backgroundColor};
      background-Color: ${sectionThresholdOp.centerTag.backgroundColor};
      position: absolute;
      display: none;
      pointer-events: none;
    `
    const borderStyle = `1px solid ${sectionThresholdOp.infoTag.backgroundColor}`
    if (this.direction === Fence.VERTICAL) {
      regionStyle.left = '0%'
      regionStyle.right = '0%'
      regionStyle.borderBottom = regionStyle.borderTop = borderStyle
    } else {
      regionStyle.top = '0%'
      regionStyle.bottom = '0%'
      regionStyle.borderLeft = regionStyle.borderRight = borderStyle
    }

    this.wrapper.appendChild(this.mouseRegion)

    // 前进后退按钮
    if (this.options.translation.show) {
      const options = this.options.translation

      const translation = this.translation
      translation.wrapper.style.cssText = `
        position: absolute;
        font-size: 20px;
        opacity: 0.5;
        cursor: pointer;
        color: ${UseTheme.theme.var.tagBgColor};
        display: flex;
      `
      translation.advance.classList.add(...['iconfont', 'icon-sanjiaoxing'])
      translation.retreat.classList.add(...['iconfont', 'icon-sanjiaoxing'])

      if (this.direction === Fence.VERTICAL) {
        translation.wrapper.style.flexDirection = 'column'
        translation.advance.style.transform = 'rotate(180deg)'
      } else {
        translation.advance.style.transform = 'rotate(90deg)'
        translation.retreat.style.transform = 'rotate(-90deg)'
        translation.wrapper.style.bottom = '0px'
      }

      translation.advance.style.padding = '10px'
      translation.retreat.style.padding = '10px'

      translation.advance.title = options.advance.title
      translation.retreat.title = options.retreat.title


      translation.advance.addEventListener('click', this.translationAdvance)
      translation.advance.addEventListener('touchend', this.translationAdvance)
      translation.retreat.addEventListener('touchend', this.translationRetreat)
      translation.retreat.addEventListener('click', this.translationRetreat)
      
      translation.wrapper.appendChild(translation.advance)
      translation.wrapper.appendChild(translation.retreat)
      this.wrapper.appendChild(translation.wrapper)
    }


    document.addEventListener('keydown', (e) => {
      if (this.options.toMouseKey === e.key) {
        this.mouseModel = true
        if (this.sectionThreshold) {
          const tagManager = this.sectionThreshold.threshold.tagManager
          tagManager.forEach(tag => {
            tag.instance.el.style.display = 'none'
          })

          this.sectionThreshold.threshold.centerTag.style.display = 'none'
        }
      }
    })

    document.addEventListener('keyup', (e) => {
      if (this.options.toMouseKey === e.key) {
        this.mouseModel = false
        if (this.sectionThreshold) {
          const tagManager = this.sectionThreshold.threshold.tagManager
          tagManager.forEach(tag => {
            tag.instance.el.style.display = 'flex'
          })
          this.sectionThreshold.threshold.centerTag.style.display = 'block'
        }
      }
    })

    this.container.addEventListener('mousedown', this.mousedown)
    this.container.addEventListener('mousemove', this.mousemove)
    this.container.addEventListener('mouseup', this.mouseup)
    this.container.addEventListener('mouseleave', this.mouseup)
  }
  /**
   * @description: 打开
   */  
  open = () => {
    if (this.status === Overlay.CLOSE) {
      this.container.appendChild(this.wrapper)
      setTimeout(() => {
        if (this.sectionThreshold) {
          this.sectionThreshold.threshold.open()
        }
        if (this.allThreshold) {
          this.allThreshold.threshold.open()
        }
      })

      this.status = Overlay.OPEN

      for (const [, fun] of this.afterOpen) {
        fun(this.sectionThreshold?.threshold, this.allThreshold?.threshold)
      }
    }
  }

  /**
   * @description: 关闭
   */  
  close = () => {
    if (this.status === Overlay.OPEN) {
      if (this.sectionThreshold) {
        this.sectionThreshold.threshold.close()
      }
      if (this.allThreshold) {
        this.allThreshold.threshold.close()
      }

      this.container.removeChild(this.wrapper)

      this.status = Overlay.CLOSE

      for (const [, fun] of this.afterClose) {
        fun()
      }
    }
  }
  /** 
   * @description: 磁吸器，可将tag调整到最近的fence刻度位置
   * @return {*}
   */  
  magnet () {
    if (this.sectionThreshold) {
      this.sectionThreshold.threshold.magnet()
    }
    if (this.allThreshold) {
      this.allThreshold.threshold.magnet()
    }
  }
  /**
   * @description: 释放资源
   */ 
  dispose () {
    if (this.baseOverlay.closeButton) {
      this.baseOverlay.closeButton.removeEventListener(Listen.CLICK, this.close)

      this.baseOverlay.closeButton.removeEventListener(Listen.TOUCHEND, this.close)
    }

    if (this.sectionThreshold) this.sectionThreshold.threshold.dispose()
    if (this.allThreshold) this.allThreshold.threshold.dispose()

    this.container.removeEventListener('mousedown', this.mousedown)
    this.container.removeEventListener('mousemove', this.mousemove)
    this.container.removeEventListener('mouseup', this.mouseup)
    this.container.removeEventListener('mouseleave', this.mouseup)

    if (this.options.translation) {
      this.translation.advance.removeEventListener('click', this.translationAdvance)
      this.translation.advance.removeEventListener('touchend', this.translationAdvance)
      this.translation.retreat.removeEventListener('touchend', this.translationRetreat)
      this.translation.retreat.removeEventListener('click', this.translationRetreat)
    }
  }
  /** 
   * @description: 设置数据占总数据的比例，注意数据流动方向
   * @param {number} begin 开始占比
   * @param {number} end 结束占比
   * @return {*}
   */   
  setProportion (begin: number, end: number) {
    if (this.allThreshold && this.allThreshold.range) {
      const threshold = this.allThreshold.threshold

      if (this.direction === Fence.VERTICAL) {
        const height = threshold.wrapper.clientHeight
        const top = { offsetX: 0, offsetY: Math.floor(begin * height) }
        const bottom = { offsetX: 0, offsetY: Math.floor(end * height) }

        threshold.setTagPosition(Threshold.TOP, top)
        threshold.setTagPosition(Threshold.BOTTOM, bottom)
      } else {
        const width = threshold.wrapper.clientWidth
        const left = { offsetX: Math.floor(begin * width), offsetY: 0 }
        const right = { offsetX: Math.floor(end * width), offsetY: 0 }

        threshold.setTagPosition(Threshold.LEFT, left)
        threshold.setTagPosition(Threshold.RIGHT, right)
      }
    }
  }

  private translationAdvance= () => {
    for (const [, fun] of this.afterTranslation) {
      fun(ClampForce.advance)
    }
  }

  private translationRetreat = () => {
    for (const [, fun] of this.afterTranslation) {
      fun(ClampForce.retreat)
    }
  }

  private mousedown = (e: MouseEvent) => {
    if (e.buttons === 1 && this.mouseModel && this.status === Overlay.OPEN) {
      this.mouseActivation = true
      this.mousePosition.begin = e

      const style = this.mouseRegion.style
      style.display = 'block'
      if (this.direction === Fence.VERTICAL) {
        style.bottom = (1 - e.offsetY / this.container.clientHeight) * 100 + '%'
        style.top = e.offsetY / this.container.clientHeight * 100 + '%'
      } else {
        style.right = (1 - e.offsetX / this.container.clientWidth) * 100 + '%'
        style.left = e.offsetX / this.container.clientWidth * 100 + '%'
      }
      this.setSectionThresholdPosition()
    }
  }

  private mousemove = (e: MouseEvent) => {
    if (e.buttons === 1 && this.mouseActivation) {
      const begin = this.mousePosition.begin!

      const style = this.mouseRegion.style
      if (this.direction === Fence.VERTICAL) {
        const top = begin.offsetY > e.offsetY ? e.offsetY : begin.offsetY
        const bottom = begin.offsetY > e.offsetY ? begin.offsetY : e.offsetY
        style.top = top / this.container.clientHeight * 100 + '%'
        style.bottom = (1 - bottom / this.container.clientHeight) * 100 + '%'
      } else {
        const left = begin.offsetX > e.offsetX ? e.offsetX : begin.offsetX
        const right = begin.offsetX > e.offsetX ? begin.offsetX : e.offsetX
        style.left = left / this.container.clientWidth * 100 + '%'
        style.right = (1 - right / this.container.clientWidth) * 100 + '%'
      }

      this.mousePosition.end = e

      this.setSectionThresholdPosition()
    }
  }

  private mouseup = () => {
    if (this.mouseActivation) {
      const style = this.mouseRegion.style
      style.display = 'none'
      this.mouseActivation = false

      // 触发end
      if (this.sectionThreshold) {
        const threshold = this.sectionThreshold.threshold
        for (const [, fun] of threshold.afterEnd) {
          if (threshold.positionResult.size === threshold.tagManager.size) fun(threshold.positionResult)
        }
      }
    }
  }

  private setSectionThresholdPosition () {
    if (this.sectionThreshold) {
      const begin = this.mousePosition.begin!
      const end = this.mousePosition.end ? this.mousePosition.end : this.mousePosition.begin!

      const threshold = this.sectionThreshold.threshold
      if (this.direction === Fence.VERTICAL) {
        const top = begin.offsetY > end.offsetY ? end : begin
        const bottom = begin.offsetY > end.offsetY ? begin : end
        threshold.setTagPosition(Threshold.TOP, top)
        threshold.setTagPosition(Threshold.BOTTOM, bottom)
      } else {
        const left = begin.offsetX > end.offsetX? end : begin
        const right = begin.offsetX > end.offsetX ? begin : end

        threshold.setTagPosition(Threshold.LEFT, left)
        threshold.setTagPosition(Threshold.RIGHT, right)
      }
    }
  }
}