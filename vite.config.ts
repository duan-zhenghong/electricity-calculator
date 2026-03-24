import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/electricity-calculator/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
