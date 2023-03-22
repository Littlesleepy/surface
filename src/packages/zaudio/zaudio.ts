import MyWorker from './worker?worker&inline'

export class ZAudio {
  audioContext: AudioContext

  private worker = new MyWorker()

  private audioBufferPool: Array<AudioBuffer> = []

  private startTime: number = 0

  private stopInterVal: any

  private gainNode: GainNode | undefined

  private currGain: number | undefined

  private options?: {
    gain?: {
      value: number
    }
  }

  constructor (options?: {
    gain?: {
      value: number
    }
  }) {
    this.options = options

    this.audioContext = new AudioContext()

    if (options && options.gain) {
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      this.currGain = this.gainNode.gain.value + options.gain.value
      this.gainNode.gain.setValueAtTime(this.currGain, this.audioContext.currentTime)
    }

    this.worker.onmessage = (e) => {
      this.decodeAudioData(e.data)
    }
  }
  /**
   * @description: 更新options
   * @param {options}
   */  

  upDateOptions (options: {
    gain?: {
      value: number
    }
  }) {
    this.options = options

    if (this.options.gain && this.gainNode === undefined) {
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      this.currGain = this.gainNode.gain.value + this.options.gain.value
      this.gainNode.gain.setValueAtTime(this.currGain, this.audioContext.currentTime)
    }
  }
  /**
   * @description: 解码二进制数据
   * @param {ArrayBuffer} waveBuffer 数据
   * @return {*}
   */  
  decodeAudioData (waveBuffer: ArrayBuffer) {
    this.audioContext.decodeAudioData(waveBuffer)
      .then((audioBuffer) => {
        // 存入音频池
        this.audioBufferPool.push(audioBuffer)
      }).catch(() => {
        console.log('解码失败')
      })
  }
  /**
   * @description: 播放音频
   * @param {Array} data 音频数据
   * @param {number} samplate 采样率
   * @param {number} channel 声道数
   * @param {number} sampleSize 采样大小
   */  
  play (data: Uint8Array, samplate: number, channel: number, sampleSize: number) {
    if(data.length === 0) return
    this.worker.postMessage({ data, samplate, channel, sampleSize })
  }
  /**
   * @description: 激活播放器
   */  

  activate () {
    this.stopInterVal = setInterval(() => {
      if (this.audioBufferPool.length >= 1 && this.audioContext) {
        const currentTime = this.audioContext.currentTime
        const audioBuffer = this.audioBufferPool.shift()
        if (!audioBuffer) return
        // 创建播放节点
        const sourceNode = this.audioContext.createBufferSource()

        sourceNode.buffer = audioBuffer
        
        if (this.gainNode !== undefined) {
          sourceNode.connect(this.gainNode)
        } else {
          sourceNode.connect(this.audioContext.destination)
        }

        if (this.startTime === 0 || currentTime > this.startTime) this.startTime = currentTime

        sourceNode.start(this.startTime, 0, audioBuffer.duration)

        // 计算好下一次播放的时间点
        this.startTime += audioBuffer.duration
      }
    }, 10)
  }
  /**
   * @description: 释放资源
   */  

  dispose () {
    clearInterval(this.stopInterVal)
    this.audioBufferPool = []
    this.startTime = 0
  }
  
  /**
   * @description: 增益
   * @param {number} value 增益值
   * @param {number} endTime 增益相对于音频上下文当前时间的时间
   */  

  gainSetValueAtTime (value: number, endTime = 0) {
    if (this.gainNode && this.currGain) {
      this.currGain += value
      this.gainNode.gain.setValueAtTime(this.currGain, this.audioContext.currentTime + endTime)
    }
  }
}