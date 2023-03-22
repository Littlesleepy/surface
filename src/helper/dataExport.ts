/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2022-11-30 16:09:09
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-02-23 10:58:26
 * @FilePath: \zxi-device\src\helper\dataExport.ts
 * @Description:
 */
import { Axios } from '@/server'
import { localStorageKey } from '@/storage'
import domtoimage from 'dom-to-image-more'
import { ref } from 'vue'
import { Sundry } from './sundry'

const LOADING_TEXT = '正在导出...'
export enum EExportDataType {
  PDF = 'PDF',
  Excel = 'Excel'
}
// ************************************************************PDF************************************************************
// ************************************************************PDF************************************************************
// ************************************************************PDF************************************************************
export interface IPdfData {
  pdfSetting: IPdfSetting
  exportData: Array<IPdfExportData>
}
interface IPdfOptionalSetting {
  watermark?: string
  isCustomHome?: boolean
  no?: string
  title2?: string
  companyName?: string
  lookUpText?: string
  text?: string
  department?: string
  signer?: string
  subjectHeading?: string
  secretLevel?: string
  slowLevel?: string
  functionName?: string
}
interface IPdfSetting extends IPdfOptionalSetting {
  stationName: string
  personal: string
  title: string
  deviceName?: string
}
interface IPdfExportData {
  tableData?: {
    title: string
    tableHeads: Array<string>
    // tableHeadFontFamily?:string
    tableHeadFontSize: number
    tableRowCount: number
    tableColumCount: number
    rowHeight: number
    tableDatas: Array<{
      contents: Array<string>
      // fontFamily?:string
      fontSize: number
      fontStyle: string
    }>
    tableColWidths: Array<number>
  }
  textData?: {
    title: string
    content: string
    contentSize: number
  }
  ImageData?: {
    description: string
    descriptionFontSize: number
    content: string
  }
}
interface IPdfOptions extends IPdfSetting {
  exportName?: string
  fontSize?: number
}
interface IExportPdfOptions {
  fontSize?: number
}
interface IPdfTabContentOptions {
  /**
   * @description: 字体大小
   */
  fontSize?: number
  /**
   * @description: 字体
   */
  // fontFamily?:string
  /**
   * @description: 字体样式
   */
  fontStyle?: string
}
interface IPdfTableOptions extends IPdfTabContentOptions {
  /**
   * @description: 表头字体大小
   */
  tableHeadFontSize?: number
  /**
   * @description: 表头字体
   */
  // tableHeadFontFamily?:string
  /**
   * @description: 表格每列对应列宽 -1为自动
   */
  tableColWidths?: Array<number>
}

// class
export class ToPdf {
  private DATA: IPdfData = {
    pdfSetting: {
      stationName: '',
      personal: '',
      title: '',
      deviceName: getDeviceName() ?? '',
      functionName: '',
      isCustomHome: false,
      watermark: '',
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
    },
    exportData: []
  }
  private FontSize = 9
  private exportName = ''
  constructor(options: IPdfOptions) {
    const page = this.DATA.pdfSetting
    Object.keys(page).forEach((key) => {
      page[key] = options[key] ?? page[key]
    })
    this.FontSize = options.fontSize || 9
    this.exportName = options.exportName || ''
  }
  addTable = (title: string, tableHeads: string[], datas: Array<ITableDatas>, options: IPdfTableOptions = {}) => {
    const titleSize = options.tableHeadFontSize ?? this.FontSize
    const Size = options.fontSize ?? this.FontSize
    const RH = Math.max(titleSize + 2, Size + 2, 25)

    let maxLen = 0
    const tableDatas = datas.map((e) => {
      if (!(e.contents instanceof Array)) e.contents = Object.values(e.contents)
      // tableColWidths.push(e.options?.PDF?.tableColWidth||-1)

      maxLen = Math.max(e.contents.length, maxLen)
      return {
        contents: e.contents,
        // fontFamily:e.options?.PDF?.fontFamily??'SIMHEI',
        fontSize: e.options?.PDF?.fontSize ?? Size,
        fontStyle: e.options?.PDF?.fontStyle ?? 'Regular'
      }
    })
    const tableColWidths: Array<number> = Array(maxLen)
      .fill(-1)
      .map((e, i) => (options.tableColWidths ? options.tableColWidths[i] : -1))

    this.DATA.exportData.push({
      tableData: {
        title,
        tableHeads,
        // tableHeadFontFamily:options.tableHeadFontFamily??'SIMHEI',
        tableHeadFontSize: titleSize,
        tableRowCount: datas.length + 1,
        tableColumCount: tableHeads.length,
        rowHeight: RH,
        tableDatas,
        tableColWidths: tableColWidths
      }
    })
    return this
  }
  addText = (title: string, content: string, size?: number) => {
    this.DATA.exportData.push({
      textData: {
        title,
        content,
        contentSize: size ?? this.FontSize
      }
    })
    return this
  }
  addImage = (description: string, url: string, size?: number) => {
    const base = url.split(',')
    const content = base[base.length - 1]
    this.DATA.exportData.push({
      ImageData: {
        description,
        descriptionFontSize: size ?? this.FontSize,
        content
      }
    })
    return this
  }
  download = () => {
    ExportDownload(this.DATA, EExportDataType.PDF, this.exportName)
  }
}

