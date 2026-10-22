export interface GifFrame {
  pixels: Uint8ClampedArray<ArrayBuffer>
  delay: number
  width: number
  height: number
}

export interface GifAnim {
  tex: WebGLTexture
  frames: GifFrame[]
  currentFrame: number
  elapsed: number
  overlay?: HTMLImageElement
  offscreen?: HTMLCanvasElement
}

export function parseGif(buf: ArrayBuffer): GifFrame[] {
  const data = new Uint8Array(buf)
  let pos = 6

  function read(n: number): number {
    let val = 0
    for (let i = 0; i < n; i++) val |= data[pos++] << (i * 8)
    return val
  }

  const canvasW = read(2)
  const canvasH = read(2)
  const packed = read(1)
  const hasGCT = (packed >> 7) & 1
  const gctSize = packed & 0x7
  read(1); read(1)

  const gct: number[][] = []
  if (hasGCT) {
    const count = 1 << (gctSize + 1)
    for (let i = 0; i < count; i++) gct.push([data[pos++], data[pos++], data[pos++]])
  }

  const frames: GifFrame[] = []
  let gcDelay = 0
  let gcTransparentIndex = -1

  function lzwDecode(minCodeSize: number, input: Uint8Array): Uint8Array {
    const clearCode = 1 << minCodeSize
    const eoi = clearCode + 1
    let codeSize = minCodeSize + 1
    let codeMask = (1 << codeSize) - 1
    const table: number[][] = []

    function resetTable() {
      table.length = 0
      for (let i = 0; i < clearCode; i++) table.push([i])
      table.push([]); table.push([])
      codeSize = minCodeSize + 1
      codeMask = (1 << codeSize) - 1
    }
    resetTable()

    const output: number[] = []
    let bitBuf = 0, bitLen = 0, inPos = 0, prev = -1

    function readCode(): number {
      while (bitLen < codeSize && inPos < input.length) {
        bitBuf |= input[inPos++] << bitLen
        bitLen += 8
      }
      const code = bitBuf & codeMask
      bitBuf >>= codeSize; bitLen -= codeSize
      return code
    }

    while (true) {
      const code = readCode()
      if (code === eoi || inPos > input.length) break
      if (code === clearCode) { resetTable(); prev = -1; continue }
      if (prev === -1) { output.push(...table[code]); prev = code; continue }

      let entry: number[]
      if (code < table.length) entry = table[code]
      else if (code === table.length) entry = [...table[prev], table[prev][0]]
      else break

      output.push(...entry)
      table.push([...table[prev], entry[0]])
      if (table.length === (1 << codeSize) && codeSize < 12) {
        codeSize++; codeMask = (1 << codeSize) - 1
      }
      prev = code
    }
    return new Uint8Array(output)
  }

  while (pos < data.length) {
    const block = data[pos++]
    if (block === 0x3B) break

    if (block === 0x21) {
      const label = data[pos++]
      if (label === 0xF9) {
        pos++
        const gceFlags = data[pos++]
        gcDelay = read(2) * 10
        gcTransparentIndex = (gceFlags & 1) ? data[pos++] : (pos++, -1)
        pos++
      } else {
        while (true) { const sz = data[pos++]; if (sz === 0) break; pos += sz }
      }
      continue
    }

    if (block === 0x2C) {
      read(2); read(2)
      const iw = read(2), ih = read(2)
      const iPacked = read(1)
      const hasLCT = (iPacked >> 7) & 1
      const interlaced = (iPacked >> 6) & 1
      const lctSize = iPacked & 0x7

      let ct = gct
      if (hasLCT) {
        ct = []
        const count = 1 << (lctSize + 1)
        for (let i = 0; i < count; i++) ct.push([data[pos++], data[pos++], data[pos++]])
      }

      const minCodeSize = data[pos++]
      const chunks: Uint8Array[] = []
      while (true) { const sz = data[pos++]; if (sz === 0) break; chunks.push(data.slice(pos, pos + sz)); pos += sz }
      const totalLen = chunks.reduce((a, c) => a + c.length, 0)
      const input = new Uint8Array(totalLen)
      let off = 0
      for (const c of chunks) { input.set(c, off); off += c.length }

      const indices = lzwDecode(minCodeSize, input)
      let finalIndices = indices
      if (interlaced) {
        finalIndices = new Uint8Array(iw * ih)
        const passes = [{ start: 0, step: 8 }, { start: 4, step: 8 }, { start: 2, step: 4 }, { start: 1, step: 2 }]
        let src = 0
        for (const { start, step } of passes)
          for (let y = start; y < ih; y += step)
            for (let x = 0; x < iw; x++) finalIndices[y * iw + x] = indices[src++]
      }

      const pixels = new Uint8ClampedArray(new ArrayBuffer(iw * ih * 4))
      for (let i = 0; i < iw * ih; i++) {
        const idx = finalIndices[i], p = i * 4
        if (idx === gcTransparentIndex) {
          pixels[p] = 0; pixels[p+1] = 0; pixels[p+2] = 0; pixels[p+3] = 0
        } else {
          const rgb = ct[idx] ?? [0, 0, 0]
          pixels[p] = rgb[0]; pixels[p+1] = rgb[1]; pixels[p+2] = rgb[2]; pixels[p+3] = 255
        }
      }

      frames.push({ pixels, delay: gcDelay || 100, width: iw, height: ih })
      gcDelay = 0; gcTransparentIndex = -1
      continue
    }
    break
  }
  return frames
}

export function loadGif(
  gl: WebGLRenderingContext,
  url: string,
  overlayUrl?: string
): Promise<GifAnim> {
  const gifPromise = fetch(url).then(r => r.arrayBuffer()).then(buf => parseGif(buf))
  const overlayPromise = overlayUrl
    ? new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = overlayUrl
      })
    : Promise.resolve(undefined)

  return Promise.all([gifPromise, overlayPromise]).then(([frames, overlay]) => {
    if (frames.length === 0) throw new Error('GIF has no frames')
    const f0 = frames[0]

    let offscreen: HTMLCanvasElement | undefined
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)

    if (overlay) {
      offscreen = document.createElement('canvas')
      offscreen.width = overlay.naturalWidth
      offscreen.height = overlay.naturalHeight
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen)
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, f0.width, f0.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, f0.pixels)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return { tex, frames, currentFrame: 0, elapsed: 0, overlay, offscreen }
  })
}

export function updateGif(gl: WebGLRenderingContext, anim: GifAnim, dt: number): void {
  if (anim.frames.length <= 1) return
  anim.elapsed += dt * 1000
  const delay = anim.frames[anim.currentFrame].delay
  if (anim.elapsed < delay) return
  anim.elapsed = 0
  anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length
  const f = anim.frames[anim.currentFrame]

  gl.bindTexture(gl.TEXTURE_2D, anim.tex)

  if (anim.offscreen && anim.overlay) {
    const ctx = anim.offscreen.getContext('2d')!
    const cw = anim.offscreen.width, ch = anim.offscreen.height
    const tmp = document.createElement('canvas')
    tmp.width = f.width; tmp.height = f.height
    tmp.getContext('2d')!.putImageData(new ImageData(f.pixels, f.width, f.height), 0, 0)
    const cropSize = f.width / 2
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(tmp, (f.width - cropSize) / 2 - 20, (f.height - cropSize) / 2 - 20, cropSize, cropSize, 0, 0, cw, ch)
    ctx.drawImage(anim.overlay, 0, 0, cw, ch)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, anim.offscreen)
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, f.width, f.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, f.pixels)
  }
}
