// Plugin Vite sinh service worker (dist/client/sw.js) lúc build, kèm danh sách file cần cache sẵn
// lấy từ chính bundle (tên file có hash). Rút gọn từ chiatien.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

const PUBLIC_PRECACHE = ['/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']

export function pwa(): Plugin {
  return {
    name: 'fluency-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      if (this.environment?.name !== 'client') return
      const files = Object.keys(bundle)
        .filter((f) => f === 'index.html' || (f.startsWith('assets/') && !f.endsWith('.map')))
        .map((f) => (f === 'index.html' ? '/' : `/${f}`))
      const precache = [...new Set([...files, ...PUBLIC_PRECACHE])].sort()
      // File trong public/ giữ nguyên tên khi đổi nội dung (vd. icon) → băm cả nội dung để VERSION đổi theo.
      const hash = createHash('sha256').update(precache.join('\n'))
      for (const f of PUBLIC_PRECACHE) hash.update(readFileSync(new URL(`./public${f}`, import.meta.url)))
      const version = hash.digest('hex').slice(0, 10)
      const source = serviceWorker(version, precache)
      try {
        new Function(source)
      } catch (err) {
        this.error(`sw.js sinh ra bị lỗi cú pháp: ${(err as Error).message}`)
      }
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

function serviceWorker(version: string, precache: string[]) {
  return `// Sinh tự động bởi pwa.plugin.ts – không sửa tay.
const VERSION = '${version}'
const PRECACHE = ${JSON.stringify(precache)}
const STATIC_CACHE = 'static-' + VERSION
// Dữ liệu nét chữ (luyện viết) + ảnh emoji Noto trên jsDelivr: URL có ghim phiên bản, không đổi nội dung,
// nên cache lâu dài (không xoá theo VERSION) để dùng được khi offline.
const CDN_CACHE = 'cdn-v1'
const CDN_ORIGIN = 'https://cdn.jsdelivr.net'
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('static-') && key !== STATIC_CACHE) await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin === CDN_ORIGIN) return event.respondWith(cdnCacheFirst(request))
  if (url.origin !== self.location.origin) return
  // API đồng bộ: luôn đi mạng (dữ liệu offline đã nằm trong IndexedDB).
  if (url.pathname.startsWith('/api/')) return
  // Trang: ưu tiên mạng để lấy bản mới, mất mạng thì dùng bản đã cache.
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request, '/'))
  event.respondWith(cacheFirst(request))
})

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(STATIC_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(cacheKey, response.clone())
    return response
  } catch (err) {
    const cached = await cache.match(cacheKey, MATCH)
    if (cached) return cached
    throw err
  }
}

async function cdnCacheFirst(request) {
  const cache = await caches.open(CDN_CACHE)
  const cached = await cache.match(request, MATCH)
  if (cached) return cached
  const response = await fetch(request)
  // Ảnh <img> không CORS về dạng opaque (status 0) – vẫn cache được.
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
  return response
}

async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok && new URL(request.url).pathname.startsWith('/assets/')) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }
  return response
}
`
}
