/*
 * @Author: shiershao
 * @Date: 2022-06-29 14:01:40
 * @LastEditTime: 2022-07-14 16:47:14
 * @Description: 
 * 
 */

onmessage = function (e) {
  const { data, samplate, channel, sampleSize } = e.data

  const waveBuffer = decodeWaveByArray(data, samplate, channel, sampleSize)

  postMessage(waveBuffer)
}

/**
 * @description: 从8位数组解码出可用于音频节点使用的数据
 * @param {Array} data 8位数组
 * @param {number} samplate 采样率
 * @param {number} channel 声道数
 * @param {number} sampleSize 量化位数
 * @return {AudioBuffer} AudioBuffer
 */  

function decodeWaveByArray (data, samplate, channel, sampleSize) {
  const bufferFromArray = new Uint8Array(data).buffer

  const biteLength = bufferFromArray.byteLength + 44
  
  const waveBuffer = new ArrayBuffer(biteLength)

  const waveView = new DataView(waveBuffer)

  let offset = 0
  // 采用小端节序
  const littleEndian = true

  // 添加头部
  // ChunkID 4bytes 'RIFF'标志符
  writeStringToBuffer(waveView, offset, 'RIFF')
  offset += 4
  // ChunkSize 4bytes 除去ChunkID与ChunkSize的剩余部分有多少字节数据
  waveView.setUint32(offset, biteLength - 8, littleEndian)
  offset += 4
  // Format 4bytes 'WAVE'
  writeStringToBuffer(waveView, offset, 'WAVE')
  offset += 4
  // Subchunk1ID 4bytes 'fmt '
  writeStringToBuffer(waveView, offset, 'fmt ')
  offset += 4
  // Subchunk1Size 4bytes 如果文件采用PCM编码，则该子块剩余字节数为16
  waveView.setUint32(offset, 16, littleEndian)
  offset += 4
  // AudioFormat 2bytes 如果文件采用PCM编码(线性量化)，则AudioFormat=1
  waveView.setUint16(offset, 1, littleEndian)
  offset += 2
  // NumChannels 2bytes 声道数，单声道（Mono）为1,双声道（Stereo）为2
  waveView.setUint16(offset, channel, littleEndian)
  offset += 2
  // SampleRate 4bytes采样率
  waveView.setUint32(offset, samplate, littleEndian)
  offset += 4
  // ByteRate 4bytes传输速率，单位：Byte/s
  waveView.setUint32(offset, samplate * sampleSize * channel / 8, littleEndian)
  offset += 4
  // BlockAlign 2bytes一个样点（包含所有声道）的字节数
  waveView.setUint16(offset, channel * sampleSize / 8, littleEndian)
  offset += 2
  // BitsPerSample 2bytes 每个样点对应的位数
  waveView.setUint16(offset, sampleSize, littleEndian)
  offset += 2
  // Subchunk2ID 4bytes ASCII码“0x64617461”对应字母 “data”
  writeStringToBuffer(waveView, offset, 'data')
  offset += 4
  // Subchunk2Size 4bytes 实际样本数据的大小（单位：字节）
  waveView.setUint32(offset, biteLength - 44, littleEndian)
  offset += 4
  // 实际的音频数据
  switch (sampleSize) {
  case 8: floatTo8BitPCM(waveView, offset, bufferFromArray)
    break
  case 16: floatTo16BitPCM(waveView, offset, bufferFromArray)
    break
  case 32: floatTo32BitPCM(waveView, offset, bufferFromArray)
    break
  }
  return waveView.buffer
}

/**
 * @description: 将字符串写入DataView中
 * @param {DataView} dataView DataView
 * @param {number} offset 开始写入的位置
 * @param {string} str 字符串
 * @return {void}
 */  
function writeStringToBuffer (dataView, offset, str) {
  for (let i = 0, len = str.length; i < len; i++) {
    dataView.setUint8(offset + i, str.charCodeAt(i))
  }
}

/**
 * @description: 32位采样普通数组数据写入ArrayBuffer
 * @param {DataView} dataView ArrayBuffer视图
 * @param {number} offset 写入ArrayBuffer的起始位
 * @param {Array} data 普通数组
 * @param {boolean} littleEndian 大小端控制
 * @return {void}
 */  

function floatTo32BitPCM (dataView, offset, data, littleEndian = true) {
  const input = new Int32Array(data)
  for (let i = 0, len = input.length; i < len; i++, offset += 4) {
    dataView.setInt32(offset, input[i], littleEndian)
  }
}
/**
 * @description: 16位采样普通数组数据写入ArrayBuffer
 * @param {DataView} dataView ArrayBuffer视图
 * @param {number} offset 写入ArrayBuffer的起始位
 * @param {Array} data 普通数组
 * @param {boolean} littleEndian 大小端控制
 * @return {void}
 */

function floatTo16BitPCM (dataView, offset, data, littleEndian = true) {
  const input = new Int16Array(data)
  for (let i = 0, len = input.length; i < len; i++, offset += 2) {
    dataView.setInt16(offset, input[i], littleEndian)
  }
}
/**
 * @description: 8位采样普通数组数据写入ArrayBuffer
 * @param {DataView} dataView ArrayBuffer视图
 * @param {number} offset 写入ArrayBuffer的起始位
 * @param {Array} data 普通数组
 * @param {boolean} littleEndian 大小端控制
 * @return {void}
 */

function floatTo8BitPCM (dataView, offset, data) {
  const input = new Int8Array(data)
  for (let i = 0, len = input.length; i < len; i++, offset++) {
    dataView.setInt8(offset, input[i])
  }
}
