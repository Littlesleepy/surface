/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-17 09:30:52
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-21 10:18:07
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\packages\ZXIKeyBoard\index.ts
 * @Description: 
 */
import { ElMessage } from 'element-plus'
import SimpleKeyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import { IClientPosition, Listen, PopupMenu } from '../core'
import './index.css'

export enum ECaculate {
  /**
   * @description: 求和
   */  
  sum,
  /**
   * @description: 求积
   */
  quadrature
}

export interface IUnitGroup {
  type: ECaculate
  items: Map<string, { order: number, dsS: number, dsB: number }>
}

export class Keyboard {
  static unit?: string

  static selectUnit?: string

  static unitGroup: Array<IUnitGroup> = [
    {
      type: ECaculate.quadrature,
      items: new Map([
        ['GHz', { order: 0, dsS: 1000, dsB: 1 }], ['MHz', { order: 1, dsS: 1000, dsB: 0.001 }],
        ['kHz', { order: 2, dsS: 1000, dsB: 0.001 }], ['Hz', { order: 3, dsS: 1, dsB: 0.001 }]
      ])
    },
    {
      type: ECaculate.quadrature,
      items: new Map([
        ['s', { order: 0, dsS: 1000, dsB: 1 }], ['ms', { order: 1, dsS: 1, dsB: 0.001 }]
      ])
    },
    {
      type: ECaculate.sum,
      items: new Map([
        ['dBuV', { order: 0, dsS: -107, dsB: 0 }], ['dBm', { order: 1, dsS: 0, dsB: 107 }]
      ])
    }
  ]
  /**
   * @description: 对具有乘积关系的单位组。给定一个带单位的值，转化到一个合适的单位
   * @return {*}
   */  
  static unitMultipleFormat(source: number, unit: string) {
    // 值单位转换
    let sGroup: IUnitGroup | undefined // 寻找单位组
    let sItem: { unit: string, order: number, dsS: number, dsB: number } | undefined
    Keyboard.unitGroup.forEach((item) => {
      if (item.items.has(unit)) {
        sGroup = item
        sItem = { ...item.items.get(unit)!, unit }
      }
    })

    if (sGroup && sItem && sGroup.type === ECaculate.quadrature) {
      // 单位组转换数组
      const sGroupArr: { unit: string, order: number, dsS: number, dsB: number }[] = []
      for (const [name, el] of sGroup.items) {
        sGroupArr.push({ ...el, unit: name })
      }

      let rNum = source, rUnit = sItem.unit
      // order === 0
      if (sItem.order === 0) {
        if (rNum < 1) {
          for (const [name, el] of sGroup.items) {
            rUnit = name
            if (rNum >= 1) break
            rNum *= el.dsS
          }
        }
      }

      // order === sGroup.items.size - 1
      if (sItem.order === sGroup.items.size - 1) {
        if (rNum >= 1 / sItem.dsB) {
          for (let i = sGroupArr.length - 1; i >= 0; i--) {
            const item = sGroupArr[i]
            rUnit = item.unit
            if (rNum < 1 / sItem.dsB) break
            rNum *= sItem.dsB
          }
        }
      }

      // order处于0和sGroup.items.size - 1之间
      if (sItem.order > 0 && sItem.order < sGroup.items.size - 1) {
        
        if (rNum >= sItem.dsS) { // 向前
          for (let i = sItem.order; i > 0; i--) {
            const item = sGroupArr[i]
            rUnit = item.unit
            if (rNum < sItem.dsS) break
            rNum *= sItem.dsB
          }
        }

        if (rNum < 1) { // 向后
          for (let i = sItem.order, len = sGroupArr.length - 1; i < len; i++) {
            const item = sGroupArr[i]
            rUnit = item.unit
            if (rNum >= 1) break
            rNum *= item.dsS
          }
        }
      }

      return { unit: rUnit, num: rNum }
    }
  }

  static confirm: (value: string) => void | undefined

  static validFn: ((v: string) => boolean) | undefined
  
  static popupMenu = new PopupMenu({
    borderRadius: '0px',
    closeButton: false,
    drag: true,
    width: 360
  })

  static elKeyBoard = document.createElement('div')

  static input = document.createElement('input')

  static clear = document.createElement('div')

  static container = document.createElement('div')

  static unitDom = document.createElement('div')

