import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
})
