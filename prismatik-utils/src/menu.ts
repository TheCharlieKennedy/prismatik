export interface DropdownOption {
  label: string
  value: string
}

export interface DropdownItem {
  type: 'dropdown' | 'color'
  label: string
  value: string
  options: DropdownOption[]
  columns?: number
  onChange(value: string): void
  renderOption?: (ctx: CanvasRenderingContext2D, option: DropdownOption, x: number, y: number, size: number, dpr: number) => void
  renderValue?: (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, dpr: number) => void
}

export interface ColorItem extends DropdownItem {
  type: 'color'
  colors: string[]
}

export function createColorItem(
  label: string,
  initialValue: string,
  colors: string[],
  onChange: (hex: string) => void,
): ColorItem {
  const options: DropdownOption[] = colors.map(hex => ({ label: hex, value: hex }))

  return {
    type: 'color',
    label,
    value: initialValue,
    colors,
    options,
    columns: 4,
    onChange,
    renderOption(ctx, option, x, y, size, dpr) {
      const swatchSize = 28 * dpr
      const swatchX = x + (size - swatchSize) / 2
      const swatchY = y + (size - swatchSize) / 2
      ctx.fillStyle = option.value
      ctx.beginPath()
      ctx.roundRect(swatchX, swatchY, swatchSize, swatchSize, 3 * dpr)
      ctx.fill()
    },
    renderValue(ctx, value, x, y, size, dpr) {
      const swatchSize = 24 * dpr
      const swatchX = x - swatchSize
      const swatchY = y + (size - swatchSize) / 2
      ctx.fillStyle = value
      ctx.beginPath()
      ctx.roundRect(swatchX, swatchY, swatchSize, swatchSize, 3 * dpr)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1 * dpr
      ctx.stroke()
    },
  }
}

export interface MenuConfig {
  enabled: boolean
  items: (MenuItem | SliderItem | DropdownItem | ColorItem)[]
}

export interface MenuItem {
  type?: 'button'
  label: string
  onSelect(): void
}

export interface SliderItem {
  type: 'slider'
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange(value: number): void
}

export interface PauseMenu {
  open(): void
  close(): void
  isOpen(): boolean
  render(): void
  handleInput(e: KeyboardEvent): boolean
}

const BTN_SIZE_CSS = 80
const BTN_MARGIN_CSS = 12
const MENU_W_CSS = 320
const MENU_ITEM_H_CSS = 68
const MENU_PAD_X_CSS = 36
const MENU_PAD_Y_CSS = 20
const MENU_FONT_CSS = 22
const MENU_RADIUS_CSS = 10

