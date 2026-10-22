import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  root: command === 'serve' ? 'src/dev' : '.',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebGLCore',
      fileName: 'webgl-core',
      formats: ['es']
    }
  }
}))
