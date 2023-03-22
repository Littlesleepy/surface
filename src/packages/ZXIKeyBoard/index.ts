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
import { KeyboardButtonTheme } from 'simple-keyboard/build/interfaces'
import { IClientPosition, Listen, PopupMenu } from '../core'
import './index.css'

export class Keyboard {
  static confirm: (value: string) => void | undefined

  static validFn: ((v: string) => boolean) | undefined
  
  static popupMenu = new PopupMenu({
    borderRadius: '0px',
    closeButton: false,
    drag: true,
    width: 270
  })

  static elKeyBoard = document.createElement('div')

  static input = document.createElement('input')

  static clear = document.createElement('i')

  static container = document.createElement('div')

  static setInput = function (value: string) {
    if (!Keyboard.instance) Keyboard.init()

    Keyboard.instance!.setInput(value, 'simpleKeyBoardInput')
    Keyboard.input.value = value

    if (value === '') {
      Keyboard.instance!.setCaretPosition(0, 0)
    }
  }
  /** 
   * @description: 初始化键盘实例
   * @return {*}
   */  
  static init = function () {
    if (Keyboard.instance === undefined) {
      Keyboard.elKeyBoard.style.cssText = `
        display: flex;
        flex-direction: column;
      `
      // 输入行
      const firstRow = document.createElement('div')
      firstRow.style.cssText = `
        display: flex;
        padding: 5px 0;
        height: 40px;
      `
      firstRow.appendChild(Keyboard.input)
      Keyboard.input.setAttribute('type', 'text')
      Keyboard.input.setAttribute('id', 'simpleKeyBoardInput')
      
      Keyboard.input.style.cssText = `
        max-width: 200px;
        font-size: 20px;
        border: none;
        box-sizing: border-box;
        background-color: rgb(255, 255, 255);
        color: rgb(0, 0, 0);
      `

      firstRow.appendChild(Keyboard.clear)
      Keyboard.clear.style.cssText = `
        flex: auto;
        padding: 0 20px;
        margin: auto;
        font-size: 20px;
        cursor: pointer;
      `
      Keyboard.clear.classList.add(...['iconfont', 'icon-delete'])

      Keyboard.clear.addEventListener(Listen.CLICK, (e) => {
        Keyboard.instance!.clearInput()
        Keyboard.input.value = Keyboard.instance!.getInput()
      })

      Keyboard.clear.addEventListener(Listen.TOUCHEND, () => {
        Keyboard.instance!.clearInput()
        Keyboard.input.value = Keyboard.instance!.getInput()
      })
      
      Keyboard.elKeyBoard.appendChild(firstRow)

      // 第二行
      Keyboard.container.appendChild(Keyboard.elKeyBoard)
      Keyboard.elKeyBoard.classList.add(...['simple-keyboard'])
      Keyboard.popupMenu.setContent(Keyboard.container)
      
      Keyboard.instance = new SimpleKeyboard(Keyboard.elKeyBoard, {
        onChange: (v) => {
          Keyboard.input.value = v
        },
        onKeyPress: (btn) => {
          // 按下enter再把值给出去
          if(btn === '{ent}') {
            // 格式验证
            const reg = /^(\-|\+)?\d+(\.\d+)?$/
            if (!reg.test(Keyboard.input.value)) {
              ElMessage.error('请输入数字')
              return
            }
            // 先验证
            if (Keyboard.validFn !== undefined) {
              if (!Keyboard.validFn(Keyboard.input.value)) return
            }

            Keyboard.confirm(parseFloat(Keyboard.input.value).toString())

            Keyboard.popupMenu.close()
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
   * @return {*}
   */  
  static open = function (position: IClientPosition, mouseOrTouch: string, value = '') {
    Keyboard.init()

    Keyboard.popupMenu.trigger(position, mouseOrTouch)

    Keyboard.setInput(value)
  }
  /** 
   * @description: 关闭键盘
   */  
  static close = function () {
    Keyboard.validFn = undefined
    Keyboard.popupMenu.close()
  }
}