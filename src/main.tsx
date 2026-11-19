import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@/lib/store'
import App from './App.tsx'
import './index.css'

// Service worker chỉ bật ở bản build (dev dùng HMR của Vite).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => {}))
    } catch {}
  })
}

// Chặn pinch-zoom trên iPhone (Safari bỏ qua user-scalable=no).
document.addEventListener('gesturestart', (e) => e.preventDefault())

void init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
