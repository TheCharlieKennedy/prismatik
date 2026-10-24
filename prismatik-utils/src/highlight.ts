import { makeSolidTexture, mat4Multiply, scale } from 'prismatik-core'

export interface Highlight {
  draw(
    gl: WebGLRenderingContext,
    item: any,
    itemType: { draw: (gl: WebGLRenderingContext, item: any, textures: any, slot: any, locs: any, mvp: Float32Array, textureOverride?: WebGLTexture) => void },
    slot: any,
    locs: any,
    mvp: Float32Array,
  ): void
  setColor(r: number, g: number, b: number): void
  dispose(gl: WebGLRenderingContext): void
}

export interface HighlightConfig {
  r?: number
  g?: number
  b?: number
  scaleUp?: number
  opacity?: number   // 0–1
}

export function createHighlight(
  gl: WebGLRenderingContext,
  r = 255,
  g = 220,
  b = 0,
  scaleUp = 1.17,
  opacity = 0.5,
): Highlight {
  let tex: WebGLTexture | null = makeSolidTexture(gl, r, g, b)

  return {
    draw(gl, item, itemType, slot, locs, mvp) {
      if (!tex) return
      const s = scaleUp
      const scaledMvp = mat4Multiply(mvp, scale(s, s, s))

      gl.depthMask(false)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      // Inject alpha via uniform if the shader supports u_alpha; fall back to
      // a per-vertex alpha by encoding it in the texture. Since we use
      // makeSolidTexture (which creates an RGB texture), we instead set the
      // WebGL blend constant to carry opacity.
      gl.blendColor(0, 0, 0, opacity)
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA)

      itemType.draw(gl, item, {}, slot, locs, scaledMvp, tex)

      gl.disable(gl.BLEND)
      gl.depthMask(true)
    },
    setColor(r: number, g: number, b: number) {
      if (tex) { gl.deleteTexture(tex); tex = null }
      tex = makeSolidTexture(gl, r, g, b)
    },
    dispose(gl) {
      if (tex) { gl.deleteTexture(tex); tex = null }
    }
  }
}
