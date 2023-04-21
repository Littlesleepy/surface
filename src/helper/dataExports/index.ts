/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-22 13:38:50
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-21 11:31:41
 * @FilePath: \zxi-surface\src\helper\dataExport\index.ts
 * @Description:
 */
import { computed, ref } from 'vue'
import domtoimage from 'dom-to-image-more'
import {
  I_TextOptions,
  I_ImageOptions,
  I_TableOptions,
  I_TableDatas,
  E_ExportType,
  T_ExportDataPage,
  T_ExportOptions,
  T_ExportType,
  downloadOptions,
  T_ExportData
} from './types'
import { ToPdf } from './PDF'
import { ToExcel } from './Excel'
import { ToWord } from './Word'
// import { E_localStorageKey } from '@/storage'
import { Axios } from '@/server'

export class ToExport {
  private static Options: T_ExportOptions = {
    title: '',
    exportName: '',
    personal: '',
    stationName: '',
    functionName: '',
    watermark: '',
    isCustomHome: false,
    no: '',
    title2: '',
    companyName: '',
    lookUpText: '',
    text: '',
    department: '',
    signer: '',
    subjectHeading: '',
    secretLevel: '',
    slowLevel: ''
  }

  private static Pending: Array<Promise<void>> = []

  private static DATA = new Map<number, T_ExportDataPage>()

  private static ExportTypes = ref<Array<T_ExportType>>(['Excel', 'PDF', 'Word'])
  /**
   * @description:可导出类型
   */
  static canExportTypes = computed({
    get() {
      return ToExport.ExportTypes.value
    },
    set(types: Array<T_ExportType>) {
      ToExport.ExportTypes.value = [...new Set(types)]
    }
  })
  /**
   * @description:添加/更改配置(*^▽^*)
   */
  static setOptions = (options: T_ExportOptions) => {
    copyValueFromObject(this.Options, options)
  }

  /**
   * @description:添加一个表格
   */
  static addTable = (title: string, headers: Array<string>, contents: Array<I_TableDatas>, index: number, options: I_TableOptions = {}) => {
    this.setData(index, {
      type: 'Table',
      page: {
        title,
        headers,
        contents,
        options
      }
    })
    return this
  }
  /**
   * @description:添加一段描述
   */
  static addText = (title: string, content: string, index: number, options: I_TextOptions = {}) => {
    this.setData(index, {
      type: 'Text',
      page: {
        title,
        content,
        options
      }
    })

    return this
  }

  /**
   * @description:添加一个dom 该dom在导出时会转为图片
   */
  static addDom = (title: string, dom: Element, index: number, options: I_ImageOptions = {}) => {
    this.setData(index, {
      type: 'Image',
      page: {
        content: new Proxy(
          { url: '', width: dom.scrollWidth, height: dom.scrollHeight },
          {
            get(target, prop, receiver) {
              if (prop === 'width') {
                return dom.scrollWidth
              } else if (prop === 'height') {
                return dom.scrollHeight
              } else {
                return Reflect.get(target, prop, receiver)
              }
            }
          }
        ),
        dom,
        title,
        options
      }
    })
    return this
  }
  /**
   * @description:添加一张图片
   */
  static addImage = (title: string, url: string, index: number, options: I_ImageOptions = {}) => {
    const img = new Image()
    img.onload = () => {
      this.setData(index, {
        type: 'Image',
        page: {
          content: {
            url,
            width: img.width,
            height: img.height
          },
          title,
          options
        }
      })
    }

    return this
  }

  private static setData = (index: number, data: T_ExportDataPage) => {
    this.DATA.set(index, data)
  }
  /**
   * @description:移除数据
   */
  static deleteData = (index: number) => {
    this.DATA.delete(index)
    return this
  }
  /**
   * @description:重置数据
   */
  static reset = (type?: Array<'DATA' | 'beforExport'>) => {
    if (type) {
      type.forEach((key) => {
        this[key].clear()
      })
    } else {
      this.DATA.clear()
      this.beforExport.clear()
    }
    this.Pending = []
    return this
  }

  private static nextAdd = (fun: () => void) => {
    Promise.all(ToExport.Pending).then(fun)
  }
  /**
   * @description:导出前要执行的函数
   */
  static beforExport = new Map<string, () => void>()
  /**
   * @description:下载
   */
  static download = (type: T_ExportType) => {
    if (!type) return
    // 等待图片载入后
    this.nextAdd(async () => {
      // 执行导出前函数
      this.beforExport.forEach((fun) => fun())
      // 排序
      const sortData = Array.from(this.DATA).sort((a, b) => a[0] - b[0])
      // 导出
      const options = {
        ...this.Options,
        deviceName: getDeviceName()
      }
      const exp = type === 'PDF' ? new ToPdf(options) : type === 'Excel' ? new ToExcel(options) : new ToWord(options)
      for (const [, e] of sortData) {
        if (e.type === 'Image' && e.page.dom) {
          //加入的dom在此时转换为图
          await domtoimage.toPng(e.page.dom).then((url) => {
            e.page.content.url = url.match(/[^,]*$/)![0]
            exp.addImage(e.page.title, e.page.content, e.page.options?.[type])
          })
        } else if (e.type === 'Image') {
          exp.addImage(e.page.title, e.page.content, e.page.options?.[type])
        } else if (e.type === 'Table') {
          exp.addTable(e.page.title, e.page.headers, e.page.contents, e.page.options?.[type])
        } else if (e.type === 'Text') {
          exp.addText(e.page.title, e.page.content, e.page.options?.[type])
        }
      }
      // 下载
      exp.download()
    })
  }
}

// 复制
export function copyValueFromObject(target: { [p: string]: any }, source: { [p: string]: any }) {
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

export function getTimeStr() {
  const date = new Date(),
    y = date.getFullYear(),
    o = date.getMonth() + 1,
    d = date.getDate(),
    h = date.getHours(),
    m = date.getMinutes(),
    s = date.getSeconds()
  return `${y}-${o}-${d} ${h}.${m}.${s}`
}
export function getDeviceName() {
  // gabug
  const deviceName: string | undefined = JSON.parse(localStorage.getItem('DEVICEINFO')!)?.deviceName
  return deviceName ?? ''
}

/**
 * @description:下载
 */
export function ExportDownload(dataType: E_ExportType | T_ExportType, data: T_ExportData, name: string) {
  const { url, blobType, extendName } = downloadOptions[dataType]
  Axios({
    method: 'post',
    data,
    responseType: 'arraybuffer',
    url
  })
    .then((e) => {
      const a = document.createElement('a')
      const stream = [e.data]
      const aBlob = new Blob(stream, { type: blobType })
      a.href = URL.createObjectURL(aBlob)
      a.download = `${name ? name : extendName} ${getTimeStr()}.${extendName}`
      a.click()
      a.remove()
    })
    .catch((err) => {
      console.log(err)
    })
}
