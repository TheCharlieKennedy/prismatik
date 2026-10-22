export function buildCharsetTexture(charset: string, cellSize: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = charset.length * cellSize
  canvas.height = cellSize
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.font = `${cellSize}px monospace`
  ctx.textBaseline = 'top'
  for (let i = 0; i < charset.length; i++) {
    ctx.fillText(charset[i], i * cellSize, 0)
  }
  return canvas
}