  static setInput = function (value: string) {
    if (!Keyboard.instance) Keyboard.init()

    Keyboard.instance!.setInput(value, 'simpleKeyBoardInput')
    Keyboard.input.value = value

    if (value === '') {
      Keyboard.instance!.setCaretPosition(0, 0)
    }
  }

  static backValue() {
    // 格式验证
    const reg = /^(\-|\+)?\d+(\.\d+)?$/
    if (!reg.test(Keyboard.input.value)) {
      ElMessage.error('请输入数字')
      return
    }
    // 单位换算
    let result = parseFloat(Keyboard.input.value)
    if (Keyboard.selectUnit && Keyboard.unit && Keyboard.selectUnit !== Keyboard.unit) {
      // 找到使用的单位组
      let group: IUnitGroup | undefined

      Keyboard.unitGroup.forEach(g => {
        if (g.items.has(Keyboard.selectUnit!)) group = g
      })

      if (group) {
        // 找到使用的单位和要转的单位
        const unitSource = group.items.get(Keyboard.selectUnit)!
        const unitTarget = group.items.get(Keyboard.unit)!
        
        const minOrder = Math.min(unitSource.order, unitTarget.order)
        const maxOrder = Math.max(unitSource.order, unitTarget.order)

        const orderDs = (unitSource.order - unitTarget.order)
        if (group.type === ECaculate.quadrature) { // 求积
          let ds = 1
          // 循环两者之间的项，计算差值
          for (const [, item] of group.items) {
            if (item.order >= minOrder && item.order < maxOrder) {
              if (orderDs < 0) {
                ds *= item.dsS
              } else {
                ds /= item.dsS
              }
            }
          }
          result *= ds
        } else { // 求和
          let ds = 0
          // 循环两者之间的项，计算差值
          for (const [, item] of group.items) {
            if (item.order >= minOrder && item.order < maxOrder) {
              if (orderDs < 0) {
                ds += item.dsS
              } else {
                ds -= item.dsS
              }
            }
          }
          result += ds
        }
      }

    }


    // 运行自定义验证
    if (Keyboard.validFn !== undefined) {
      if (!Keyboard.validFn(result.toString())) return
    }

    Keyboard.confirm(result.toString())

    Keyboard.popupMenu.close()
  }
  /** 
   * @description: 初始化键盘实例
   * @return {*}
   */  
  static init = function () {
    if (Keyboard.instance === undefined) {
      // 左边输入列，右边单位列
      Keyboard.container.style.cssText = `
        display: flex;
        background-color: #ececec;;
      `
      const firstColumn = document.createElement('div')
      firstColumn.style.cssText = `
        display: flex;
        flex-direction: column;
        background-color: inherit;
      `
      Keyboard.container.appendChild(firstColumn)

      Keyboard.unitDom.classList.add(...['keyBoardUnit'])

      // 输入行
      const firstRow = document.createElement('div')
      firstRow.style.cssText = `
        display: flex;
        margin: 5px 5px 0 5px;
        height: 5rem;
        background-color: inherit;
      `
      firstRow.appendChild(Keyboard.input)
      Keyboard.input.setAttribute('type', 'text')
      Keyboard.input.setAttribute('readonly', 'true')
      Keyboard.input.setAttribute('id', 'simpleKeyBoardInput')
      
      Keyboard.input.style.cssText = `
        flex: auto;
        max-width: 20rem;
        font-size: 2.2rem;
        border: none;
        box-sizing: border-box;
        background-color: rgb(255, 255, 255);
        color: rgb(0, 0, 0);
      `

      firstRow.appendChild(Keyboard.clear)
      Keyboard.clear.style.cssText = `
        width: 6rem;
        cursor: pointer;
        display: flex;
      `
      // 清除按钮图标
      const clearIcon = document.createElement('i')
      clearIcon.style.cssText = `
        font-size: 2rem;
        margin: auto;
      `
      clearIcon.classList.add(...['iconfont', 'icon-delete'])
      Keyboard.clear.appendChild(clearIcon)

      Keyboard.clear.addEventListener(Listen.CLICK, (e) => {
        Keyboard.instance!.clearInput()
        Keyboard.input.value = Keyboard.instance!.getInput()
      })

      Keyboard.clear.addEventListener(Listen.TOUCHEND, () => {
        Keyboard.instance!.clearInput()
        Keyboard.input.value = Keyboard.instance!.getInput()
      })
      
      firstColumn.appendChild(firstRow)

      // 第二行
      firstColumn.appendChild(Keyboard.elKeyBoard)
      Keyboard.elKeyBoard.classList.add(...['simple-keyboard'])
      Keyboard.popupMenu.setContent(Keyboard.container)
      
      Keyboard.instance = new SimpleKeyboard(Keyboard.elKeyBoard, {
        onChange: (v) => {
          Keyboard.input.value = v
        },
        onKeyPress: (btn) => {
          // 按下enter再把值给出去
          if(btn === '{ent}') {
            Keyboard.backValue()
          }
        },
        layout: {
          default: ["1 2 3", "4 5 6", "7 8 9", "0 . -", "{backspace} {ent}"]
        },
        debug: false,
        theme: "hg-theme-default hg-layout-numeric numeric-theme",
        mergeDisplay: true,
        display: {
          '{backspace}': "⌫",
          '{ent}': '确认'
        },
        inputName: 'simpleKeyBoardInput',
        buttonTheme: [
          {
            class: 'enter',
            buttons: '{ent}'
          },
          {
            class: 'my-button',
            buttons: '0 1 2 3 4 5 6 7 8 9 . - {backspace} {ent}'
          }
        ]
      })
    }
  }

