import type { ShaderImpl } from 'prismatik-core'

export interface RetroShaderConfig {
  affineTextureMapping: boolean
  vertexSnap: boolean
  snapResolution: number
  fogEnabled: boolean
  fogColor: [number, number, number]
  fogNear: number
  fogFar: number
}

export const defaultRetroConfig: RetroShaderConfig = {
  affineTextureMapping: true,
  vertexSnap: true,
  snapResolution: 64,
  fogEnabled: true,
  fogColor: [0.05, 0.05, 0.1],
  fogNear: 2.0,
  fogFar: 10.0
}

const vertSrc = `
  attribute vec4 a_position;
  attribute vec2 a_uv;

  uniform mat4 u_mvp;
  uniform float u_snapRes;
  uniform bool u_vertexSnap;
  uniform bool u_affine;

  varying vec2 v_uv;
  varying float v_depth;

  void main() {
    vec4 clip = u_mvp * a_position;

    if (u_vertexSnap) {
      vec2 snapped = floor(clip.xy / clip.w * u_snapRes + 0.5) / u_snapRes * clip.w;
      clip.xy = snapped;
    }

    gl_Position = clip;
    v_depth = clip.w;

    v_uv = u_affine ? a_uv : a_uv * clip.w;
  }
`

const fragSrc = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform bool u_affine;
  uniform bool u_fogEnabled;
  uniform vec3 u_fogColor;
  uniform float u_fogNear;
  uniform float u_fogFar;

  varying vec2 v_uv;
  varying float v_depth;

  void main() {
    vec2 uv = u_affine ? v_uv : v_uv / v_depth;
    vec4 color = texture2D(u_texture, uv);

    if (u_fogEnabled) {
      float fog = clamp((v_depth - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
      color.rgb = mix(color.rgb, u_fogColor, fog);
    }

    gl_FragColor = color;
  }
`

export function createRetroShader(config?: Partial<RetroShaderConfig>): ShaderImpl {
  const cfg: RetroShaderConfig = { ...defaultRetroConfig, ...config }
  let u_mvp: WebGLUniformLocation | null = null
  let u_snapRes: WebGLUniformLocation | null = null
  let u_vertexSnap: WebGLUniformLocation | null = null
  let u_affine: WebGLUniformLocation | null = null
  let u_texture: WebGLUniformLocation | null = null
  let u_fogEnabled: WebGLUniformLocation | null = null
  let u_fogColor: WebGLUniformLocation | null = null
  let u_fogNear: WebGLUniformLocation | null = null
  let u_fogFar: WebGLUniformLocation | null = null

  return {
    vertSrc,
    fragSrc,
    onInit(gl, program) {
      u_mvp        = gl.getUniformLocation(program, 'u_mvp')
      u_snapRes    = gl.getUniformLocation(program, 'u_snapRes')
      u_vertexSnap = gl.getUniformLocation(program, 'u_vertexSnap')
      u_affine     = gl.getUniformLocation(program, 'u_affine')
      u_texture    = gl.getUniformLocation(program, 'u_texture')
      u_fogEnabled = gl.getUniformLocation(program, 'u_fogEnabled')
      u_fogColor   = gl.getUniformLocation(program, 'u_fogColor')
      u_fogNear    = gl.getUniformLocation(program, 'u_fogNear')
      u_fogFar     = gl.getUniformLocation(program, 'u_fogFar')
    },
    onBeforeDraw(gl) {
      gl.uniform1f(u_snapRes as WebGLUniformLocation, cfg.snapResolution)
      gl.uniform1i(u_vertexSnap as WebGLUniformLocation, cfg.vertexSnap ? 1 : 0)
      gl.uniform1i(u_affine as WebGLUniformLocation, cfg.affineTextureMapping ? 1 : 0)
      gl.uniform1i(u_texture as WebGLUniformLocation, 0)
      gl.uniform1i(u_fogEnabled as WebGLUniformLocation, cfg.fogEnabled ? 1 : 0)
      gl.uniform3fv(u_fogColor as WebGLUniformLocation, cfg.fogColor)
      gl.uniform1f(u_fogNear as WebGLUniformLocation, cfg.fogNear)
      gl.uniform1f(u_fogFar as WebGLUniformLocation, cfg.fogFar)
    }
  }
}
