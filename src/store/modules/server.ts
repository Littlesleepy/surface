/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-12 14:08:43
 * @FilePath: \zxi-surface\src\store\modules\server.ts
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
    },
    m_serverStateInfo (info: IServerStateInfo) {
      this.s_serverStateInfo = info
    }
  }
})