/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 13:26:22
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-29 17:06:46
 * @FilePath: \zxi-pm360\src\tools\dataExport\Excel\index.ts
 * @Description:
 */
import { copyValueFromObject, ExportDownload } from '..'
import { I_ExportImageContent, I_TableDatas } from '../types'
import { IExcelData, IExcelImgStyleOptions, IExcelOptions, IExcelTableOptions, TExcelData } from './Excel'

// class
export class ToExcel {
  
  private DATA: TExcelData = []
  private row = 0
  private Options: IExcelOptions = {
    title: '',
    personal: '',
    TitleFontSize: 16,
    personnelFontSize: 12,
    exportName: '',
    fontSize: 10,
    titleHeight: 450,
    stationName: ''
  }
  // 行高
  private  RH = 300
  constructor(options: IExcelOptions) {
    const page = this.Options
    copyValueFromObject(page, options)
    // 标题
    this.addDataPacks([0, 0], [0, 25], this.Options.title, { cell: true, blod: true, size: this.Options.TitleFontSize }, this.Options.titleHeight)
    this.row++
    this.addRow(['监测站', this.Options.stationName, '设备', '', '监测人', this.Options.personal], {
      blod: true,
      size: this.Options.personnelFontSize,
      row: 0
    })
  }
  private addDataPacks = (start: [number, number], end: [number, number], val: string | Array<string>, options: any = {}, h?: number) => {
    const type = typeof val !== 'string'
    const page: any = {
      excelStartLocation: start,
      excelEndLocation: end,
      content: type ? val[val.length - 1] : val,
      isMergeCell: options.cell ?? false,
      isBlod: options.blod ?? false,
      isWarp: options.warp ?? true,
      fontSize: options.size ?? 10,
      type: type ? 1 : 0
    }
    if (h) page.rowHeight = h
    this.DATA.push(page)
  }
  addRow = (datas: Array<string>, options: any = {}) => {
    this.nextTick(() => {
      const Options = this.initOptions('Table')
      Object.keys(Options).forEach((key) => {
        Options[key] = options[key] ?? Options[key]
      })
      datas.forEach((e, i) => {
        this.addDataPacks([this.row, i], [this.row, i], e, Options, this.getBoxHeight(e, 1, Options.size))
      })
      return this
    }, options.row ?? 1)
  }

  addImage = (description: string, { url, width, height }: I_ExportImageContent, { row, options }: IExcelImgStyleOptions = {}) => {
    this.row += row ?? 1
    width = Math.round(width / 75)
    height = Math.round(height / 20)
    const base64 = url.split(',')
    this.addDataPacks([this.row, 0], [(this.row += height), width], base64)
    this.row++
    this.addDataPacks(
      [this.row, 0],
      [this.row, width],
      description,
      {
        ...options,
        cell: true
      },
      this.getBoxHeight(description, width, options?.size)
    )
    this.row++
    return this
  }
  addTable = (
    title: string,
    headers: Array<string>,
    data: Array<I_TableDatas>,
    { row, titleOptions, headersOptions }: IExcelTableOptions = { row: 1, titleOptions: {}, headersOptions: {} }
  ) => {
    this.nextTick(() => {
      const TitleOptions = this.initOptions('Title')
      copyValueFromObject(TitleOptions, titleOptions || {})
      this.addDataPacks([this.row, 0], [this.row, headers.length - 1], title, TitleOptions, this.getBoxHeight(title, headers.length) + 100)
      this.row++
      let headH = this.RH
      const HeaderOptions = this.initOptions('Table')
      copyValueFromObject(HeaderOptions, headersOptions || {})
      headers.forEach((e, i) => {
        headH = Math.max(headH, this.getBoxHeight(e, 1, HeaderOptions.size))
        this.addDataPacks([this.row, i], [this.row, i], e, HeaderOptions, headH)
      })

      data.forEach((e) => {
        this.row++
        let headB = this.RH
        if (!(e.contents instanceof Array)) e.contents = Object.values(e.contents)
        e.contents.forEach((str, i) => {
          const Options = this.initOptions('Table')
          copyValueFromObject(Options, e.options?.Excel || {})
          headB = Math.max(headB, this.getBoxHeight(str, 1, Options.size))

          this.addDataPacks([this.row, i], [this.row, i], str, Options, headB)
        })
      })
    }, row ?? 1)
    return this
  }
  /**
   * @description: 添加列表
   */
  addList = (title: string, datas: Array<string>, { row, titleOptions, options }: any = { row: 1, titleOptions: {}, options: {} }) => {
    this.nextTick(() => {
      const TitleOptions = this.initOptions('Title')
      copyValueFromObject(TitleOptions, titleOptions || {})
      this.addDataPacks([this.row, 0], [this.row, 5], title, TitleOptions, this.getBoxHeight(title, 6, TitleOptions.size) + 100)
      const Options = this.initOptions('Text')
      copyValueFromObject(Options, options || {})
      datas.map((e) => {
        this.row++
        this.addDataPacks([this.row, 0], [this.row, 5], e, Options, this.getBoxHeight(e, 6, Options.size))
      })
    }, row ?? 1)
    return this
  }

  /**
   * @description: 添加文本
   */
  addText = (title: string, data: string, { row, titleOptions, options }: any = { row: 1, titleOptions: {}, options: {} }) => {
    const TitleOptions = this.initOptions('Title')
    copyValueFromObject(TitleOptions, titleOptions || {})
    const Options = this.initOptions('Text')
    copyValueFromObject(Options, options || {})
    this.nextTick(() => {
      this.addDataPacks([this.row, 0], [this.row, 5], title, TitleOptions, this.getBoxHeight(title, 6, TitleOptions.size) + 150)
      this.row++
      this.addDataPacks([this.row, 0], [this.row, 5], data, Options, this.getBoxHeight(data, 6, Options!.size || 12))
    }, row ?? 1)
    return this
  }
  download = () => {
    this.nextTick(() => {
      ExportDownload('Excel',this.DATA , this.Options.exportName!)
    })
  }

  private getBoxHeight = (text: string, num = 1, size: number = 10) => {
    if (num < 1) num = 1
    const span = document.createElement('span')
    span.setAttribute('style', `position:absolute;font-size:${size}px;white-space:nowrap;opacity:0;top:0;z-index:-1;`)
    const n = [...text.matchAll(/\n/g)].length

    span.innerText = text
    document.body.appendChild(span)
    const w = span.getBoundingClientRect().width * (size < 12 ? 12 / size : 1)
    const rowHeight = Math.max(300, size * 25)
    const rowWidth = Math.max(70, w * 1.75)
    span.remove()
    return Math.ceil(Math.ceil(w / rowWidth) / num) * rowHeight + rowHeight * n
  }
  private initOptions = (type: 'Title' | 'Text' | 'Table'): any => {
    const options: any = {
      blod: type === 'Title',
      cell: type === 'Title' || type === 'Text',
      warp: true,
      size: type === 'Title' ? 12 : 10
    }
    return options
  }
  private nextTick = (fun: () => any, row?: number) => {
    const type = typeof row === 'number'
    if (type) this.row += row
    fun()
    if (type) this.row++
  }
}