// ************************************************************Excel************************************************************
// ************************************************************Excel************************************************************
// ************************************************************Excel************************************************************
export interface IExcelData {
  /**
   * @description: 数据在表格中位置的开始行列
   */
  excelStartLocation: [number, number]
  /**
   * @description: 数据在表格结束的位置
   */
  excelEndLocation: [number, number]
  /**
   * @description: 是否合并单元格
   */
  isMergeCell: boolean
  /**
   * @description: 内容 如果为图片 则为Base64字符串
   */
  content: string
  /**
   * @description: 内容是否加粗 如果为图片则属性无效
   */
  isBlod: boolean
  /**
   * @description: 单元格内容是否自动换行
   */
  isWarp: boolean
  /**
   * @description: 字体大小
   */
  fontSize: number
  /**
   * @description: 单元格行高 在数据类型为图片时无用 取值为 字符数*200 如200为 1个字符高度
   */
  rowHeight?: number
  /**
   * @description:0-字符串 1-base64图片
   */
  type: 0 | 1
}
interface IExcelOptionalOptions {
  TitleFontSize?: number

  personnelFontSize?: number
  /**
   * @description: 行高
   */
  titleHeight?: number
  /**
   * @description: 全局字体大小
   */
  fontSize?: number
}
interface IExcelOptions extends IExcelOptionalOptions {
  /**
   * @description: 标题
   */
  title: string
  /**
   * @description: 监测人
   */
  personal: string
  /**
   * @description: 导出的文件名
   */
  exportName?: string
  /**
   * @description: 监测站
   */
  stationName: string
}
export interface IExcelTabContentOptions {
  /**
   * @description: 是否加粗
   */
  blod?: boolean
  /**
   * @description: 允许换行
   */
  warp?: boolean
  /**
   * @description: 字体大小
   */
  size?: number
}
interface IExcelCellPacksOptions {
  /**
   * @description: 是否加粗
   */
  blod?: boolean
  /**
   * @description: 允许换行
   */
  warp?: boolean
  /**
   * @description: 字体大小
   */
  size?: number
}
interface IExcelRowPacksOptions extends IExcelCellPacksOptions {
  /**
   * @description: 间隔的格数 默认为1
   */
  row?: number
}
interface IExcelPacksOptions extends IExcelCellPacksOptions {
  /**
   * @description: 是否合并单元格
   */
  cell?: boolean
}
interface IExcelImgStyleOptions {
  row?: number
  options?: IExcelRowPacksOptions
}
interface IExcelTableOptions {
  /**
   * @description: 间隔格数
   */
  row?: number
  /**
   * @description: 标题配置
   */
  titleOptions?: IExcelCellPacksOptions
  /**
   * @description: 表头配置
   */
  headersOptions?: IExcelRowPacksOptions
}
interface IExcelListOptions {
  row?: number
  titleOptions?: IExcelCellPacksOptions
  options?: IExcelCellPacksOptions
}
const RH = 300
// class
export class ToExcel {
  private DATA: Array<IExcelData> = []
  private row = 0
  private Pending: Array<Promise<void>> = []
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
  constructor(options: IExcelOptions) {
    const page = this.Options
    Object.keys(page).forEach((key) => {
      page[key] = options[key] ?? page[key]
    })
    // 标题
    this.addDataPacks([0, 0], [0, 25], this.Options.title, { cell: true, blod: true, size: this.Options.TitleFontSize }, this.Options.titleHeight)
    this.row++
    this.addRow(['监测站', this.Options.stationName, '设备', getDeviceName() ?? '', '监测人', this.Options.personal], {
      blod: true,
      size: this.Options.personnelFontSize,
      row: 0
    })
  }
  private addDataPacks = (
    start: [number, number],
    end: [number, number],
    val: string | Array<string>,
    options: IExcelPacksOptions = {},
    h?: number
  ) => {
    const type = typeof val !== 'string'
    const page: IExcelData = {
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
  addRow = (datas: Array<string>, options: IExcelRowPacksOptions = {}) => {
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

  addImage = (description: string, url: string, { row, options }: IExcelImgStyleOptions = {}) => {
    const img = new Image()
    img.crossOrigin = ''
    img.src = url
    this.Pending.push(
      new Promise((res) => {
        img.onload = () => {
          this.row += row ?? 1
          const width = Math.round(img.width / 75)
          const height = Math.round(img.height / 20)
          const base64 = url.split(',')
          this.addDataPacks([this.row, 0], [(this.row += height), width], base64)
          img.remove()
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
          res()
        }
      })
    )
    return this
  }
  addTable = (
    title: string,
    headers: Array<string>,
    data: Array<ITableDatas>,
    { row, titleOptions, headersOptions }: IExcelTableOptions = { row: 1, titleOptions: {}, headersOptions: {} }
  ) => {
    this.nextTick(() => {
      const TitleOptions = this.initOptions('Title')
      copyValueFromObject(TitleOptions, titleOptions || {})
      this.addDataPacks([this.row, 0], [this.row, headers.length - 1], title, TitleOptions, this.getBoxHeight(title, headers.length) + 100)
      this.row++
      let headH = RH
      const HeaderOptions = this.initOptions('Table')
      copyValueFromObject(HeaderOptions, headersOptions || {})
      headers.forEach((e, i) => {
        headH = Math.max(headH, this.getBoxHeight(e, 1, HeaderOptions.size))
        this.addDataPacks([this.row, i], [this.row, i], e, HeaderOptions, headH)
      })

      data.forEach((e) => {
        this.row++
        let headB = RH
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
  addList = (title: string, datas: Array<string>, { row, titleOptions, options }: IExcelListOptions = { row: 1, titleOptions: {}, options: {} }) => {
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
  addText = (title: string, data: string, { row, titleOptions, options }: IExcelListOptions = { row: 1, titleOptions: {}, options: {} }) => {
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
      ExportDownload(this.DATA, EExportDataType.Excel, this.Options.exportName!)
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
  private initOptions = (type: 'Title' | 'Text' | 'Table'): IExcelPacksOptions => {
    const options: IExcelPacksOptions = {
      blod: type === 'Title',
      cell: type === 'Title' || type === 'Text',
      warp: true,
      size: type === 'Title' ? 12 : 10
    }
    return options
  }
  private nextTick = (fun: () => any, row?: number) => {
    Promise.all(this.Pending).then(() => {
      const type = typeof row === 'number'
      if (type) this.row += row
      fun()
      if (type) this.row++
    })
  }
}

// ********************************************************************************All********************************************************************************
// ********************************************************************************All********************************************************************************
// ********************************************************************************All********************************************************************************
export interface ExportOptions {
  type: EExportDataType
  /**
   * @description:标题
   */
  title: string
  /**
   * @description:监测人
   */
  personal: string
  /**
   * @description:站点名称
   */
  stationName: string
  /**
   * @description:功能名称
   */
  exportName?: string
  /**
   * @description:水印
   */
  watermark: string
  /**
   * @description:是否自定义首页
   */
  isCustomHome: boolean
  /**
   * @description:编号
   */
  no?: string
  /**
   * @description:标题2
   */
  title2?: string
  /**
   * @description:公司名称
   */
  companyName?: string
  /**
   * @description:抬头
   */
  lookUpText?: string
  /**
   * @description:正文
   */
  text?: string
  /**
   * @description:部门
   */
  department?: string
  /**
   * @description:签发人
   */
  signer?: string
  /**
   * @description:主题词
   */
  subjectHeading?: string
  /**
   * @description:密级
   */
  secretLevel?: string
  /**
   * @description:缓级
   */
  slowLevel?: string
  /**
   * @description:所属功能
   */
  functionName?: string
  /**
   * @description:Excel配置
   */
  Excel?: IExcelOptionalOptions
  /**
   * @description:PDF配置
   */
  PDF?: IExportPdfOptions
}

export enum EExportType {
  Text = 'Text',
  Image = 'Image',
  Table = 'Table',
  Row = 'Row',
  List = 'List'
}
export interface IExportData {
  type: EExportType
  page: ITableType | ITextType
}
interface ITableType {
  title: string
  headers: Array<string>
  contents: Array<ITableDatas>
  options?: ITableOptions | IImageOptions | ITextOptions
}
interface ITextType {
  title: string
  content: string
  options?: ITableOptions | IImageOptions | ITextOptions
}
export interface ITableDatas {
  contents: { [key: string]: string } | string[]
  options?: ITableContentOptions
}
// test
export interface IListDatas {
  content: string
  options: IImageOptions
}
interface ITableOptions {
  PDF?: IPdfTableOptions
  Excel?: IExcelTableOptions
}
interface IImageOptions {
  PDF?: {
    contentSize: number
  }
  Excel?: IExcelImgStyleOptions
}
interface ITextOptions {
  PDF?: {
    contentSize: number
  }
  Excel?: IExcelListOptions
}

interface ITableContentOptions {
  PDF?: IPdfTabContentOptions
  Excel?: IExcelTabContentOptions
}
interface IDoms {
  title: string
  dom: Element
  index: number
  options?: IImageOptions
}
export class ToExport {
  static DATA: Map<number, IExportData> = new Map()
  private static Pending: Promise<void>[] = []
  static DOM: Map<number, IDoms> = new Map()
  /**
   * @description: 导出前回调
   * @return {*}
   */
  static beforExport = new Map<string, () => void>()
  /**
   * @description: 配置导出组件的可导出文件类型
   */
  static types = ref<Array<EExportDataType>>([EExportDataType.Excel, EExportDataType.PDF])
  private static Options: ExportOptions = {
    type: EExportDataType.Excel,
    title: '',
    personal: '',
    stationName: '',
    exportName: '',
    watermark: '',
    isCustomHome: false,
    functionName: '',
    no: '',
    title2: '',
    companyName: '',
    lookUpText: '',
    text: '',
    department: '',
    signer: '',
    subjectHeading: '',
    secretLevel: '',
    slowLevel: '',
    PDF: {
      fontSize: 9
    },
    Excel: {
      TitleFontSize: 16,
      fontSize: 10,
      personnelFontSize: 12,
      titleHeight: 450
    }
  }
  /**
   * @description:添加配置
   */
  static addOptions(options: ExportOptions) {
    copyValueFromObject(ToExport.Options, options)
  }
  /**
   * @description:修改PDF默认配置
   */
  static setPdfOptions(oprions: IExportPdfOptions) {
    copyValueFromObject(ToExport.Options, { PDF: oprions })
  }
  /**
   * @description:修改Excel默认配置
   */
  static setExcelOptions(oprions: IExcelOptionalOptions) {
    copyValueFromObject(ToExport.Options, { Excel: oprions })
  }
  /**
   * @description:添加一段描述
   */
  static addText = (title: string, str: string, index: number, options?: ITextOptions) => {
    const data: IExportData = {
      type: EExportType.Text,
      page: {
        title,
        content: str,
        options
      }
    }
    ToExport.indexPush(index, data)
    return this
  }

  /**
   * @description:添加一张图片
   */
  static addDom = (title: string, dom: Element, index: number, options?: IImageOptions) => {
    ToExport.DOM.set(index, {
      title,
      dom,
      index,
      options
    })
    return this
  }
  /**
   * @description:添加一张图片
   */
  static addImage = (title: string, url: string, index: number, options?: IImageOptions) => {
    const data: IExportData = {
      type: EExportType.Image,
      page: {
        title,
        content: url,
        options
      }
    }
    ToExport.indexPush(index, data)
    return this
  }
  /**
   * @description:添加一个表格
   */
  static addTable = (title: string, headers: string[], datas: Array<ITableDatas>, index: number, options?: ITableOptions) => {
    const data: IExportData = {
      type: EExportType.Table,
      page: {
        title,
        headers,
        contents: datas,
        options
      }
    }
    ToExport.indexPush(index, data)
    return this
  }
  private static indexPush = (index: number, data: IExportData) => {
    ToExport.DATA.set(index, data)
  }
  /**
   * @description:移除一个dom/删除一个表格/描述/图片
   */
  static delDom = (index: number) => {
    ToExport.DOM.delete(index)
    ToExport.DATA.delete(index)
    return this
  }
  /**
   * @description:删除一个表格/描述/图片
   */
  static delData = (index: number) => {
    ToExport.DOM.delete(index)
    ToExport.DATA.delete(index)
    return this
  }
  /**
   * @description:重置数据
   */
  static resetData = (dels?: Array<'DATA' | 'DOM' | 'beforExport'>) => {
    if (dels) {
      dels.forEach((key) => {
        switch (key) {
        case 'DATA':
          ToExport.DATA.clear()
          break
        case 'DOM':
          ToExport.DOM.clear()
          break
        case 'beforExport':
          ToExport.beforExport.clear()
          break
        }
      })
    } else {
      ToExport.DATA.clear()
      ToExport.Pending = []
      ToExport.DOM.clear()
      ToExport.beforExport.clear()
    }
    ToExport.Pending = []
  }

  /**
   * @description:下载
   */
  static download = () => {
    for (const [, fun] of ToExport.beforExport) {
      fun()
    }
    for (const [, iterator] of ToExport.DOM) {
      const { index, title, dom, options } = iterator
      ToExport.Pending[index] = new Promise((res) => {
        domtoimage
          .toPng(dom)
          .then((url) => {
            const data = {
              type: EExportType.Image,
              page: {
                title,
                content: url,
                options
              }
            }
            ToExport.indexPush(index, data)
            res()
          })
          .catch((err) => {
            console.log(err)
          })
      })
    }

    Promise.all(ToExport.Pending).then(() => {
      const sortData = Array.from(ToExport.DATA).sort((a, b) => a[0] - b[0])
      if (ToExport.Options.type === 'Excel') {
        const EX = new ToExcel({
          title: this.Options.title,
          personal: this.Options.personal,
          exportName: this.Options.exportName,
          stationName: this.Options.stationName,
          ...this.Options.Excel
        })

        for (const [, e] of sortData) {
          if (e.type === 'Table') {
            const data = e.page as ITableType
            const options = data.options as ITableOptions
            EX.addTable(data.title, data.headers, data.contents, options?.Excel)
          } else if (e.type === 'Image') {
            const data = e.page as ITextType
            const options = data.options as IImageOptions
            EX.addImage(data.title, data.content, options?.Excel)
          } else if (e.type === 'Text') {
            const data = e.page as ITextType
            const options = data.options as ITextOptions
            EX.addText(data.title, data.content, options?.Excel)
          }
        }

        EX.download()
      } else if (ToExport.Options.type === 'PDF') {
        const PD = new ToPdf({
          title: this.Options.title,
          personal: this.Options.personal,
          stationName: this.Options.stationName,
          exportName: this.Options.exportName,
          watermark: this.Options.watermark,
          isCustomHome: this.Options.isCustomHome,
          functionName: this.Options.functionName,
          no: this.Options.no,
          title2: this.Options.title2,
          companyName: this.Options.companyName,
          lookUpText: this.Options.lookUpText,
          text: this.Options.text,
          department: this.Options.department,
          signer: this.Options.signer,
          subjectHeading: this.Options.subjectHeading,
          secretLevel: this.Options.secretLevel,
          slowLevel: this.Options.slowLevel,
          ...this.Options.PDF!
        })

        for (const [, e] of sortData) {
          if (e.type === 'Table') {
            const data = e.page as ITableType
            const options = data.options as ITableOptions
            PD.addTable(data.title, data.headers, data.contents, options?.PDF)
          } else {
            const data = e.page as ITextType
            const options = data.options as IImageOptions
            switch (e.type) {
            case 'Image':
              PD.addImage(data.title, data.content, options?.PDF?.contentSize)
              break
            case 'Text':
              PD.addText(data.title, data.content, options?.PDF?.contentSize)
              break
            }
          }
        }

        PD.download()
      }
    })
  }
}
// ************************************************************************
// ************************************************************************
const downloadOptions = {
  PDF: {
    url: '/api/DataExport/exportToPdf',
    blobType: 'application/pdf',
    extendName: 'pdf'
  },
  Excel: {
    url: '/api/DataExport/exportToExcel',
    blobType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extendName: 'xlsx'
  }
}
/**
 * @description:下载
 */
export function ExportDownload (data: IPdfData | Array<IExcelData>, dataType: EExportDataType, name: string) {
  const { url, blobType, extendName } = downloadOptions[dataType]
  const loading = Sundry.createMarker(LOADING_TEXT)
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
      a.download = `${name ? name : extendName}\n${getTimeStr()}.${extendName}`
      a.click()
      a.remove()
      loading.close()
    })
    .catch(() => {
      loading.close()
    })
}

function getTimeStr () {
  const date = new Date(),
    y = date.getFullYear(),
    o = date.getMonth() + 1,
    d = date.getDate(),
    h = date.getHours(),
    m = date.getMinutes(),
    s = date.getSeconds()
  return `${y}-${o}-${d}\n${h}.${m}.${s}`
}
function getDeviceName () {
  const deviceName: string | undefined = JSON.parse(localStorage.getItem(localStorageKey.KEY_DEVICEINFO)!)?.deviceName
  return deviceName
}

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
