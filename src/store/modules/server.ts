/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-10-13 10:28:53
 * @FilePath: \zxi-device\src\store\modules\server.ts
 * @Description: 
 */
import { IServerStateInfo } from '@/types'
import { defineStore } from 'pinia'

export const useServerStore = defineStore('server', {
  state: () => ({
    /**
     * @description: 传递监测长连接数据
     */
    s_serverReceiveData: {
      header: '',
      data: null as any
    },
    /**
     * @description: 传递服务器状态数据
     */
    s_serverStateInfo: {
      netDownLoad: '',
      netUpload: '',
      driveAvailableSpace: '',
      useMemory: '',
      serverTime: '',
      gpsLocation: {
        id: '',
        isLocated: false,
        latitude: 0,
        locationResult: '',
        longitude: 0,
        mapName: '',
        naCpFail: false,
        speed: 0,
        trackAngle: 0
      }
    } as IServerStateInfo
  }),
  actions: {
    reset () {
      this.s_serverReceiveData = {
        header: '',
        data: null
      }
    },
    m_serverReceiveData (value) {
      this.s_serverReceiveData = value
    }
  }
})