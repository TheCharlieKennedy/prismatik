export interface OrbitControl {
  getAngles(): { rotX: number; rotY: number }
  tick(dt: number): void
  getMatrix(): Float32Array
  wasDragging(): boolean
  dispose(): void
}

export interface OrbitConfig {
  autoSpinSpeed?: number
  autoSpinResumeDelay?: number
  sensitivity?: number
}

function qMul(a: Float32Array, b: Float32Array): Float32Array {
  return new Float32Array([
    a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
    a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
    a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
    a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2],
  ])
}

function qNorm(q: Float32Array): Float32Array {
  const l = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3])
  return new Float32Array([q[0]/l, q[1]/l, q[2]/l, q[3]/l])
}

function qFromAxisAngle(x: number, y: number, z: number, a: number): Float32Array {
  const s = Math.sin(a / 2)
  return new Float32Array([x*s, y*s, z*s, Math.cos(a / 2)])
}

function qToMatrix(q: Float32Array): Float32Array {
  const [x, y, z, w] = q
  const m = new Float32Array(16)
  m[0]  = 1 - 2*(y*y + z*z); m[1]  = 2*(x*y + z*w); m[2]  = 2*(x*z - y*w)
  m[4]  = 2*(x*y - z*w);      m[5]  = 1 - 2*(x*x + z*z); m[6]  = 2*(y*z + x*w)
  m[8]  = 2*(x*z + y*w);      m[9]  = 2*(y*z - x*w); m[10] = 1 - 2*(x*x + y*y)
  m[15] = 1
  return m
}

export function createOrbitControl(
  canvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  config: OrbitConfig = {}
): OrbitControl {
  const {
    autoSpinSpeed = 0.5,
    autoSpinResumeDelay = 1500,
    sensitivity = 0.006,
  } = config

  let q = qFromAxisAngle(1, 0, 0, -0.3)
  let autoSpin = true
  let resumeTimer: ReturnType<typeof setTimeout> | null = null

  let dragActive = false
  let lastX = 0
  let lastY = 0
  let dragMoved = false

  function pauseSpin() {
    autoSpin = false
    if (resumeTimer !== null) clearTimeout(resumeTimer)
    resumeTimer = setTimeout(() => { autoSpin = true }, autoSpinResumeDelay)
  }

  function applyDelta(dx: number, dy: number) {
    const qY = qFromAxisAngle(0, 1, 0, dx * sensitivity)
    const qX = qFromAxisAngle(1, 0, 0, dy * sensitivity)
    q = qNorm(qMul(qY, qMul(qX, q)))
  }

  function onMouseDown(e: MouseEvent) {
    dragActive = true; lastX = e.clientX; lastY = e.clientY; dragMoved = false; pauseSpin()
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragActive) return
    const dx = e.clientX - lastX, dy = e.clientY - lastY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) { applyDelta(dx, dy); dragMoved = true }
    lastX = e.clientX; lastY = e.clientY; pauseSpin()
  }

  function onMouseUp() { dragActive = false }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    e.preventDefault()
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
    dragActive = true; dragMoved = false; pauseSpin()
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragActive || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      e.preventDefault()
      applyDelta(dx, dy)
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
      dragMoved = true; pauseSpin()
    }
  }

  function onTouchEnd() { dragActive = false }

  const ARROW_SPEED = 0.04
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft')  { applyDelta(-ARROW_SPEED / sensitivity, 0); pauseSpin() }
    if (e.key === 'ArrowRight') { applyDelta( ARROW_SPEED / sensitivity, 0); pauseSpin() }
    if (e.key === 'ArrowUp')    { applyDelta(0, -ARROW_SPEED / sensitivity); pauseSpin() }
    if (e.key === 'ArrowDown')  { applyDelta(0,  ARROW_SPEED / sensitivity); pauseSpin() }
  }

  overlay.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  overlay.addEventListener('touchstart', onTouchStart, { passive: false })
  overlay.addEventListener('touchmove', onTouchMove, { passive: false })
  overlay.addEventListener('touchend', onTouchEnd)
  window.addEventListener('keydown', onKeyDown)

  document.body.classList.add('no-scroll')

  return {
    wasDragging() { const was = dragMoved; dragMoved = false; return was },
    getAngles() { return { rotX: 0, rotY: 0 } },
    tick(dt: number) {
      if (autoSpin) {
        const qSpin = qFromAxisAngle(0, 1, 0, autoSpinSpeed * Math.min(dt, 0.1))
        q = qNorm(qMul(qSpin, q))
      }
    },
    getMatrix() { return qToMatrix(q) },
    dispose() {
      overlay.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      overlay.removeEventListener('touchstart', onTouchStart)
      overlay.removeEventListener('touchmove', onTouchMove)
      overlay.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
      if (resumeTimer !== null) clearTimeout(resumeTimer)
      document.body.classList.remove('no-scroll')
    }
  }
}
