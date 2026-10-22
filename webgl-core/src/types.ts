export interface ShaderImpl {
  vertSrc: string
  fragSrc: string
  onInit?(gl: WebGLRenderingContext, program: WebGLProgram): void
  onBeforeDraw?(gl: WebGLRenderingContext, program: WebGLProgram): void
}

export type UniformMap = Record<string, WebGLUniformLocation | null>

export interface ShaderProgram {
  program: WebGLProgram
  use(): void
  dispose(): void
}
