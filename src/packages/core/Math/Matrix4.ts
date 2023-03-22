export class Matrix4 {
  elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

  translate (x: number, y: number, z: number) {
    const e = this.elements
    e[12] += e[0] * x + e[4] * y + e[8]  * z
    e[13] += e[1] * x + e[5] * y + e[9]  * z
    e[14] += e[2] * x + e[6] * y + e[10] * z
    e[15] += e[3] * x + e[7] * y + e[11] * z

    return this
  }
  /**
   * @description: 相对于初始坐标值平移
   * @param {number} x 沿X轴平移量
   * @param {number} y 沿Y轴平移量
   * @param {number} z 沿Z轴平移量
   * @return {this}
   */  
  setTranslate (x: number, y: number, z: number) {
    const e = this.elements
    e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x
    e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y
    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1

    return this
  }
  /**
   * @description: 相对于初始坐标值缩放
   * @param {number} x 沿X轴缩放因子
   * @param {number} y 沿Y轴缩放因子
   * @param {number} z 沿Z轴缩放因子
   * @return {this}
   */  
  setScale (x: number, y: number, z: number) {
    const e = this.elements
    e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0
    e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0
    e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1

    return this
  }

  scale (x: number, y: number, z: number) {
    const e = this.elements
    e[0] *= x;  e[4] *= y;  e[8]  *= z
    e[1] *= x;  e[5] *= y;  e[9]  *= z
    e[2] *= x;  e[6] *= y;  e[10] *= z
    e[3] *= x;  e[7] *= y;  e[11] *= z
    return this
  }
  /**
   * @description: 相对坐标初始值设置旋转角度
   * @param {number} angle 角度
   * @param {number} x 旋转轴向量的X坐标
   * @param {number} y 旋转轴向量的Y坐标
   * @param {number} z 旋转轴向量的Z坐标
   * @return {this}
   */  
  setRotate (angle: number, x: number, y: number, z: number) {
    let s, len, rlen, nc, xy, yz, zx, xs, ys, zs
  
    angle = Math.PI * angle / 180
    const e = this.elements
  
    s = Math.sin(angle)
    const c = Math.cos(angle)
  
    if (0 !== x && 0 === y && 0 === z) {
      // 绕X轴旋转
      if (x < 0) {
        s = -s
      }
      e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0
      e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0
      e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1
    } else if (0 === x && 0 !== y && 0 === z) {
      // 绕Y轴旋转
      if (y < 0) {
        s = -s
      }
      e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0
      e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0
      e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1
    } else if (0 === x && 0 === y && 0 !== z) {
      // 绕Z轴旋转
      if (z < 0) {
        s = -s
      }
      e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0
      e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0
      e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1
    } else {
      // 绕其他轴旋转
      len = Math.sqrt(x*x + y*y + z*z)
      if (len !== 1) {
        rlen = 1 / len
        x *= rlen
        y *= rlen
        z *= rlen
      }
      nc = 1 - c
      xy = x * y
      yz = y * z
      zx = z * x
      xs = x * s
      ys = y * s
      zs = z * s
  
      e[ 0] = x*x*nc +  c
      e[ 1] = xy *nc + zs
      e[ 2] = zx *nc - ys
      e[ 3] = 0
  
      e[ 4] = xy *nc - zs
      e[ 5] = y*y*nc +  c
      e[ 6] = yz *nc + xs
      e[ 7] = 0
  
      e[ 8] = zx *nc + ys
      e[ 9] = yz *nc - xs
      e[10] = z*z*nc +  c
      e[11] = 0
  
      e[12] = 0
      e[13] = 0
      e[14] = 0
      e[15] = 1
    }
  
    return this
  }

  rotate (angle: number, x: number, y: number, z: number) {
    return this.multiply(new Matrix4().setRotate(angle, x, y, z))
  }

  /**
   * @description: 设置单位矩阵
   * @return {this}
   */  
  setIdentity () {
    const e = this.elements
    e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0
    e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0
    e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0
    e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1

    return this
  }
  /**
   * @description: 复制另一个矩阵的值给当前矩阵
   * @param {Matrix4} source 另一个矩阵
   * @return {*}
   */  
  set (source: Matrix4) {
    let i
  
    const s = source.elements
    const d = this.elements
  
    if (s === d) return this
      
    for (i = 0; i < 16; ++i) {
      d[i] = s[i]
    }
  
    return this
  }
  /**
   * @description: 右乘矩阵
   * @param {Matrix4} source 另一个矩阵
   * @return {this}
   */  
  multiply (source: Matrix4) {
    let i, ai0, ai1, ai2, ai3
  
    const e = this.elements
    const a = this.elements
    let b = source.elements
    
    if (e === b) {
      b = new Float32Array(16)
      for (i = 0; i < 16; ++i) {
        b[i] = e[i]
      }
    }
    
    for (i = 0; i < 4; i++) {
      ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12]
      e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3]
      e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7]
      e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11]
      e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15]
    }
    
    return this
  }
}