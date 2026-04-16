import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app/',           // ← Critical for serving under /app
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})