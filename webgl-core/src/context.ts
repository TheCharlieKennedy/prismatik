export function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) throw new Error('WebGL is not supported in this environment')

  resizeToPixelRatio(canvas, gl)
  return gl
}

export function resizeToPixelRatio(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): void {
  const dpr = window.devicePixelRatio ?? 1
  const { clientWidth, clientHeight } = canvas
  canvas.width = Math.round(clientWidth * dpr)
  canvas.height = Math.round(clientHeight * dpr)
  gl.viewport(0, 0, canvas.width, canvas.height)
}
