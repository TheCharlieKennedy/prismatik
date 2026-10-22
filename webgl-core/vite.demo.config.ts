import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/dev',
  base: '/software/',
  publicDir: resolve(__dirname, 'src/dev/assets'),
  build: {
    outDir: resolve(__dirname, 'dist-demo'),
    emptyOutDir: true,
  }
})
