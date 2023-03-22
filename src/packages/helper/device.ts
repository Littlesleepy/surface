/**
 * @description: 设备帮助类
 */

export class Device {
  /**
  * @description: 返回前端输入带宽所对应的设备实际采样率
  * @param {number} bandwidthValue 前端输入带宽kHz
  * @return {number} 设备实际采样率kHz
  */

  static getSamplingRateByBandwidth (bandwidthValue: number): number {
    // 转换为 Hz 单位
    const valueHz = parseInt((bandwidthValue * 1000 + 0.1).toString())
    switch (valueHz) {
    case 100: return 0.15 // 100Hz
    case 200: return 0.25 // 200 Hz
    case 400: return 0.5 // 400 Hz
    case 600: return 0.78125 // 600 Hz
    case 800: return 1.0 // 800 Hz
    case 1000: return 1.25 // 1 kHz
    case 1200: return 1.5625 // 1.2 kHz
    case 1500: return 2.0 // 1.5 kHz
    case 2000: return 2.5 // 2 kHz
    case 2500: return 3.125 // 2.5 kHz
    case 3000: return 4.0 // 3 kHz
    case 4000: return 5.0 // 4 kHz
    case 5000: return 6.25 // 5 kHz
    case 6000: return 8.0 // 6 kHz
    case 8000: return 10.0 // 8 kHz
    case 9000: return 11.45 // 9 kHz
    case 10000: return 12.5 // 10 kHz
    case 12500: return 16.0 // 12.5 kHz
    case 15000: return 20.0 // 15 kHz
    case 20000: return 25.0 // 20 kHz
    case 25000: return 32.0 // 25 kHz
    case 30000: return 40.0 // 30 kHz
    case 40000: return 50.0 // 40 kHz
    case 50000: return 64.0 // 50 kHz
    case 60000: return 80.0 // 60 kHz
    case 80000: return 100.0 // 80 kHz
    case 100000: return 128.0 // 100 kHz
    case 125000: return 160.0 // 125 kHz
    case 150000: return 200.0 // 150 kHz
    case 200000: return 256.0 // 200 kHz
    case 250000: return 320.0 // 250 kHz
    case 300000: return 400.0 // 300 kHz
    case 400000: return 512.0 // 400 kHz
    case 500000: return 640.0 // 500 kHz
    case 600000: return 800.0 // 600 kHz
    case 800000: return 1024.0 // 800 kHz
    case 1000000: return 1280.0 // 1 MHz
    case 1250000: return 1600.0 // 1.25 MHz
    case 2000000: return 2560.0 // 2 MHz
    case 2500000: return 3200.0 // 2.5 MHz
    case 4000000: return 5120.0 // 4 MHz
    case 5000000: return 6400.0 // 5 MHz
    case 10000000: return 12800.0 // 10 MHz
    case 20000000: return 25600.0 // 20 MHz
    case 40000000: return 51200.0 // 40 MHz
    case 80000000: return 102400.0 // 80 MHz
    case 160000000: return 204800.0 // 160 MHz
    }
    return -1
  }
  /**
  * @description: 根据界面输入带宽查询采样点数
  * @param {number} bandwidth 界面带宽
  * @return {number} 采样点数
  */

  static getSpectrumPointsByBandwidth (bandwidth: number): number {
    const bw = parseInt((bandwidth * 10).toString())
    switch (bw) {
    case 1600000: return 1601
    case 800000: return 1601
    case 400000: return 1601
    case 200000: return 1601
    case 100000: return 1601
    case 50000: return 1601
    case 40000: return 1601
    case 25000: return 1601
    case 20000: return 1601
    case 12500: return 1601
    case 10000: return 1601
    case 8000: return 1601
    case 6000: return 1537
    case 5000: return 1601
    case 4000: return 1601
    case 3000: return 1537
    case 2500: return 1601
    case 2000: return 1601
    case 1500: return 1537
    case 1250: return 1601
    case 1000: return 1601
    case 800: return 1639
    case 600: return 1537
    case 500: return 1601
    case 400: return 1639
    case 300: return 1537
    case 250: return 1601
    case 200: return 1639
    case 150: return 1537
    case 125: return 1601
    case 100: return 1639
    case 90: return 1610
    case 80: return 1639
    case 60: return 1537
    case 50: return 1639
    case 40: return 1639
    case 30: return 1537
    case 25: return 1639
    case 20: return 1639
    case 15: return 1537
    case 12: return 1573
    case 10: return 1639
    case 8: return 1639
    case 6: return 1573
    }
    return 1601
  }
  /**
   * @description: 分辨率格式转换MHz=>kHz=>Hz
   * @param {number} step 分辨率MHz
   * @return {string} 转换后的分辨率带单位
   */  

  static unitFormatChangeForStep (step: number): string {
    if (step < 1 && step * 1000 >= 1) {
      return parseFloat((step * 1000).toFixed(6)) + 'kHz'
    }
    if (step * 1000 < 1) {
      return parseFloat((step * 1000000).toFixed(6)) + 'Hz'
    }
    return parseFloat(step.toFixed(6)) + 'MHz'
  }

  /**
  * @description: 信道分辨率列表计算
  * @param {number} sampling 真实采样率
  * @return {Array<string>} 信道分辨率列表
  */

  static channelResolutionLists (sampling: number): Array<string> {
    const value: Array<string> = []
    let start = 64
    for (let i = 0; start <= 16384; i++) {
      const m = sampling / start
      value[i] = m.toString()
      start *= 2
    }
    return value
  }
}