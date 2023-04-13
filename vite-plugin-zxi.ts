import { type Plugin } from 'vite';
import fs from 'fs'

export default function plugin(): Plugin {
  return {
    name: 'vite-plugin-zxi',
    apply: 'build',
    transformIndexHtml(html) {
      // 切换本地图标
      const fileNames = fs.readdirSync('./dist/static')
      const fontNames: Array<string> = []
      fileNames.forEach(name => {
        if (name.search(/^(font_)/) > -1) {
          fontNames.push(name)
        }
      })
      html = html.replace(/\/\/at.alicdn.com.*\.css/, `./static/${fontNames[0]}/iconfont.css`)
      html = html.replace(/\/\/at.alicdn.com.*\.css/, `./static/${fontNames[1]}/iconfont.css`)

      return html
    }
  }
}