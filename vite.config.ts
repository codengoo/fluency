import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pwa } from './pwa.plugin.ts'

export default defineConfig({
  // Plugin cloudflare chạy Worker + Durable Object ngay trong `vite dev`, giống khi deploy.
  plugins: [react(), tailwindcss(), cloudflare(), pwa()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
})
