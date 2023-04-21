import { TExcelData } from './Excel/Excel'
import { IPdfData } from './PDF/PDF'
import { IWordData } from './Word/Word'

/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 11:38:15
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-29 17:04:12
 * @FilePath: \zxi-pm360\src\tools\dataExport\types.ts
 * @Description:
 */
export interface I_TextOptions {
  PDF?: {
    contentSize?: number
  }
  Excel?: {
    row?: number
    blod?: boolean
    warp?: boolean
    size?: number
  }
  Word?: {
    contentSize?: number
  }
}
export interface I_ImageOptions {
  PDF?: {
    contentSize?: number
  }
  Excel?: {
    row?: number
    options?: {
      blod?: boolean
      warp?: boolean
      size?: number
      row?: number
    }
  }
  Word?: {
    imageName?: string
  }
}
export interface I_TableOptions {
  PDF?: {
    fontSize?: number
    fontStyle?: string
    tableHeadFontSize?: number
    tableColWidths?: Array<number>
  }
  Excel?: {
    row?: number
    titleOptions?: {
      blod?: boolean
      warp?: boolean
      size?: number
    }
    headersOptions?: {
      blod?: boolean
      warp?: boolean
      size?: number
      row?: number
    }
  }
  Word?: {
    fontSize?: number
    isBlod?: boolean
  }
}
export interface I_ExportImageContent {
  url: string
  width: number
  height: number
}
export interface I_TableDatas {
  contents: { [key: string]: string } | Array<string>
  options?: {
    PDF?: {
      fontSize?: number
      fontStyle?: string
    }
    Excel?: {
      blod?: boolean
      warp?: boolean
      size?: number
    }
    Word?: {
      isBlod?: boolean
      fontSize?: number
    }
  }
}
export enum E_ExportType {
  PDF = 'PDF',
  Excel = 'Excel',
  Word = 'Word'
}
export type T_ExportType = 'PDF' | 'Excel' | 'Word'

export enum E_ExportDataType {
  Text = 'Text',
  Image = 'Image',
  Table = 'Table'
}
export type T_ExportDataType = 'Text' | 'Image' | 'Table'

export interface I_TablePage {
  type: 'Table'
  page: {
    title: string
    headers: Array<string>
    contents: Array<I_TableDatas>
    options?: I_TableOptions
  }
}
export interface I_TextPage {
  type: 'Text'
  page: {
    title: string
    content: string
    options?: I_TextOptions | I_ImageOptions
  }
}

export interface I_ImagePage {
  type: 'Image'
  page: {
    title: string
    content: {
      url: string
      width: number
      height: number
    }
    dom?: Element
    options?: I_TextOptions | I_ImageOptions
  }
}

export type T_ExportDataPage = I_TablePage | I_TextPage | I_ImagePage

interface I_ExportPDFOptions {
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
   * @description:导出的文件名
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
}
interface I_ExportExcelOptions {
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
   * @description:导出的文件名
   */
  exportName?: string
}
interface I_ExportWordOptions {
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
   * @description:导出的文件名
   */
  exportName?: string
  /**
   * @description:所属功能
   */
  functionName: string
}

export type T_ExportOptions = I_ExportPDFOptions | I_ExportExcelOptions | I_ExportWordOptions

export const downloadOptions = {
  PDF: {
    url: '/api/DataExport/exportToPdf',
    blobType: 'application/pdf',
    extendName: 'pdf'
  },
  Excel: {
    url: '/api/DataExport/exportToExcel',
    blobType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extendName: 'xlsx'
  },
  Word: {
    url: '/api/DataExport/exportToWorld',
    blobType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extendName: 'docx'
  }
}

export type T_ExportData = IPdfData | TExcelData | IWordData
