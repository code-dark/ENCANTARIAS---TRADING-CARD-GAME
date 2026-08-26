import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /**
   * Relative asset paths, so the build works wherever it is served from.
   *
   * GitHub Pages serves a project site under /<repo>/, and absolute paths
   * would look for /assets/… at the domain root and find nothing. Relative
   * paths also mean the same `dist/` can be opened from a file:// URL or
   * dropped on any static host without rebuilding.
   */
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
  },
})
