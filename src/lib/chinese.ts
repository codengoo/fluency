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

/** Cấu hình giọng đọc, lưu riêng trên từng máy (localStorage) vì giọng khác nhau theo thiết bị. */
export type TtsSettings = {
  /** voiceURI của giọng đã chọn; rỗng = tự chọn. */
  voiceURI: string
  rate: number
  pitch: number
  volume: number
}

export const TTS_DEFAULTS: TtsSettings = { voiceURI: '', rate: 0.8, pitch: 1, volume: 1 }
const TTS_KEY = 'fluency:tts'

function loadTts(): TtsSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(TTS_KEY) ?? '{}') as Partial<TtsSettings>
    return { ...TTS_DEFAULTS, ...raw }
  } catch {
    return { ...TTS_DEFAULTS }
  }
}

let tts: TtsSettings = typeof window !== 'undefined' ? loadTts() : { ...TTS_DEFAULTS }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function getTtsSettings() {
  return tts
}

export function setTtsSettings(patch: Partial<TtsSettings>) {
  tts = { ...tts, ...patch }
  try {
    localStorage.setItem(TTS_KEY, JSON.stringify(tts))
  } catch {}
  voice = undefined
  notify()
}

export function resetTtsSettings() {
  tts = { ...TTS_DEFAULTS }
  try {
    localStorage.removeItem(TTS_KEY)
  } catch {}
  voice = undefined
  notify()
}

/** Đăng ký nghe thay đổi cấu hình / danh sách giọng (cho useSyncExternalStore). */
export function subscribeTts(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

let voice: SpeechSynthesisVoice | null | undefined

function isChinese(v: SpeechSynthesisVoice) {
  return /^(zh|cmn|yue)([-_]|$)/i.test(v.lang) || /chinese|mandarin|cantonese|普通话|中文|國語|粤語/i.test(v.name)
}

let voiceList: SpeechSynthesisVoice[] = []

/** Danh sách giọng của máy: giọng tiếng Trung trước, rồi tới các giọng khác. */
export function listVoices() {
  return voiceList
}

function refreshVoices() {
  const all = canSpeak() ? speechSynthesis.getVoices() : []
  const zh = all.filter(isChinese)
  voiceList = [...zh, ...all.filter((v) => !isChinese(v))]
  voice = undefined
  notify()
}

function pickAuto(voices: SpeechSynthesisVoice[]) {
  const zh = voices.filter(isChinese)
  const mainland = zh.filter((v) => /CN|Hans/i.test(v.lang))
  const pool = mainland.length ? mainland : zh
  // Ưu tiên giọng chất lượng cao (Google / Microsoft Online / iOS "Tingting").
  return pool.find((v) => /natural|online|google|tingting|xiaoxiao|yunxi/i.test(v.name)) ?? pool[0] ?? null
}

function pickVoice() {
  if (!canSpeak()) return null
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return undefined
  if (tts.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === tts.voiceURI)
    if (chosen) return chosen
  }
  return pickAuto(voices)
}

/** Tên giọng sẽ được dùng khi để "Tự động". */
export function autoVoiceName() {
  if (!canSpeak()) return ''
  return pickAuto(speechSynthesis.getVoices())?.name ?? ''
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
  refreshVoices()
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, opts: Partial<TtsSettings> = {}) {
  if (!canSpeak() || !text.trim()) return false
  if (voice === undefined) voice = pickVoice()
  const cfg = { ...tts, ...opts }
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? 'zh-CN'
  if (voice) u.voice = voice
  u.rate = cfg.rate
  u.pitch = cfg.pitch
  u.volume = cfg.volume
  speechSynthesis.speak(u)
  return true
}

export function hasChineseVoice() {
  return canSpeak() && speechSynthesis.getVoices().some(isChinese)
}
