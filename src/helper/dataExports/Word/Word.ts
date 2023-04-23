/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-03-23 09:46:10
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-03-29 16:47:20
 * @FilePath: \zxi-pm360\src\tools\dataExport\Word\Word.ts
 * @Description: 
 */
export interface IWordData {
  data: Array<{
    tableData?: IWordTable
    textData?: IWordText
    imageData?: IWordImage
  }>
  description: TWordDescription
}
 interface WordData{
  data:Array<{
    tableData:{}
  }>
 }

export interface IWordTable {
  title: string
  tableRowCount: number
  tableColCount: number
  cells: Array<{
    startLocation: [number, number]
    endLocation: [number, number]
    isMerge: boolean
    content: string
    isBlod: boolean
    fontSize: number
  }>
}


export interface IWordText {
  title: string
  content: string
  contentSize: number
}

export interface IWordImage {
  imageDescription: string
  items: Array<{
    imageName: string
    content: string
    width: number
    height: number
  }>
}

export type TWordDescription = {
  stationName?: string
  personal?: string
  title?: string
  deviceName?: string
  functionName?: string
  exportName?:string
}
export interface IWordTable {
  title: string
  tableRowCount: number
  tableColCount: number
  cells: Array<{
    startLocation: [number, number]
    endLocation: [number, number]
    isMerge: boolean
    content: string
    isBlod: boolean
    fontSize: number
  }>
}

export interface IWordText {
  title: string
  content: string
  contentSize: number
}

export interface IWordImage {
  imageDescription: string
  items: Array<{
    imageName: string
    content: string
    width: number
    height: number
  }>
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