// 配置文件内容改写
const fs = require('fs')

const path = './dist/config.json'
let cfStr = fs.readFileSync(path, { encoding: 'utf-8' })

const config = JSON.parse(cfStr)

config.baseUrl = "http://192.168.1.201:80"
config.map.sourceUrl = ''

fs.writeFile(path, JSON.stringify(config), { encoding: 'utf-8', flag: 'w' }, () => { })