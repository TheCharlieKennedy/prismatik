export interface Overlay {
  open(content: HTMLElement | string): void
  close(): void
  isOpen(): boolean
  dispose(): void
}

export function createOverlay(container: HTMLElement): Overlay {
  const el = document.createElement('div')
  el.style.cssText = [
    'position:absolute', 'inset:0',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(0,0,0,0.72)',
    'opacity:0', 'pointer-events:none',
    'transition:opacity 0.2s',
    'z-index:10',
  ].join(';')
  container.appendChild(el)

  let open = false

  el.addEventListener('click', () => close())

  function close() {
    open = false
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
  }

  return {
    open(content) {
      el.innerHTML = ''
      if (typeof content === 'string') {
        const wrap = document.createElement('div')
        wrap.style.cssText = [
          'color:#fff', 'font:16px monospace',
          'background:rgba(20,20,20,0.92)',
          'padding:24px 32px', 'border-radius:8px',
          'max-width:480px', 'text-align:center',
        ].join(';')
        wrap.textContent = content
        el.appendChild(wrap)
      } else {
        el.appendChild(content)
      }
      open = true
      el.style.opacity = '1'
      el.style.pointerEvents = 'auto'
    },
    close,
    isOpen: () => open,
    dispose() { el.remove() },
  }
}
