import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    allowedHosts: [
      'pacheco.chillan.ubiobio.cl' 
    ],
    proxy: {
      '/api': {
        target: 'http://nginx:8045',
        changeOrigin: true,
      }
    }
  }
})
