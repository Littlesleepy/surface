/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-06 17:04:25
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-21 11:27:35
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\server\SignalR.ts
 * @Description: 
 */

import { useServerStore } from '@/store'
import * as signalR from '@microsoft/signalr'
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import { computed, effectScope, onBeforeUnmount, watch, WatchStopHandle } from 'vue'
// import { LocationControl, MarkerExtension } from 'mcharts/index'
// import maplibregl from 'maplibre-gl'
import stationSuccess from 'imgs/stationSuccess.png'
import stationFail from 'imgs/stationFail.png'

export const Hub = {
  taskStatusHub: '/taskStatusHub',
  dataHub: '/dataHub',
  replayDataStreamHub: '/replayDataStreamHub'
}

export { HubConnection } from '@microsoft/signalr'

export function SignalR (options: { hub: string }) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(Config.baseUrl + options.hub)
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .withHubProtocol(new MessagePackHubProtocol())
    .build()
  return connection
}

export type ReceiveDataOptions = Map<string, {
  /**
   * @description: 当前键是否可清除，仅当值为false不可清除
   */
  canDelete?: boolean
  /**
   * @description: 当前键的数据回调函数
   */
  control?: (data: any) => void
  /**
   * @description: 当前键的下一级监听
   */
  children?: ReceiveDataOptions
}>

interface IManager {
  /**
   * @description: 当前键是否可清除，仅当值为false不可清除
   */
   canDelete?: boolean
   /**
    * @description: 当前键的数据回调函数
    */
   controls?: Array<(data: any) => void>
   /**
    * @description: 当前键的下一级监听
    */
   children?: ReceiveDataManager
}

type ReceiveDataManager = Map<string, IManager>

export class ReceiveData {
  static manager: ReceiveDataManager = new Map()

  private static watchStop: WatchStopHandle | null = null

  private static setManager (input: ReceiveDataOptions, set: ReceiveDataManager) {
    for (const [keyIn, valueIn] of input) {
      if (!set.has(keyIn)) {
        const obj: IManager = {}
        if (valueIn.canDelete !== undefined) {
          obj.canDelete = valueIn.canDelete
        }

        if (valueIn.control !== undefined) {
          obj.controls = [valueIn.control]
        }
        const setManager = new Map()
        if (valueIn.children !== undefined) {
          ReceiveData.setManager(valueIn.children, setManager)
          obj.children = setManager
        }
        set.set(keyIn, obj)
      } else {
        const obj = set.get(keyIn)!
        if (valueIn.canDelete !== undefined) {
          obj.canDelete = valueIn.canDelete
        }

        if (valueIn.control !== undefined) {
          if (obj.controls === undefined) {
            obj.controls = [valueIn.control]
          } else {
            obj.controls.push(valueIn.control)
          }
        }

        if (valueIn.children !== undefined) {
          if (obj.children !== undefined) {
            ReceiveData.setManager(valueIn.children, obj.children)
          } else {
            const setManager = new Map()
            ReceiveData.setManager(valueIn.children, setManager)
            obj.children = setManager
          }
        }

      }
    }
  }

  /**
   * @description: 为接收数据配置key和操作逻辑
   * @param {ReceiveDataOptions} options 监听数据配置项
   */

  static add (options: ReceiveDataOptions) {
    ReceiveData.setManager(options, ReceiveData.manager)
  }

  /**
   * @description: 激发数据接收监听
   * @param {Store} store 状态管理器
   */

  static run () {
    const store = useServerStore()
    // 只能监听一次
    if (ReceiveData.watchStop !== null) {
      console.warn('ReceiveData.run重复调用')
      return
    }
    ReceiveData.watchStop = watch(() => store.s_serverReceiveData, ({ header, data }) => {
      if (header === '') return
      // 遍历自定义配置通过回调函数传出数据
      if (ReceiveData.manager.has(header)) {
        const { controls, children } = ReceiveData.manager.get(header)!
        // 如果第一层有回调函数则调用
        if (controls !== undefined) {
          for (let i = 0, len = controls.length; i < len; i++) {
            const control = controls[i]
            control(data)
          }
        }
        // 如果有子节点则遍历
        if (children !== undefined) {
          for (let i = 0, len = data.length; i < len; i++) {
            const element = data[i]
            if (children.has(element.key)) {
              const child = children.get(element.key)!
              if (child.controls !== undefined) {
                for (let i = 0, len = child.controls.length; i < len; i++) {
                  const control = child.controls[i]
                  control(element.value)
                }
              }
            }
          }
        }
      }
    })
    // 组件卸载时停止监听
    onBeforeUnmount(() => {
      if (ReceiveData.watchStop !== null) {
        ReceiveData.watchStop()
        ReceiveData.watchStop = null
        ReceiveData.clear()
      }
    })
  }

  private static clear () {
    const deleteItem: Set<string> = new Set()
    // 先统计要被剔除的项
    for (const [key1, value1] of ReceiveData.manager) {
      // 如果子节点存在不能删除项，则父节点保留
      if (value1.children !== undefined) {
        let canDelete = true
        loop2:
        for (const [, value2] of value1.children) {
          if (value2.canDelete === false) canDelete = false
          break loop2
        }
        // 不包含不可删除子节点并且自身未明确指出不可删除，则删除
        if (canDelete && value1.canDelete !== false) deleteItem.add(key1)
      } else {
        if (value1.canDelete !== false) {
          deleteItem.add(key1)
        }
      }
    }

    // 清除第一层
    for (const value of deleteItem) {
      ReceiveData.manager.delete(value)
    }
    // 清除第二层
    for (const [, value1] of ReceiveData.manager) {
      // 先统计清除项
      const deleteItem2: Set<string> = new Set()
      if (value1.children !== undefined) {
        for (const [key2, value2] of value1.children) {
          if (value2.canDelete !== false) {
            deleteItem2.add(key2)
          }
        }
        // 清除
        for (const key of deleteItem2) {
          value1.children.delete(key)
        }
      }
    }
  }

