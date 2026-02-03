import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/AtacFluxDemo/',
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})
