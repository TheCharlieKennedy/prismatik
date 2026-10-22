import { createContext, resizeToPixelRatio } from '../context'
import { createRenderLoop } from '../loop'
import { createVBO } from '../vbo'
import { compileShader, swapShader } from '../shader'
import { createPauseMenu } from '../menu'
import { createOrbitControl } from '../orbit'
import type { ShaderImpl, ShaderProgram, PauseMenu } from '../types'

const canvas = document.getElementById('c') as HTMLCanvasElement
const overlay = document.getElementById('overlay') as HTMLCanvasElement
const gl = createContext(canvas)

// --- Shaders ---

const redShader: ShaderImpl = {
  vertSrc: `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_uv = a_uv; }
  `,
  fragSrc: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform bool u_useTexture;
    varying vec2 v_uv;
    void main() {
      if (u_useTexture) {
        vec4 c = texture2D(u_texture, v_uv);
        if (c.a < 0.1) discard;
        gl_FragColor = c;
      } else {
        gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
      }
    }
  `
}

const blueShader: ShaderImpl = {
  vertSrc: `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_uv = a_uv; }
  `,
  fragSrc: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform bool u_useTexture;
    varying vec2 v_uv;
    void main() {
      if (u_useTexture) {
        vec4 c = texture2D(u_texture, v_uv);
        if (c.a < 0.1) discard;
        gl_FragColor = c;
      } else {
        gl_FragColor = vec4(0.2, 0.4, 1.0, 1.0);
      }
    }
  `
}

const uniformNames = ['u_texture', 'u_useTexture']

// --- Geometry ---

// prettier-ignore
const triangle = new Float32Array([
   0.0,  0.6,  0.5, 1.0,
  -0.5, -0.4,  0.0, 0.0,
   0.5, -0.4,  1.0, 0.0,
])

// prettier-ignore
const quad = new Float32Array([
  -0.5,  0.5,  0.0, 0.0,
   0.5,  0.5,  1.0, 0.0,
   0.5, -0.5,  1.0, 1.0,
  -0.5,  0.5,  0.0, 0.0,
   0.5, -0.5,  1.0, 1.0,
  -0.5, -0.5,  0.0, 1.0,
])

const vbo = createVBO(gl)
vbo.upload(triangle)

const quadVbo = createVBO(gl)
quadVbo.upload(quad)

// --- Textures ---

function loadTexture(url: string): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      resolve(tex)
    }
    img.onerror = reject
    img.src = url
  })
}

let redIconTex: WebGLTexture | null = null
let blueIconTex: WebGLTexture | null = null
loadTexture('./assets/Gloin_Icon.png').then(t => { redIconTex = t })
loadTexture('./assets/Meek_Shock_Icon.png').then(t => { blueIconTex = t })

// --- State ---

let program: ShaderProgram = compileShader(gl, redShader, uniformNames)
let activeShader: 'red' | 'blue' = 'red'
let showIcon = false

function toggle() {
  showIcon = !showIcon
}

// --- Menu ---

overlay.width = canvas.width
overlay.height = canvas.height

const menu: PauseMenu = createPauseMenu({
  enabled: true,
  items: [
    {
      label: 'Switch Shader',
      onSelect() {
        if (activeShader === 'red') {
          program = swapShader(gl, program, blueShader, uniformNames)
          activeShader = 'blue'
        } else {
          program = swapShader(gl, program, redShader, uniformNames)
          activeShader = 'red'
        }
        menu.close()
      }
    },
    {
      label: 'Close',
      onSelect() { menu.close() }
    }
  ]
}, overlay)

function syncOverlay() {
  overlay.width = canvas.width
  overlay.height = canvas.height
  menu.render()
}

// --- Input ---

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !menu.isOpen()) { menu.open(); return }
  if (menu.handleInput(e)) return
  if (e.key === 'Enter') toggle()
})

overlay.addEventListener('click', e => {
  if (menu.handleInput(e)) return
  toggle()
})
overlay.addEventListener('touchend', e => {
  e.preventDefault()
  if (menu.handleInput(e)) return
  toggle()
}, { passive: false })

// --- Resize ---

new ResizeObserver(() => {
  resizeToPixelRatio(canvas, gl)
  syncOverlay()
}).observe(canvas)

// --- Loop ---

const loop = createRenderLoop()

loop.onTick(() => {
  gl.clearColor(0.08, 0.08, 0.08, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  program.use()

  const posLoc = gl.getAttribLocation(program.program, 'a_position')
  const uvLoc = gl.getAttribLocation(program.program, 'a_uv')
  const stride = 4 * 4

  const iconTex = activeShader === 'red' ? redIconTex : blueIconTex

  if (showIcon && iconTex) {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    quadVbo.bind()
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(uvLoc)
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, stride, 2 * 4)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, iconTex)
    gl.uniform1i(program.uniforms['u_texture'], 0)
    gl.uniform1i(program.uniforms['u_useTexture'], 1)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.disable(gl.BLEND)
  } else {
    vbo.bind()
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(uvLoc)
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, stride, 2 * 4)
    gl.uniform1i(program.uniforms['u_useTexture'], 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
})

loop.start()
