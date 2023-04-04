/**
 * @description: 后端频谱数据接口
 */
export interface IServerAudioData {
  audioData: Uint8Array
  sampleRate: number
  channel: number
  bits: number
}