import { createDragControl } from './drag'
import { createAutoRotate } from './autoRotate'

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
  el: HTMLElement,
  config: OrbitConfig = {}
): OrbitControl {
  const {
    autoSpinSpeed = 0.5,
    autoSpinResumeDelay = 1500,
    sensitivity = 0.006,
  } = config

  let q = qFromAxisAngle(1, 0, 0, -0.3)

  const autoRotate = createAutoRotate({ speed: autoSpinSpeed, resumeDelay: autoSpinResumeDelay })

  const drag = createDragControl(el, (dx, dy) => {
    const qY = qFromAxisAngle(0, 1, 0, dx * sensitivity)
    const qX = qFromAxisAngle(1, 0, 0, dy * sensitivity)
    q = qNorm(qMul(qY, qMul(qX, q)))
    autoRotate.pause(autoSpinResumeDelay)
  }, { sensitivity: 1, threshold: 2 })

  const ARROW_SPEED = 0.04

  function onKeyDown(e: KeyboardEvent) {
    const applyDelta = (dx: number, dy: number) => {
      const qY = qFromAxisAngle(0, 1, 0, dx * sensitivity)
      const qX = qFromAxisAngle(1, 0, 0, dy * sensitivity)
      q = qNorm(qMul(qY, qMul(qX, q)))
    }
    if (e.key === 'ArrowLeft')  { applyDelta(-ARROW_SPEED / sensitivity, 0); autoRotate.pause() }
    if (e.key === 'ArrowRight') { applyDelta( ARROW_SPEED / sensitivity, 0); autoRotate.pause() }
    if (e.key === 'ArrowUp')    { applyDelta(0, -ARROW_SPEED / sensitivity); autoRotate.pause() }
    if (e.key === 'ArrowDown')  { applyDelta(0,  ARROW_SPEED / sensitivity); autoRotate.pause() }
  }

  window.addEventListener('keydown', onKeyDown)
  document.body.classList.add('no-scroll')

  return {
    wasDragging() { return drag.wasDragging() },
    getAngles() { return { rotX: 0, rotY: 0 } },
    tick(dt) {
      const delta = autoRotate.tick(dt)
      if (delta > 0) {
        const qSpin = qFromAxisAngle(0, 1, 0, delta)
        q = qNorm(qMul(qSpin, q))
      }
    },
    getMatrix() { return qToMatrix(q) },
    dispose() {
      drag.dispose()
      autoRotate.dispose()
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }
}
