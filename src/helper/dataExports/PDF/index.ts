/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 13:24:50
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-29 16:44:29
 * @FilePath: \zxi-pm360\src\tools\dataExport\PDF\index.ts
 * @Description: 
 */
/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 13:24:50
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-29 13:54:19
 * @FilePath: \zxi-pm360\src\tools\dataExport\PDF\index.ts
 * @Description:
 */
import { copyValueFromObject, ExportDownload } from '..'
import { I_TableDatas } from '../types'
import { IPdfData, IPdfOptions, IPdfTableOptions } from './PDF'

export class ToPdf {
  private DATA: IPdfData = {
    pdfSetting: {
      stationName: '',
      personal: '',
      title: '',
      deviceName: '',
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
      copyValueFromObject(page, options || {})
    })
    this.FontSize = options.fontSize || 9
    this.exportName = options.exportName || ''
    
  }
  addTable = (title: string, tableHeads: string[], datas: Array<I_TableDatas>, options: IPdfTableOptions = {}) => {
    const titleSize = options.tableHeadFontSize ?? this.FontSize
    const Size = options.fontSize ?? this.FontSize
    const RH = Math.max(titleSize + 2, Size + 2, 25)

    let maxLen = 0
    const tableDatas = datas.map((e) => {
      if (!(e.contents instanceof Array)) e.contents = Object.values(e.contents)

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
  addText = (title: string, content: string, {contentSize}: {contentSize?:number}={}) => {
    this.DATA.exportData.push({
      textData: {
        title,
        content,
        contentSize: contentSize ?? this.FontSize
      }
    })
    return this
  }
  addImage = (description: string, { url }: { url: string; width: number; height: number }, { contentSize }: { contentSize?: number } = {}) => {
    this.DATA.exportData.push({
      ImageData: {
        description,
        descriptionFontSize: contentSize ?? this.FontSize,
        content: url
      }
    })
    return this
  }
  download = () => {
    ExportDownload('PDF', this.DATA, this.exportName)
  }
}
