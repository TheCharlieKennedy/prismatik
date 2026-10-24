export interface DragControl {
  wasDragging(): boolean
  dispose(): void
}

export interface DragConfig {
  sensitivity?: number
  threshold?: number
}

export function createDragControl(
  el: HTMLElement,
  onDrag: (dx: number, dy: number) => void,
  config: DragConfig = {}
): DragControl {
  const { sensitivity = 1, threshold = 2 } = config

  let active = false
  let lastX = 0
  let lastY = 0
  let moved = false

  function onMouseDown(e: MouseEvent) {
    active = true; lastX = e.clientX; lastY = e.clientY; moved = false
  }

  function onMouseMove(e: MouseEvent) {
    if (!active) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      onDrag(dx * sensitivity, dy * sensitivity)
      moved = true
    }
    lastX = e.clientX; lastY = e.clientY
  }

  function onMouseUp() { active = false }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
    active = true; moved = false
  }

  function onTouchMove(e: TouchEvent) {
    if (!active || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - lastX
    const dy = e.touches[0].clientY - lastY
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      onDrag(dx * sensitivity, dy * sensitivity)
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
      moved = true
    }
  }

  function onTouchEnd() { active = false }

  el.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: true })
  el.addEventListener('touchend', onTouchEnd)

  return {
    wasDragging() { const was = moved; moved = false; return was },
    dispose() {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }
}
