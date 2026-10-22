import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'retro/index': resolve(__dirname, 'src/retro/index.ts'),
        'ascii/index': resolve(__dirname, 'src/ascii/index.ts'),
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['prismatik-core']
    }
  }
})
