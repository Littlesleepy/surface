/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 13:26:30
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-31 11:43:19
 * @FilePath: \zxi-pm360\src\tools\dataExport\Word\index.ts
 * @Description:
 */
import { copyValueFromObject, ExportDownload } from '..'
import { I_TableDatas } from '../types'
import { IWordData, TWordDescription } from './Word'

export class ToWord {
  private Data: IWordData = {
    data: [],
    description: {
      title: '',
      stationName: '',
      personal: '',
      deviceName: '',
      functionName: ''
    }
  }
  private FontSize = 12

  private exportName = ''

  private Pending: Array<Promise<void>> = []

  constructor(options: TWordDescription) {
    copyValueFromObject(this.Data.description, options)
    this.exportName = options.exportName ?? ''
  }
  addTable = (
    title: string,
    headers: string[],
    datas: Array<I_TableDatas>,
    options?: {
      fontSize?: number
      isBlod?: boolean
    }
  ) => {
    const cells: any[] = []
    // lie
    let tabCol = 1
    // hang
    let tabRow = 1
    // 表头
    headers.forEach((header, index) => {
      tabCol = Math.max(tabCol, index + 1)
      cells.push({
        startLocation: [0, index],
        endLocation: [0, index],
        isMerge: true,
        content: header,
        isBlod: options?.isBlod ?? true,
        fontSize: options?.fontSize ?? 12
      })
    })
    // 表格
    datas.forEach((row, rIndex) => {
      tabRow = Math.max(tabRow, rIndex + 2)
      if (!(row.contents instanceof Array)) row.contents = Object.values(row.contents)
      row.contents.forEach((item, cIndex) => {
        tabCol = Math.max(tabCol, cIndex + 1)
        cells.push({
          startLocation: [rIndex + 1, cIndex],
          endLocation: [rIndex + 1, cIndex],
          isMerge: true,
          content: item,
          isBlod: row.options?.Word?.isBlod ?? options?.isBlod ?? true,
          fontSize: row.options?.Word?.fontSize ?? options?.fontSize ?? 12
        })
      })
    })

    this.Data.data.push({
      tableData: {
        title,
        cells,
        tableColCount: tabCol,
        tableRowCount: tabRow
      }
    })
  }
  addImage = (
    imageDescription: string,
    { url, width, height }: { url: string; width: number; height: number },
    { imageName }: { imageName?: string } = {}
  ) => {
    
    const scale = width > 550 ? 550 / width : 1
    width = (width * scale) >> 0
    height = (height * scale) >> 0
    
    this.Data.data.push({
      imageData: {
        imageDescription,
        items: [
          {
            content: url,
            imageName: imageName ?? '',
            width,
            height
          }
        ]
      }
    })
  }
  addText = (title: string, data: string, size = 12) => {
    this.Data.data.push({
      textData: {
        title,
        content: data,
        contentSize: size
      }
    })
  }

  download = () => {
    ExportDownload('Word', this.Data, this.exportName)
  }
}
