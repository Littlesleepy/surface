/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2022-08-19 16:03:03
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2022-10-13 12:43:15
 * @FilePath: \zxi-device\src\views\HandheldSingleMeasure\components\ZXICompassUI\CtxCompassUI.ts
 * @Description:
 */
function copyValueFromObject (target: { [p: string]: any }, source: { [p: string]: any }) {
  for (const prop in source) {
    const value = source[prop]

    if (prop in target) {
      const type = Object.prototype.toString.call(value)
      if (type === '[object Object]') {
        const targetValue = target[prop]

        if (targetValue !== undefined) {
          copyValueFromObject(targetValue, value)
        } else {
          target[prop] = value
        }
      } else {
        target[prop] = value
      }
    }
  }
}
interface CtxCompassUIOptions {
  compass?: {
    enable?: boolean,
    aroundPile?:boolean,
    color?:string
    aroundPileColor?:string
  }
  padding?:number
  wrapper?: {
    border?: string
    backgroundColor?: string
  }
  rotateTexts?: number
  rotateText?: {
    [key: string]: {
      color?: string
      fontSize?: string
      text?: string
    }
  }
}
interface position{
  X: number
  Y: number
}
export class CtxCompassUI {
  options: CtxCompassUIOptions = {
    compass: {
      enable: false,
      aroundPile:true,
      color:'rgb(89,89,89)'
    },
    wrapper: {
      border: '1px solid rgba(196, 196, 196, 0.4)',
      backgroundColor: 'rgba(40, 40, 40)'
    },
    padding:35,
    rotateTexts: 8,
    rotateText: {
      rotate0: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate45: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate90: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate135: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate180: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate225: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate270: {
        color: 'white',
        fontSize: '',
        text: ''
      },
      rotate315: {
        color: 'white',
        fontSize: '',
        text: ''
      }
    }
  }
  /**
   * @description: 根部挂载点
   */
  readonly container: HTMLDivElement
  /**
   * @description: 外层包裹
   */
  readonly wrapper: HTMLDivElement
  /**
   * @description: Canvas元素(罗盘)
   */
  readonly compassCanvas: HTMLCanvasElement
  /**
   * @description: Canvas上下文(罗盘)
   */
  readonly ctx: CanvasRenderingContext2D
  /**
   * @description: 文本框
   */
  readonly textBox: HTMLDivElement
  /**
   * @description: canvas挂载点(绘图)
   */
  readonly canvasMount: HTMLDivElement
  /**
   * @description: canvas挂载点(绘图)
   */
  readonly refusedToRotate: HTMLDivElement | undefined
  /**
   * @description: 指南针N方向旋转角度，正值顺时针旋转，负值逆时针旋转
   */
  rotationAngle: number = 0
  /**
   * @description: 保存绘制的罗盘
   */
  private imgData: ImageData | null
  /**
   * @description: 画布宽度
   */
  private size: number = 0
  /**
   * @description: 画布中心
   */
  center: number = 0
  /**
   * @description: 罗盘半径
   */
  radius: number = 0
  /**
   * @description: 旋转后的回调函数集
   */
  readonly afterRotate = new Map<string, (event: DeviceOrientationEvent) => void>()

  EventPosition = {
    X: 0,
    Y: 0
  }

  NumberTextArr: Array<HTMLDivElement> = []

  private resieObserver = new ResizeObserver(() => {
    this.getParams()
    this.initCompass()
    this.NumberTextArr.forEach((e) => {
      const size = this.size / 24 < 12 ?12:~~(this.size / 24)
      e.style.fontSize = `${size}px`
      e.style.height = `${ this.size + size*2.5 }px`
    })
  })

