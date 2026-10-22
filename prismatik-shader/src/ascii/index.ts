import type { ShaderImpl } from 'prismatik-core'
import { buildCharsetTexture } from './charset'

export interface AsciiShaderConfig {
  cellSize: number
  charset: string
  foregroundColor: [number, number, number]
  backgroundColor: [number, number, number]
  vertexSnap: boolean
  snapResolution: number
  affineTextureMapping: boolean
}

export const defaultAsciiConfig: AsciiShaderConfig = {
  cellSize: 24,
  charset: ' ░▒▓█',
  foregroundColor: [0.9, 0.9, 0.9],
  backgroundColor: [0.05, 0.05, 0.05],
  vertexSnap: false,
  snapResolution: 64,
  affineTextureMapping: false
}

const vertSrc = `
  attribute vec4 a_position;
  attribute vec2 a_uv;

  uniform mat4 u_mvp;
  uniform bool u_vertexSnap;
  uniform float u_snapRes;
  uniform bool u_affine;

  varying vec2 v_uv;
  varying float v_w;

  void main() {
    vec4 clip = u_mvp * a_position;

    if (u_vertexSnap) {
      vec2 snapped = floor(clip.xy / clip.w * u_snapRes + 0.5) / u_snapRes * clip.w;
      clip.xy = snapped;
    }

    gl_Position = clip;
    v_w = clip.w;
    v_uv = u_affine ? a_uv : a_uv * clip.w;
  }
`

const fragSrc = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform sampler2D u_charset;
  uniform float u_cellSize;
  uniform float u_charsetLen;
  uniform vec3 u_fg;
  uniform vec3 u_bg;
  uniform bool u_isArt;
  uniform bool u_affine;
  uniform vec2 u_resolution;

  varying vec2 v_uv;
  varying float v_w;

  void main() {
    vec2 uv = u_affine ? v_uv : v_uv / v_w;

    if (u_isArt) {
      vec4 art = texture2D(u_texture, uv);
      if (art.a < 0.1) discard;
      gl_FragColor = art;
      return;
    }

    vec2 uvScaled = uv * u_resolution / u_cellSize;
    vec2 cellUV = floor(uvScaled) / (u_resolution / u_cellSize);
    vec2 subCell = fract(uvScaled);

    vec2 sampleUV = (floor(uvScaled) + 0.5) / (u_resolution / u_cellSize);
    sampleUV = clamp(sampleUV, 0.0, 1.0);
    vec4 col = texture2D(u_texture, sampleUV);
    float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));

    float charIndex = floor(luma * (u_charsetLen - 1.0) + 0.5);
    vec2 charUV = vec2((charIndex + subCell.x) / u_charsetLen, subCell.y);
    float stroke = texture2D(u_charset, charUV).r;

    gl_FragColor = vec4(mix(u_bg, u_fg, stroke), 1.0);
  }
`

export function createAsciiShader(config?: Partial<AsciiShaderConfig>): ShaderImpl {
  const cfg: AsciiShaderConfig = { ...defaultAsciiConfig, ...config }
  let charsetTex: WebGLTexture | null = null

  let u_mvp: WebGLUniformLocation | null = null
  let u_texture: WebGLUniformLocation | null = null
  let u_charset: WebGLUniformLocation | null = null
  let u_cellSize: WebGLUniformLocation | null = null
  let u_charsetLen: WebGLUniformLocation | null = null
  let u_fg: WebGLUniformLocation | null = null
  let u_bg: WebGLUniformLocation | null = null
  let u_isArt: WebGLUniformLocation | null = null
  let u_resolution: WebGLUniformLocation | null = null
  let u_vertexSnap: WebGLUniformLocation | null = null
  let u_snapRes: WebGLUniformLocation | null = null
  let u_affine: WebGLUniformLocation | null = null

  return {
    vertSrc,
    fragSrc,
    onInit(gl, program) {
      u_mvp        = gl.getUniformLocation(program, 'u_mvp')
      u_texture    = gl.getUniformLocation(program, 'u_texture')
      u_charset    = gl.getUniformLocation(program, 'u_charset')
      u_cellSize   = gl.getUniformLocation(program, 'u_cellSize')
      u_charsetLen = gl.getUniformLocation(program, 'u_charsetLen')
      u_fg         = gl.getUniformLocation(program, 'u_fg')
      u_bg         = gl.getUniformLocation(program, 'u_bg')
      u_isArt      = gl.getUniformLocation(program, 'u_isArt')
      u_resolution = gl.getUniformLocation(program, 'u_resolution')
      u_vertexSnap = gl.getUniformLocation(program, 'u_vertexSnap')
      u_snapRes    = gl.getUniformLocation(program, 'u_snapRes')
      u_affine     = gl.getUniformLocation(program, 'u_affine')

      const atlas = buildCharsetTexture(cfg.charset, cfg.cellSize)
      charsetTex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, charsetTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    },
    onBeforeDraw(gl) {
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, charsetTex)
      gl.uniform1i(u_texture, 0)
      gl.uniform1i(u_charset, 1)
      gl.uniform1f(u_cellSize, cfg.cellSize)
      gl.uniform1f(u_charsetLen, cfg.charset.length)
      gl.uniform3fv(u_fg, cfg.foregroundColor)
      gl.uniform3fv(u_bg, cfg.backgroundColor)
      gl.uniform1i(u_vertexSnap, cfg.vertexSnap ? 1 : 0)
      gl.uniform1f(u_snapRes, cfg.snapResolution)
      gl.uniform1i(u_affine, cfg.affineTextureMapping ? 1 : 0)
    }
  }
}
