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
export type TExcelData = Array<IExcelData>
export interface IExcelOptionalOptions {
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
export interface IExcelOptions extends IExcelOptionalOptions {
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
export interface IExcelCellPacksOptions {
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
export interface IExcelRowPacksOptions extends IExcelCellPacksOptions {
  /**
   * @description: 间隔的格数 默认为1
   */
  row?: number
}

export interface IExcelImgStyleOptions {
  row?: number
  options?: IExcelRowPacksOptions
}
export interface IExcelTableOptions {
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

export interface ITableDatas {
  contents: { [key: string]: string } | string[]
  options?: ITableContentOptions
}
export interface ITableContentOptions {
  Excel?: IExcelTabContentOptions
  Word?: {
    isBlod: boolean
    fontSize: number
  }
  PDF?: {
    fontSize?: number
    fontStyle?: string
  }
}
