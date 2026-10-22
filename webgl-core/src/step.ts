export interface RenderStep {
  start(): void
  stop(): void
  dispose(): void
  onTick(cb: (dt: number) => void): () => void
}

export function createRenderStep(): RenderStep {
  let callbacks: ((dt: number) => void)[] = []
  let rafId: number | null = null
  let last: number | null = null

  function tick(now: number) {
    const dt = last !== null ? (now - last) / 1000 : 0
    last = now
    for (const cb of callbacks) cb(dt)
    rafId = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (rafId !== null) return
      last = null
      rafId = requestAnimationFrame(tick)
    },
    stop() {
      if (rafId === null) return
      cancelAnimationFrame(rafId)
      rafId = null
    },
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
      callbacks = []
    },
    onTick(cb) {
      callbacks.push(cb)
      return () => { callbacks = callbacks.filter(c => c !== cb) }
    }
  }
}
