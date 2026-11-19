// Pinyin (pinyin-pro, chạy offline trên máy) + đọc to (Web Speech API, giọng zh-CN của hệ điều hành).

import { pinyin } from 'pinyin-pro'

const HAN = /\p{Script=Han}/u

export function hasHanzi(text: string) {
  return HAN.test(text)
}

/** Pinyin có dấu thanh. Câu: viết hoa chữ đầu, bỏ khoảng trắng trước dấu câu. */
export function toPinyin(text: string, sentence = false) {
  const t = text.trim()
  if (!t || !hasHanzi(t)) return ''
  let out = pinyin(t, { toneType: 'symbol', nonZh: 'consecutive' })
    .replace(/\s+/g, ' ')
    .replace(/\s*([，。！？、；：,.!?;:）)」』”])/g, (_, p: string) => toAsciiPunct(p))
    .replace(/([（(「『“])\s*/g, (_, p: string) => toAsciiPunct(p))
    .replace(/([,.!?;:])(?=\S)/g, '$1 ')
    .trim()
  if (sentence) out = out.charAt(0).toUpperCase() + out.slice(1)
  return out
}

const PUNCT: Record<string, string> = { '，': ',', '。': '.', '！': '!', '？': '?', '、': ',', '；': ';', '：': ':', '（': '(', '）': ')', '“': '"', '”': '"' }
function toAsciiPunct(p: string) {
  return PUNCT[p] ?? p
}

/** Chuỗi để tìm kiếm: bỏ dấu tiếng Việt / dấu thanh pinyin, chữ thường, bỏ khoảng trắng. */
export function fold(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, '')
}

// ───────────── Đọc to ─────────────

let voice: SpeechSynthesisVoice | null | undefined

function pickVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return undefined
  const zh = voices.filter((v) => /^zh[-_]?(CN|Hans)?/i.test(v.lang) || /chinese|mandarin|普通话|中文/i.test(v.name))
  const mainland = zh.filter((v) => /CN|Hans/i.test(v.lang))
  const pool = mainland.length ? mainland : zh
  // Ưu tiên giọng chất lượng cao (Google / Microsoft Online / iOS "Tingting").
  return pool.find((v) => /natural|online|google|tingting|xiaoxiao|yunxi/i.test(v.name)) ?? pool[0] ?? null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.addEventListener?.('voiceschanged', () => (voice = pickVoice()))
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, rate = 0.8) {
  if (!canSpeak() || !text.trim()) return false
  if (voice === undefined) voice = pickVoice()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? 'zh-CN'
  if (voice) u.voice = voice
  u.rate = rate
  speechSynthesis.speak(u)
  return true
}

export function hasChineseVoice() {
  if (voice === undefined) voice = pickVoice()
  return Boolean(voice)
}