  constructor (container: HTMLDivElement, options?: any) {
    if (options) {
      // 将传入的对象中的属性拷贝到配置对象中
      copyValueFromObject(this.options, options)
    }
    this.container = container
    this.resieObserver.observe(this.container)
    this.wrapper = document.createElement('div')
    this.wrapper.id = 'wrapper'
    this.wrapper.style.cssText = `
      box-sizing: border-box;
      position: relative;
      background-color: ${this.options.wrapper!.backgroundColor};
      display: flex;
      justify-content: center;
      align-items: center;
    `

    this.container.appendChild(this.wrapper)

    this.container.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      padding:10px;
      position: relative;
    `

    this.compassCanvas = document.createElement('canvas')
    this.compassCanvas.id = 'compassCanvas'
    this.compassCanvas.style.cssText = `
     position: absolute;
     left: 0;
     top: 0;
    `

    this.compassCanvas.style.transform
    this.wrapper.appendChild(this.compassCanvas)

    this.ctx = this.compassCanvas.getContext('2d')!

    this.canvasMount = document.createElement('div')
    this.canvasMount.id = 'canvasMount'
    this.canvasMount.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
    `
    this.wrapper.appendChild(this.canvasMount)

    this.textBox = document.createElement('div')
    this.textBox.id = 'textBox'
    this.textBox.style.cssText = `
      background-color: rgb(40,40,40);
      color: rgb(255,255,255);
      border: 1px ${this.options.compass!.color} dashed;
      position: absolute;
      padding: 6px;
      user-select: none;
      opacity:0;
      pointer-events: none;
      border-radius: 5px;
      z-index: 2;
    `

    this.container.appendChild(this.textBox)

    this.imgData = null

    this.getParams()
    for (let i = 0; i < this.options.rotateTexts!; i++) {
      const numText = document.createElement('div')
      const rotate = (i * 360) / this.options.rotateTexts!
      const textOptions = this.options.rotateText![`rotate${rotate}`]
      numText.id = `rotate${rotate}`
      numText.style.cssText = `
        position: absolute;
        color: ${textOptions?.color || 'white'};
        height: ${this.size + 30}px;
        transform: rotate(${rotate}deg);
        user-select: none;
        pointer-events: none;
        font-size: ${textOptions?.fontSize || ~~(this.size / 24)}px;
      `

      numText.innerText = `${textOptions?.text || rotate}`
      this.wrapper.appendChild(numText)
      this.NumberTextArr.push(numText)
    }

    if(this.options.compass?.aroundPile){
      this.container.addEventListener('mousedown', this.EventFun)
      this.container.addEventListener('mousemove', this.EventFun)
      this.container.addEventListener('mouseup', this.EventFun)
      this.container.addEventListener('mouseleave', this.EventFun)
      this.container.addEventListener('touchstart', this.EventFun)
      this.container.addEventListener('touchmove', this.EventFun)
      this.container.addEventListener('touchend', this.EventFun)
    }

    if (this.options.compass!.enable) {
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', this.rotate)
        // window.addEventListener('deviceorientation', (event) => {
        //   this.rotate(event)
        // })
      } else {
        console.log('设备不支持罗盘功能')
      }
      this.refusedToRotate = document.createElement('div')
      this.refusedToRotate.id = 'refusedToRotate'
      this.refusedToRotate.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
      `
      this.wrapper.appendChild(this.refusedToRotate)
    }
  }

  private rotate (event: DeviceOrientationEvent) {
    if (event.alpha) {
      this.rotationAngle = event.alpha

      const wStyle = this.wrapper.style

      wStyle.transform = `rotate(${this.rotationAngle}deg)`

      if (this.refusedToRotate) {
        this.refusedToRotate.style.transform = `rotate(${-this.rotationAngle}deg)`
      }
      if (this.IsDown) {
        this.drawLine({ X: this.EventPosition.X, Y: this.EventPosition.Y })
      }

      for (const [, fun] of this.afterRotate) {
        fun(event)
      }
    }
  }

  getParams () {
    if (this.container.clientHeight > this.container.clientWidth) {
      this.size = this.container.clientWidth
    } else {
      this.size = this.container.clientHeight
    }

    this.size -= this.options.padding!
    // 保持画布尺寸为奇数
    if(this.size % 2==0){ this.size -= 1 }
    // 画布最小尺寸
    if(this.size < 3){ this.size = 3 }

    this.center = this.size / 2
    this.radius = this.center - 1
    this.wrapper.style.width = this.size + 'px'
    this.wrapper.style.height = this.size + 'px'
    this.compassCanvas.width = this.size
    this.compassCanvas.height = this.size
  }

  initCompass () {
    const ctx = this.ctx
    ctx.fillStyle = 'rgb(40,40,40)'
    ctx.fillRect(0, 0, this.size, this.size)
    const center = this.center
    const radius = this.radius
    ctx.strokeStyle = this.options.compass!.color!
    // 虚线间隙
    ctx.setLineDash([4, 2])
    // 绘制圆
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath()
      ctx.arc(this.center, this.center, (this.radius / 4) * i, 0, Math.PI * 2)
      ctx.stroke()
    }
    const correctCenter = this.center - this.radius
    // 绘制直线
    ctx.beginPath()
    for (let i = 0; i < this.options.rotateTexts!; i++) {
      ctx.save()

      ctx.translate(center, center)
      ctx.rotate((i * (360/this.options.rotateTexts!) * Math.PI) / 180)
      ctx.moveTo(0, 0)
      ctx.lineTo(0, correctCenter - center)
      ctx.restore()
    }
    ctx.stroke()

    // 绘制外圈
    ctx.beginPath()
    for (let i = 0; i < 72; i++) {
      if (!(i % 9 == 0)) {
        ctx.save()
        ctx.translate(center, center)
        ctx.rotate((i * 5 * Math.PI) / 180)
        ctx.moveTo(0, radius)
        ctx.lineTo(0, radius - 10)
        ctx.restore()
      }
    }
    ctx.stroke()
    let sizeWeight = ~~(this.size / 25)
    if (sizeWeight > 19) {
      sizeWeight = 19
    }
    // 外圈文本
    ctx.setLineDash([0, 0])
    ctx.strokeStyle = 'rgb(255,255,255)'
    ctx.fillStyle = 'rgb(255,255,255)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${sizeWeight}px serif`

    // 保存本次绘制
    this.imgData = ctx.getImageData(0, 0, this.size, this.size)
  }

