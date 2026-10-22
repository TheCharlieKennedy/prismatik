import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebGLUtils',
      fileName: 'webgl-utils',
      formats: ['es']
    },
    rollupOptions: {
      external: ['webgl-core']
    }
  }
})
