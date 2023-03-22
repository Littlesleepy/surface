/**
 * @description: 设备定位信息接口
 */
export interface IServerGPS {
  id: string
  isLocated: boolean
  latitude: number
  locationResult: string
  longitude: number
  mapName: string
  naCpFail: boolean
  speed: number
  trackAngle: number
}

/**
 * @description: 后端服务器状态信息接口
 */
export interface IServerStateInfo {
  netDownLoad: string
  netUpload: string
  driveAvailableSpace: string
  useMemory: string
  serverTime: string
  gpsLocation: IServerGPS
}