  drawLine (position?:position) {
    const ctx = this.ctx
    ctx.fillRect(0, 0, this.size, this.size)
    ctx.putImageData(this.imgData!, 0, 0)

    if (position) {
      this.EventPosition.X = position.X
      this.EventPosition.Y = position.Y
      const dom = this.container.getBoundingClientRect()
      const EX = position.X - dom.x - this.container.offsetWidth / 2
      const EY = position.Y - dom.y - this.container.offsetHeight / 2
      let tan = Math.atan(EX / EY)
      switch (true) {
      case EX > 0 && EY < 0: // 一象限
        tan = -tan
        break
      case EX >= 0 && EY >= 0: // 二象限
        tan = Math.PI - tan
        break
      case EX < 0 && EY >= 0: // 三象限
        tan = Math.PI - tan
        break
      default: // 四象限
        tan = 2 * Math.PI - tan
        break
      }
      const azimuthAngle = (tan * 180) / Math.PI - this.rotationAngle
      ctx.save()
      ctx.translate(this.center, this.center)
      ctx.rotate((azimuthAngle * Math.PI) / 180)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, this.center - this.radius - this.center)
      ctx.stroke()
      ctx.restore()

      const rect = this.container.getBoundingClientRect()
      this.textBox.style.left = `${position.X + 15 - rect.x}px`
      this.textBox.style.top = `${position.Y - 45 - rect.y}px`
      this.textBox.innerText = `${(azimuthAngle + (azimuthAngle < 0 ? 360 : 0)).toFixed(1)}°`
    }
  }

  IsDown = false
  EventFun = ( e: MouseEvent | TouchEvent) => {
    const event = 'touches' in e! ? e.touches[0] : e
    const position = event ? {
      X: event.clientX,
      Y: event.clientY
    } : null

    switch (e.type) {
    case 'touchstart':
    case 'mousedown':
      this.drawLine(position!)
      this.textBox.style.opacity = '1'
      this.IsDown = true
      break
    case 'touchmove':
    case 'mousemove'||'touchmove':
      if (!this.IsDown) return
      this.drawLine(position!)
      break
    case 'touchend':
    case'mouseleave':
    case 'mouseup':
      this.drawLine()
      this.textBox.style.opacity = '0'
      this.IsDown = false
    }

  }

  dispose = () => {
    this.resieObserver.unobserve(this.container)
    window.removeEventListener('deviceorientation',this.rotate)

  }
}