  static key = {
    /**
     * @description: 音频
     */
    AUDIO: 'AUDIO',
    /**
     * @description: 门限
     */
    SIGNALMARKINFO: 'SIGNALMARKINFO',
    /**
     * @description: 出错
     */
    ERROR: 'ERROR',
    /**
     * @description: 警告
     */
    WARNING: 'WARNING',
    /**
     * @description: 停止标志
     */
    AUTOSTOP: 'AUTOSTOP',
    /**
     * @description: 二级关键字
     */
    DATA: {
      /**
       * @description: 溢出
       */
      OVERFLOW: 'of',
      /**
       * @description: ITU
       */
      ITU: 'ITU',
      /**
       * @description: 模式识别
       */
      MODE: 'MODE',
      /**
       * @description: 亚音频解码
       */
      SUBAUDIODATA: 'SUBAUDIODATA',
      /**
       * @description: 频谱数据
       */
      SPECTRUMDATA: 'SPECTRUMDATA',
      /**
       * @description: gps定位
       */
      GPSLocation: 'GPSLocation',
      /**
       * @description: 数字语音解调/解码状态
       */
      LOGTEXTSTATE: 'LOGTEXTSTATE',
      /**
       * @description: 自动门限线
       */
      FREQUENCYHOPDATA: 'FREQUENCYHOPDATA',
      /**
       * @description: 原始IQ
       */
      IQDATA: 'IQDATA',
      /**
       * @description: 眼图
       */
      EYEPHASEDATA: 'EYEPHASEDATA',
      /**
       * @description: 判决前码流数据
       */
      BEFOREDECODESYMBOL: 'BEFOREDECODESYMBOL',
      /**
       * @description: 最终码流数据
       */
      AFTERDECODESYMBOL: 'AFTERDECODESYMBOL',
      /**
       * @description: 自动停止
       */
      OK: 'OK',
      /**
       * @description: 自动停止
       */
      RAWDATAOK: 'RAWDATAOK',
      /**
       * @description: 回放当前时间
       */
      REPLAYPROCESSTIME: 'REPLAYPROCESSTIME',
      /**
       * @description: 回放当前帧
       */
      POS: 'POS',
      /**
       * @description: 测向雷达图和电平数据
       */
      LQCB: 'LQCB'
    }
  }
}

/**
 * @description: 构造频谱数据
 * @param {object} data 输入的原始数据
 * @return {{input: Float32Array;frequency: number;sc: number;time: number;}}
 */
export function makeSpectrumData (data: { data: Array<number>, frequency: number, sc: number, time: string}) {
  return {
    data: new Float32Array(data.data),
    frequency: data.frequency,
    sc: data.sc,
    time: new Date(data.time).getTime()
  }
}

/**
 * @description: 构造测向雷达数据
 * @param {any} data 输入数据
 */
export function makeSingleBearing (data: any) {
  if ('time' in data) {
    data.time = new Date(data.time)
  } else {
    data.time = new Date()
  }
  let bearing: Float32Array
  if (typeof data.bearing === 'number') {
    bearing = new Float32Array([data.bearing])
  } else {
    bearing = new Float32Array(data.bearing)
  }
  let quality: Float32Array
  if (typeof data.quality === 'number') {
    quality = new Float32Array([data.quality])
  } else {
    quality = new Float32Array(data.quality)
  }

  data.bearing = bearing
  data.quality = quality
  return data
}
/**
 * @description: 设置设备marker
 */
// export function setDeviceMarker (map: maplibregl.Map) {

//   const serverStore = useServerStore()

//   let deviceMarker: MarkerExtension | undefined

//   const devicePosition = computed(() => serverStore.s_serverStateInfo.gpsLocation)

//   const isLocated = computed(() => devicePosition.value.isLocated)

//   let mapLoad = false

//   map.on('load', () => {
//     mapLoad = true
//     setMarker()
//   })

//   const locationControl = new LocationControl()
//   locationControl.afterClick.add((map) => {
//     map.flyTo({
//       center: [devicePosition.value.longitude, devicePosition.value.latitude],
//       zoom: 14,
//       curve: 1.1,
//       speed: 2.5
//     })
//   })

//   function setMarker () {
//     const v = devicePosition.value
//     const position = new maplibregl.LngLat(v.longitude, v.latitude)
//     if (v.latitude !== 0 && v.longitude !== 0) {
//       if (deviceMarker === undefined) {
//         const v = devicePosition.value
//         const image = document.createElement('img')
//         image.src = v.isLocated ? stationSuccess : stationFail
//         image.style.cursor = 'pointer'

//         deviceMarker = new MarkerExtension({
//           element: image
//         }).setPosition(position).addTo(map)

//         deviceMarker.setLabel({
//           content: '设备',
//           offset: [0, -36]
//         })
//         map.panTo(position)
//       } else {
//         deviceMarker.setPosition([v.longitude, v.latitude])
//       }
//     }
//   }

//   const watch1 = watch(devicePosition, () => {
//     if (mapLoad) setMarker()
//   })

//   const watch2 = watch(isLocated, (v) => {
//     if (deviceMarker) {
//       const image = deviceMarker.getElement() as HTMLImageElement
//       image.src = v ? stationSuccess : stationFail
//     }
//   })

//   onBeforeUnmount(() => {
//     watch1()
//     watch2()
//   })

//   return {
//     deviceMarker,
//     devicePosition,
//     isLocated,
//     locationControl
//   }
// }
