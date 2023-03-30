/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-11 16:56:55
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-02 16:28:29
 * @FilePath: \zxi-device\src\packages\core\Overlay\Overlay.ts
 * @Description: 
 */

import { UseTheme } from '../../styles'
import { Public } from '../Tools'

export interface IOverlayOptions {
  closeButton?: {
    show?: boolean
    color?: string
    className?: string
    fontSize?: string
    top?: string
    right?: string
    zIndex?: string
  }
}
  
export class Overlay {
  static CLOSE = 'close'

  static OPEN = 'open'

  wrapper: HTMLDivElement

  closeButton: HTMLElement | undefined

  readonly options = {
    closeButton: {
      show: true,
      color: UseTheme.theme.var.color,
      className: 'icon-guanbi',
      fontSize: '40px',
      top: '10px',
      right: '10px',
      zIndex: '100'
    }
  }

  constructor (options?: IOverlayOptions) {
    if (options) {
      Public.copyValueFromObject(this.options, options)
    }

    this.wrapper = document.createElement('div')
    const wrapperStyle = this.wrapper.style
    wrapperStyle.width = '100%'
    wrapperStyle.height = '100%'
    wrapperStyle.position = 'absolute'

    const btnOptions = this.options.closeButton
    if (btnOptions.show) {
      this.closeButton = document.createElement('i')
      const btnStyle = this.closeButton.style
      this.closeButton.classList.add(...['iconfont', btnOptions.className])
      btnStyle.position = 'absolute'
      btnStyle.display = 'block'
      btnStyle.cursor = 'pointer'
      btnStyle.color = btnOptions.color
      btnStyle.fontSize = btnOptions.fontSize
      btnStyle.top = btnOptions.top
      btnStyle.right = btnOptions.right
      btnStyle.zIndex = btnOptions.zIndex

      this.wrapper.appendChild(this.closeButton)
    }
  }
}