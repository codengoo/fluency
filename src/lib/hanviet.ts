// Âm Hán Việt (dữ liệu hanviet-pinyin-words, MIT — xem scripts/gen-hanviet.mjs).
// Tra theo pinyin của chữ trong ngữ cảnh cả từ: 行 háng → hàng, xíng → hành.
// File dữ liệu ~90KB gzip nên tải lười lần đầu cần dùng; service worker cache lại.

import { useSyncExternalStore } from 'react'
import { pinyin } from 'pinyin-pro'

/** chữ → { pinyin số thanh ("xue2", "nu:3", thanh nhẹ "5") hoặc "*" (mọi cách đọc) → "âm1,âm2" } */
type Data = Record<string, Record<string, string>>

let data: Data | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function load() {
  loading ??= import('./hanviet.json')
    .then((m) => {
      data = m.default as Data
      for (const l of listeners) l()
    })
    .catch((err) => {
      console.error('Hán Việt', err)
      loading = null // lần sau thử lại (vd. vừa có mạng)
    })
  return loading
}

/** Bảng tra (null khi chưa tải xong — component tự render lại khi có). */
export function useHanviet(): Data | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      void load()
      return () => listeners.delete(l)
    },
    () => data,
  )
}

const HAN = /\p{Script=Han}/u

/** pinyin-pro (nü3, de0) → khóa của dữ liệu (nu:3, de5). */
const toKey = (py: string) => py.replace(/ü/g, 'u:').replace(/0$/, '5')

export interface CharReading {
  /** Âm theo pinyin của chữ trong từ (có thể nhiều âm, vd. 斷 duàn → đoạn, đoán). */
  main: string[]
  /** Các âm khác của chữ (cách đọc khác). */
  other: string[]
}

function lookup(d: Data, char: string, py: string): CharReading {
  const m = d[char]
  if (!m) return { main: [], other: [] }
  const all = [...new Set(Object.values(m).flatMap((v) => v.split(',')))]
  const key = toKey(py)
  let main = m[key]?.split(',') ?? m['*']?.split(',')
  // Thanh nhẹ: dữ liệu thường chỉ ghi thanh gốc → gom âm của các thanh 1–4.
  if (!main && key.endsWith('5')) main = [...new Set([1, 2, 3, 4].flatMap((t) => m[key.slice(0, -1) + t]?.split(',') ?? []))]
  if (!main?.length) return { main: all, other: [] }
  return { main, other: all.filter((h) => !main.includes(h)) }
}

/** Âm Hán Việt từng chữ Hán trong từ, khớp thứ tự với hanChars. */
export function charReadings(d: Data, text: string): CharReading[] {
  const chars = Array.from(text).filter((c) => HAN.test(c))
  if (!chars.length) return []
  const pys = pinyin(chars.join(''), { toneType: 'num', type: 'array' })
  return chars.map((c, i) => lookup(d, c, pys[i] ?? ''))
}

/** Âm Hán Việt cả từ, mỗi chữ lấy âm đầu tiên (vd. 学生 → "học sinh"). Rỗng nếu không tra được chữ nào. */
export function wordHanviet(d: Data, text: string) {
  const rs = charReadings(d, text)
  if (!rs.some((r) => r.main.length)) return ''
  return rs.map((r) => r.main[0] ?? '?').join(' ')
}
