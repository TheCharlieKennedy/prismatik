export interface VBO {
  buffer: WebGLBuffer
  upload(data: Float32Array): void
  bind(): void
  dispose(): void
}

export function createVBO(gl: WebGLRenderingContext, usage: GLenum = gl.STATIC_DRAW): VBO {
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error('Failed to create WebGL buffer')
  let initialised = false

  return {
    buffer,
    upload(data: Float32Array) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      if (!initialised) {
        gl.bufferData(gl.ARRAY_BUFFER, data, usage)
        initialised = true
      } else {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
      }
    },
    bind() {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    },
    dispose() {
      gl.deleteBuffer(buffer)
    }
  }
}

export function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 4; k++)
        out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k]
  return out
}

export function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov / 2)
  const m = new Float32Array(16)
  m[0] = f / aspect; m[5] = f
  m[10] = (far + near) / (near - far); m[11] = -1
  m[14] = (2 * far * near) / (near - far)
  return m
}

export function rotationX(a: number): Float32Array {
  const m = new Float32Array(16)
  m[0] = 1
  m[5] = Math.cos(a); m[6] = Math.sin(a)
  m[9] = -Math.sin(a); m[10] = Math.cos(a)
  m[15] = 1
  return m
}

export function rotationY(a: number): Float32Array {
  const m = new Float32Array(16)
  m[0] = Math.cos(a); m[2] = -Math.sin(a); m[5] = 1
  m[8] = Math.sin(a); m[10] = Math.cos(a); m[15] = 1
  return m
}

export function translation(x: number, y: number, z: number): Float32Array {
  const m = new Float32Array(16)
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1
  m[12] = x; m[13] = y; m[14] = z
  return m
}

export function makeCuboid(hw: number, hh: number, hd: number): Float32Array {
  const w = hw, h = hh, d = hd
  return new Float32Array([
    // front
    -w,-h, d,  0,0,   w,-h, d,  1,0,   w, h, d,  1,1,
    -w,-h, d,  0,0,   w, h, d,  1,1,  -w, h, d,  0,1,
    // back
     w,-h,-d,  0,0,  -w,-h,-d,  1,0,  -w, h,-d,  1,1,
     w,-h,-d,  0,0,  -w, h,-d,  1,1,   w, h,-d,  0,1,
    // left
    -w,-h,-d,  0,0,  -w,-h, d,  1,0,  -w, h, d,  1,1,
    -w,-h,-d,  0,0,  -w, h, d,  1,1,  -w, h,-d,  0,1,
    // right
     w,-h, d,  0,0,   w,-h,-d,  1,0,   w, h,-d,  1,1,
     w,-h, d,  0,0,   w, h,-d,  1,1,   w, h, d,  0,1,
    // top
    -w, h, d,  0,0,   w, h, d,  1,0,   w, h,-d,  1,1,
    -w, h, d,  0,0,   w, h,-d,  1,1,  -w, h,-d,  0,1,
    // bottom
    -w,-h,-d,  0,0,   w,-h,-d,  1,0,   w,-h, d,  1,1,
    -w,-h,-d,  0,0,   w,-h, d,  1,1,  -w,-h, d,  0,1,
  ])
}
