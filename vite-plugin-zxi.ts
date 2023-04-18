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
    // closeBundle() {
    //   // 配置文件内容改写
    //   let data = fs.readFileSync('./dist/config.json', { encoding: 'utf-8' })

    //   console.log(data)

    //   const config = JSON.parse(data)

    //   config.baseUrl = ''
    //   config.map.sourceUrl = ''

    //   fs.writeFile('./dist/config.json', JSON.stringify(config), { encoding: 'utf-8', flag: 'w' }, () => { })
    // }
  }
}