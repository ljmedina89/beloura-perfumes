import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cambia el base al nombre EXACTO del repo de GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/beloura-perfumes/',
})