  static instance: SimpleKeyboard | undefined
  /** 
   * @description: 打开键盘
   * @param {IClientPosition} position 键盘打开位置
   * @param {string} mouseOrTouch 出模还是鼠标激发
   * @param {string} unit 单位
   * @return {*}
   */  
  static open = function (
    position: IClientPosition,
    mouseOrTouch: string,
    value = '',
    unit?: string
  ) {
    Keyboard.init()

    Keyboard.renderUnit(unit)

    Keyboard.popupMenu.trigger(position, mouseOrTouch)

    Keyboard.setInput(value)
  }

  static confirmUnit = function (unit: string) {
    Keyboard.selectUnit = unit

    Keyboard.backValue()
  }

  /**
   * @description: 渲染单位
   * @param {string} unit 输入项的单位
   * @return {*}
   */  
  static renderUnit = function (unit?: string) {
    Keyboard.selectUnit = unit
    Keyboard.unit = unit

    if (unit) {
      Keyboard.popupMenu.infoTag.instance.style.width = '360px'
      Keyboard.popupMenu.options.width = 360
      // 渲染单位按钮，先找到对应的单位组
      let group: IUnitGroup | undefined

      Keyboard.unitGroup.forEach(g => {
        if (g.items.has(unit)) group = g
      })

      if (group) {
        Keyboard.unitDom.innerHTML = ''
        // 循环渲染按钮
        for (const [name] of group.items) {
          const div = document.createElement('div')
          div.classList.add(...['unit-button'])

          div.addEventListener(Listen.MOUSEDOWN, function () {
            this.classList.add(...['unit-hg-activeButton'])
          })
          div.addEventListener(Listen.TOUCHSTART, function () {
            this.classList.add(...['unit-hg-activeButton'])
          })

          div.addEventListener(Listen.MOUSEUP, function () {
            this.classList.remove(...['unit-hg-activeButton'])

            Keyboard.confirmUnit(name)
          })
          div.addEventListener(Listen.TOUCHEND, function () {
            this.classList.remove(...['unit-hg-activeButton'])
            Keyboard.confirmUnit(name)
          })

          if (name === Keyboard.unit) {
            div.classList.add(...['current-unit'])
          }

          const span = document.createElement('span')
          span.textContent = name

          div.appendChild(span)

          Keyboard.unitDom.appendChild(div)
        }

        if (!Keyboard.container.contains(Keyboard.unitDom)) {
          Keyboard.container.appendChild(Keyboard.unitDom)
        }
      } else {
        console.warn(`未检测到可供${unit}转换单位组`)
        if (Keyboard.container.contains(Keyboard.unitDom)) {
          Keyboard.container.removeChild(Keyboard.unitDom)
        }
      }
     
    } else {
      // 移除单位
      if (Keyboard.container.contains(Keyboard.unitDom)) {
        Keyboard.container.removeChild(Keyboard.unitDom)
      }

      Keyboard.popupMenu.infoTag.instance.style.width = '270px'
      Keyboard.popupMenu.options.width = 270
    }
  }
  /** 
   * @description: 关闭键盘
   */  
  static close = function () {
    Keyboard.validFn = undefined
    Keyboard.popupMenu.close()
  }
}