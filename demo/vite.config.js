import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'dxf-viewer': path.resolve(__dirname, '../src/index.js')
    }
  },
  optimizeDeps: {
    include: ['three', 'opentype.js', 'earcut']
  },
  server: {
    port: 3000,
    open: true
  }
})
