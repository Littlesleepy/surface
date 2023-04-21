export interface IPdfData {
  pdfSetting: IPdfSetting
  exportData: Array<IPdfExportData>
}
export interface IPdfOptionalSetting {
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

export interface IPdfSetting extends IPdfOptionalSetting {
  stationName: string
  personal: string
  title: string
  deviceName?: string
}
export interface IPdfExportData {
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
export interface IPdfOptions extends IPdfSetting {
  exportName?: string
  fontSize?: number
}
export interface IExportPdfOptions {
  fontSize?: number
}
export interface IPdfTabContentOptions {
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
export interface IPdfTableOptions extends IPdfTabContentOptions {
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
export interface ITableDatas {
  contents: { [key: string]: string } | string[]
  options?: ITableContentOptions
}
export interface ITableContentOptions {
  PDF?: IPdfTabContentOptions
  Word?: {
    isBlod: boolean
    fontSize: number
  }
  Excel?: {
    blod?: boolean
    warp?: boolean
    size?: number
  }
}