export function createPauseMenu(config: MenuConfig, overlay: HTMLCanvasElement): PauseMenu {
  let open = false
  let draggingSlider: SliderItem | null = null
  let openDropdown: DropdownItem | null = null

  const ctx = overlay.getContext('2d')!

  // Transparent div sits over the button region only — always clickable, never blocks the shelf
  const btnDiv = document.createElement('div')
  btnDiv.style.cssText = [
    'position:absolute',
    `top:${BTN_MARGIN_CSS}px`,
    `right:${BTN_MARGIN_CSS}px`,
    `width:${BTN_SIZE_CSS}px`,
    `height:${BTN_SIZE_CSS}px`,
    'cursor:pointer',
    'z-index:20',
  ].join(';')
  overlay.parentElement?.appendChild(btnDiv)

  function dpr() { return window.devicePixelRatio ?? 1 }

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

  function sliderTrack(i: number) {
    const { d, itemH, padX, padY, menuW, menuX, menuY } = menuDims()
    const itemY = menuY + padY + i * itemH
    const trackX = menuX + padX
    const trackW = menuW - padX * 2
    const trackY = itemY + itemH * 0.72
    return { trackX, trackW, trackY, d }
  }

  function applySliderCx(item: SliderItem, cx: number, i: number) {
    const { trackX, trackW } = sliderTrack(i)
    const t = Math.max(0, Math.min(1, (cx - trackX) / trackW))
    const steps = Math.round(t * (item.max - item.min) / item.step)
    item.value = Math.max(item.min, Math.min(item.max, item.min + steps * item.step))
    item.onChange(item.value)
    draw()
  }

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

  const DROPDOWN_GAP_CSS = 6

  function dropdownListDims(item: DropdownItem, rowIndex: number) {
    const { d, itemH, padY, menuW, menuX, menuY } = menuDims()
    const cols = item.columns ?? 1
    const gap = DROPDOWN_GAP_CSS * d
    const swatchSize = 28 * d

    const rowY = menuY + padY + rowIndex * itemH
    const listY = rowY + itemH

    if (cols > 1) {
      const rows = Math.ceil(item.options.length / cols)
      const gridW = cols * swatchSize + (cols - 1) * gap
      const gridH = rows * swatchSize + (rows - 1) * gap
      const gridX = menuX + (menuW - gridW) / 2
      return { d, cols, gap, cellSize: swatchSize, rows, listX: gridX, listY, listW: gridW, listH: gridH }
    } else {
      const listW = menuW
      const listH = item.options.length * itemH
      const listX = menuX
      return { d, cols, gap, cellSize: itemH, rows: item.options.length, listX, listY, listW, listH }
    }
  }

  function draw() {
    const w = overlay.width, h = overlay.height
    ctx.clearRect(0, 0, w, h)
    drawButton()

    if (!open) return

    const { d, itemH, padX, padY, menuW, menuH, menuX, menuY } = menuDims()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(20, 20, 20, 0.92)'
    ctx.beginPath()
    ctx.roundRect(menuX, menuY, menuW, menuH, MENU_RADIUS_CSS * d)
    ctx.fill()

    config.items.forEach((item, i) => {
      const itemY = menuY + padY + i * itemH

      if (item.type === 'slider') {
        const { trackX, trackW, trackY } = sliderTrack(i)
        const trackH = 4 * d

        const t = (item.value - item.min) / (item.max - item.min)

        ctx.fillStyle = '#aaaaaa'
        ctx.font = `${MENU_FONT_CSS * d}px monospace`
        ctx.textBaseline = 'middle'
        ctx.fillText(`${item.label}: ${item.value}`, menuX + padX, itemY + itemH * 0.3)

        ctx.fillStyle = '#444444'
        ctx.beginPath()
        ctx.roundRect(trackX, trackY - trackH / 2, trackW, trackH, trackH / 2)
        ctx.fill()

        ctx.fillStyle = '#888888'
        ctx.beginPath()
        ctx.roundRect(trackX, trackY - trackH / 2, trackW * t, trackH, trackH / 2)
        ctx.fill()

        ctx.fillStyle = '#aaaaaa'
        ctx.beginPath()
        ctx.arc(trackX + trackW * t, trackY, 8 * d, 0, Math.PI * 2)
        ctx.fill()
      } else if (item.type === 'dropdown' || item.type === 'color') {
        ctx.fillStyle = '#aaaaaa'
        ctx.font = `${MENU_FONT_CSS * d}px monospace`
        ctx.textBaseline = 'middle'
        ctx.fillText(item.label, menuX + padX, itemY + itemH / 2)

        // Draw current value right-aligned
        const valueX = menuX + menuW - padX
        if (item.renderValue) {
          item.renderValue(ctx, item.value, valueX, itemY, itemH, d)
        } else {
          ctx.textAlign = 'right'
          ctx.fillText(item.value, valueX, itemY + itemH / 2)
          ctx.textAlign = 'left'
        }
      } else {
        ctx.fillStyle = '#aaaaaa'
        ctx.font = `${MENU_FONT_CSS * d}px monospace`
        ctx.textBaseline = 'middle'
        ctx.fillText(item.label, menuX + padX, itemY + itemH / 2)
      }
    })

    // Draw open dropdown list on top of everything else
    if (openDropdown) {
      const dropIndex = config.items.indexOf(openDropdown as MenuItem | SliderItem | DropdownItem | ColorItem)
      if (dropIndex !== -1) {
        const { d, cols, gap, cellSize, listX, listY, listW, listH } = dropdownListDims(openDropdown, dropIndex)

        ctx.fillStyle = 'rgba(20, 20, 20, 0.95)'
        ctx.beginPath()
        ctx.roundRect(listX - gap, listY - gap, listW + gap * 2, listH + gap * 2, MENU_RADIUS_CSS * d)
        ctx.fill()

        openDropdown.options.forEach((option, oi) => {
          const col = cols > 1 ? oi % cols : 0
          const row = cols > 1 ? Math.floor(oi / cols) : oi
          const ox = listX + col * (cellSize + gap)
          const oy = listY + row * (cellSize + gap)

          if (openDropdown!.renderOption) {
            openDropdown!.renderOption(ctx, option, ox, oy, cellSize, d)
          } else {
            ctx.fillStyle = '#aaaaaa'
            ctx.font = `${MENU_FONT_CSS * d}px monospace`
            ctx.textBaseline = 'middle'
            ctx.fillText(option.label, ox + MENU_PAD_X_CSS * d, oy + cellSize / 2)
          }

          // Highlight selected option
          if (option.value === openDropdown!.value) {
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2 * d
            ctx.beginPath()
            ctx.roundRect(ox, oy, cellSize, cellSize, 3 * d)
            ctx.stroke()
          }
        })
      }
    }
  }

  function canvasCoords(clientX: number, clientY: number) {
    const rect = overlay.getBoundingClientRect()
    return {
      cx: (clientX - rect.left) * (overlay.width / rect.width),
      cy: (clientY - rect.top) * (overlay.height / rect.height),
    }
  }

  function hitTestItem(cx: number, cy: number): number {
    const { itemH, padY, menuW, menuH, menuX, menuY } = menuDims()
    if (cx < menuX || cx > menuX + menuW || cy < menuY || cy > menuY + menuH) return -1
    for (let i = 0; i < config.items.length; i++) {
      const itemY = menuY + padY + i * itemH
      if (cy >= itemY && cy <= itemY + itemH) return i
    }
    return -1
  }

  function hitTestDropdown(item: DropdownItem, cx: number, cy: number, rowIndex: number): string | null {
    const { cols, gap, cellSize, listX, listY, listW, listH } = dropdownListDims(item, rowIndex)
    if (cx < listX - gap || cx > listX + listW + gap || cy < listY - gap || cy > listY + listH + gap) return null
    for (let oi = 0; oi < item.options.length; oi++) {
      const col = cols > 1 ? oi % cols : 0
      const row = cols > 1 ? Math.floor(oi / cols) : oi
      const ox = listX + col * (cellSize + gap)
      const oy = listY + row * (cellSize + gap)
      if (cx >= ox && cx <= ox + cellSize && cy >= oy && cy <= oy + cellSize) {
        return item.options[oi].value
      }
    }
    return null
  }

  function onPointerDown(clientX: number, clientY: number) {
    const { cx, cy } = canvasCoords(clientX, clientY)

    // If a dropdown is open, check its list first
    if (openDropdown) {
      const dropIndex = config.items.indexOf(openDropdown as MenuItem | SliderItem | DropdownItem | ColorItem)
      const hit = dropIndex !== -1 ? hitTestDropdown(openDropdown, cx, cy, dropIndex) : null
      if (hit !== null) {
        openDropdown.value = hit
        openDropdown.onChange(hit)
        openDropdown = null
        draw()
        return
      }
      // Click outside list — close dropdown
      const i = hitTestItem(cx, cy)
      if (i !== dropIndex) {
        openDropdown = null
        draw()
        if (i === -1) { close(); return }
        // Fall through to handle whatever was clicked
        const item = config.items[i]
        if (item.type === 'slider') {
          draggingSlider = item
          applySliderCx(item, cx, i)
        } else if (item.type === 'dropdown' || item.type === 'color') {
          openDropdown = item
          draw()
        } else {
          (item as MenuItem).onSelect()
          draw()
        }
        return
      }
      // Clicked the same dropdown row again — close
      openDropdown = null
      draw()
      return
    }

    const i = hitTestItem(cx, cy)
    if (i === -1) { close(); return }
    const item = config.items[i]
    if (item.type === 'slider') {
      draggingSlider = item
      applySliderCx(item, cx, i)
    } else if (item.type === 'dropdown' || item.type === 'color') {
      openDropdown = item
      draw()
    } else {
      (item as MenuItem).onSelect()
      draw()
    }
  }

  function onPointerMove(clientX: number, clientY: number) {
    if (!draggingSlider) return
    const { cx } = canvasCoords(clientX, clientY)
    const i = config.items.indexOf(draggingSlider as MenuItem | SliderItem | DropdownItem | ColorItem)
    if (i !== -1) applySliderCx(draggingSlider, cx, i)
  }

  function onPointerUp() { draggingSlider = null }

  function onMouseDown(e: MouseEvent) { onPointerDown(e.clientX, e.clientY) }
  function onMouseMove(e: MouseEvent) { onPointerMove(e.clientX, e.clientY) }
  function onMouseUp() { onPointerUp() }
  function onTouchStart(e: TouchEvent) { e.preventDefault(); onPointerDown(e.touches[0].clientX, e.touches[0].clientY) }
  function onTouchMove(e: TouchEvent) { e.preventDefault(); onPointerMove(e.touches[0].clientX, e.touches[0].clientY) }
  function onTouchEnd() { onPointerUp() }

  // overlay only receives events when menu is open
  overlay.style.pointerEvents = 'none'

  function attachOverlayListeners() {
    overlay.addEventListener('mousedown', onMouseDown)
    overlay.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
  }

  function detachOverlayListeners() {
    overlay.removeEventListener('mousedown', onMouseDown)
    overlay.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  }

  btnDiv.addEventListener('click', () => {
    if (!config.enabled) return
    open = true
    overlay.style.pointerEvents = 'auto'
    attachOverlayListeners()
    draw()
  })

  function close() {
    open = false
    draggingSlider = null
    openDropdown = null
    overlay.style.pointerEvents = 'none'
    detachOverlayListeners()
    draw()
  }

  return {
    open() {
      if (!config.enabled) return
      open = true
      overlay.style.pointerEvents = 'auto'
      attachOverlayListeners()
      draw()
    },
    close,
    isOpen() { return open },
    render() { draw() },
    handleInput(e: KeyboardEvent): boolean {
      if (!open) return false
      if (e.key === 'Escape') { close(); return true }
      return false
    }
  }
}
