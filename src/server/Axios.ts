/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-15 14:07:59
 * @FilePath: \zxi-device\src\server\Axios.ts
 * @Description: 
 */

import axios, { AxiosRequestConfig, Method } from 'axios'
import { localStorageKey } from 'storage/index'

export function Axios (options: AxiosRequestConfig, mockMethod?: Method) {
  const userToken = localStorage.getItem(localStorageKey.KEY_USER_TOKEN)
  const token = userToken === null ? null : JSON.parse(userToken)
  if (token !== null) {
    axios.defaults.headers.common['Authorization'] = 'bearer ' + token
  }
  // 修改默认正确或错误的判定规则
  const instance = axios.create({
    baseURL: Config.baseUrl,
    validateStatus: () => {
      return true
    }
  })

  if (mockMethod) { instance.defaults.method = mockMethod }
  // 响应拦截器
  instance.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      return Promise.reject(response)
    }
  }, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error)
  })
  return instance(options)
}