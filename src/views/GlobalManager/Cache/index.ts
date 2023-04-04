/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-30 11:00:41
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 16:21:48
 * @FilePath: \zxi-device\src\views\GlobalManager\Cache\index.ts
 * @Description: 
 */
import { IWorkMode } from '@/components/BaseRealTimeFrame'
export interface IParamsTemplate {
  functionKey: string
  name: string
  form: any
  viceForm: any
  viceElements: Array<any>
  workMode: IWorkMode | undefined
}