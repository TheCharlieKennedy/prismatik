export interface AutoRotate {
  tick(dt: number): number   // returns delta angle applied this tick
  pause(resumeDelay?: number): void
  resume(): void
  dispose(): void
}

export interface AutoRotateConfig {
  speed?: number             // radians per second
  resumeDelay?: number       // ms before auto-spin resumes after pause()
}

export function createAutoRotate(config: AutoRotateConfig = {}): AutoRotate {
  const { speed = 0.5, resumeDelay = 1500 } = config

  let spinning = true
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    tick(dt) {
      if (!spinning) return 0
      return speed * Math.min(dt, 0.1)
    },
    pause(delay = resumeDelay) {
      spinning = false
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => { spinning = true }, delay)
    },
    resume() {
      spinning = true
      if (timer !== null) { clearTimeout(timer); timer = null }
    },
    dispose() {
      if (timer !== null) clearTimeout(timer)
    }
  }
}
