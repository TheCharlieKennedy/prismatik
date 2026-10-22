export interface MenuConfig {
  enabled: boolean
  items: MenuItem[]
}

export interface MenuItem {
  label: string
  onSelect(): void
}

export interface PauseMenu {
  open(): void
  close(): void
  isOpen(): boolean
  render(): void
  handleInput(e: KeyboardEvent | TouchEvent | MouseEvent): boolean
}

const BTN_SIZE_CSS = 80
const BTN_MARGIN_CSS = 12
const MENU_W_CSS = 320
const MENU_ITEM_H_CSS = 56
const MENU_PAD_X_CSS = 36
const MENU_PAD_Y_CSS = 20
const MENU_FONT_CSS = 22
const MENU_RADIUS_CSS = 10

export function createPauseMenu(config: MenuConfig, overlay: HTMLCanvasElement): PauseMenu {
  let open = false
  let selectedIndex = 0

  const ctx = overlay.getContext('2d')!

  function dpr() { return window.devicePixelRatio ?? 1 }

  function drawButton() {
    if (!config.enabled) return
    const d = dpr()
    const size = BTN_SIZE_CSS * d
    const margin = BTN_MARGIN_CSS * d
    const x = overlay.width - size - margin
    const y = margin
    ctx.fillStyle = 'rgba(20, 20, 20, 0.75)'
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 6 * d)
    ctx.fill()
    ctx.fillStyle = '#aaaaaa'
    ctx.font = `${26 * d}px monospace`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('⋮', x + size / 2, y + size / 2)
    ctx.textAlign = 'left'
  }

  function menuDims() {
    const d = dpr()
    const itemH = MENU_ITEM_H_CSS * d
    const padX = MENU_PAD_X_CSS * d
    const padY = MENU_PAD_Y_CSS * d
    const menuW = MENU_W_CSS * d
    const menuH = padY * 2 + config.items.length * itemH
    const menuX = (overlay.width - menuW) / 2
    const menuY = (overlay.height - menuH) / 2
    return { d, itemH, padX, padY, menuW, menuH, menuX, menuY }
  }

  function draw() {
    const w = overlay.width, h = overlay.height
    ctx.clearRect(0, 0, w, h)

    if (!open) { drawButton(); return }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, w, h)

    const { d, itemH, padX, padY, menuW, menuH, menuX, menuY } = menuDims()

    ctx.fillStyle = 'rgba(20, 20, 20, 0.92)'
    ctx.beginPath()
    ctx.roundRect(menuX, menuY, menuW, menuH, MENU_RADIUS_CSS * d)
    ctx.fill()

    ctx.font = `${MENU_FONT_CSS * d}px monospace`
    ctx.textBaseline = 'middle'

    config.items.forEach((item, i) => {
      const itemY = menuY + padY + i * itemH
      if (i === selectedIndex) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(menuX + 4 * d, itemY, menuW - 8 * d, itemH)
        ctx.fillStyle = '#ffffff'
      } else {
        ctx.fillStyle = '#aaaaaa'
      }
      ctx.fillText(item.label, menuX + padX, itemY + itemH / 2)
    })
  }

  function hitTestButton(cx: number, cy: number): boolean {
    if (!config.enabled) return false
    const d = dpr()
    const size = BTN_SIZE_CSS * d
    const margin = BTN_MARGIN_CSS * d
    const x = overlay.width - size - margin
    const y = margin
    return cx >= x && cx <= x + size && cy >= y && cy <= y + size
  }

  return {
    open() { if (!config.enabled) return; open = true; selectedIndex = 0; draw() },
    close() { open = false; draw() },
    isOpen() { return open },
    render() { draw() },
    handleInput(e: KeyboardEvent | TouchEvent | MouseEvent): boolean {
      if (e instanceof KeyboardEvent) {
        if (!open) return false
        if (e.key === 'Escape') { open = false; draw(); return true }
        if (e.key === 'ArrowDown') { selectedIndex = (selectedIndex + 1) % config.items.length; draw(); return true }
        if (e.key === 'ArrowUp') { selectedIndex = (selectedIndex - 1 + config.items.length) % config.items.length; draw(); return true }
        if (e.key === 'Enter') { config.items[selectedIndex].onSelect(); draw(); return true }
      }

      if (e instanceof MouseEvent || (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent)) {
        if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) e.preventDefault()
        const point = e instanceof MouseEvent
          ? { x: e.clientX, y: e.clientY }
          : { x: (e as TouchEvent).changedTouches[0].clientX, y: (e as TouchEvent).changedTouches[0].clientY }

        const rect = overlay.getBoundingClientRect()
        const scaleX = overlay.width / rect.width
        const scaleY = overlay.height / rect.height
        const cx = (point.x - rect.left) * scaleX
        const cy = (point.y - rect.top) * scaleY

        if (!open) {
          if (hitTestButton(cx, cy)) { open = true; selectedIndex = 0; draw(); return true }
          return false
        }

        const { itemH, padY, menuW, menuH, menuX, menuY } = menuDims()
        config.items.forEach((item, i) => {
          const itemY = menuY + padY + i * itemH
          if (cx >= menuX && cx <= menuX + menuW && cy >= itemY && cy <= itemY + itemH) {
            selectedIndex = i; item.onSelect(); draw()
          }
        })
        return true
      }

      return false
    }
  }
}
