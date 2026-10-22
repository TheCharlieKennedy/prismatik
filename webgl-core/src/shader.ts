import type { ShaderImpl, ShaderProgram } from './types'

function compileStage(gl: WebGLRenderingContext, type: GLenum, src: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown error'
    gl.deleteShader(shader)
    throw new Error(`Shader compile error:\n${log}`)
  }
  return shader
}

export function compileShader(
  gl: WebGLRenderingContext,
  impl: ShaderImpl
): ShaderProgram {
  const vert = compileStage(gl, gl.VERTEX_SHADER, impl.vertSrc)
  const frag = compileStage(gl, gl.FRAGMENT_SHADER, impl.fragSrc)

  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create shader program')
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  gl.deleteShader(vert)
  gl.deleteShader(frag)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'unknown error'
    gl.deleteProgram(program)
    throw new Error(`Shader link error:\n${log}`)
  }

  impl.onInit?.(gl, program)

  return {
    program,
    use() { gl.useProgram(program) },
    dispose() { gl.deleteProgram(program) }
  }
}

export function swapShader(
  gl: WebGLRenderingContext,
  current: ShaderProgram,
  next: ShaderImpl
): ShaderProgram {
  current.dispose()
  return compileShader(gl, next)
}
