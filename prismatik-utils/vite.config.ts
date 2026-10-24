import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'prismatik-utils': resolve(__dirname, 'src/index.ts'),
        'orbit':       resolve(__dirname, 'src/orbit.ts'),
        'menu':        resolve(__dirname, 'src/menu.ts'),
        'gif':         resolve(__dirname, 'src/gif.ts'),
        'obj':         resolve(__dirname, 'src/obj.ts'),
        'highlight':   resolve(__dirname, 'src/highlight.ts'),
        'overlay':     resolve(__dirname, 'src/overlay.ts'),
        'drag':        resolve(__dirname, 'src/drag.ts'),
        'autoRotate':  resolve(__dirname, 'src/autoRotate.ts'),
        'geometry':    resolve(__dirname, 'src/geometry.ts'),
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['prismatik-core']
    }
  }
})
