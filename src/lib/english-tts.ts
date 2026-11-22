// Đọc tiếng Anh bằng Web Speech API. Cấu hình riêng với giọng tiếng Trung (lưu theo từng máy).

import { useSyncExternalStore } from 'react'

export type EnTtsSettings = {
  /** voiceURI của giọng đã chọn; rỗng = tự chọn. */
  voiceURI: string
  rate: number
}

const KEY = 'fluency:tts-en'
export const EN_TTS_DEFAULTS: EnTtsSettings = { voiceURI: '', rate: 0.9 }

function load(): EnTtsSettings {
  try {
    return { ...EN_TTS_DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<EnTtsSettings>) }
  } catch {
    return { ...EN_TTS_DEFAULTS }
  }
}

let settings: EnTtsSettings = typeof window !== 'undefined' ? load() : { ...EN_TTS_DEFAULTS }
let voices: SpeechSynthesisVoice[] = []
let version = 0
const listeners = new Set<() => void>()
const notify = () => {
  version++
  listeners.forEach((l) => l())
}

export function canSpeakEn() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

const isEnglish = (v: SpeechSynthesisVoice) => /^en([-_]|$)/i.test(v.lang)

function refresh() {
  const all = canSpeakEn() ? speechSynthesis.getVoices() : []
  // Giọng Mỹ trước, rồi Anh, rồi các giọng tiếng Anh khác; giọng chất lượng cao lên đầu mỗi nhóm.
  const rank = (v: SpeechSynthesisVoice) =>
    (/en[-_]US/i.test(v.lang) ? 0 : /en[-_]GB/i.test(v.lang) ? 1 : 2) * 2 + (/natural|online|google|premium|enhanced/i.test(v.name) ? 0 : 1)
  voices = all.filter(isEnglish).sort((a, b) => rank(a) - rank(b))
  notify()
}

if (canSpeakEn()) {
  speechSynthesis.addEventListener?.('voiceschanged', refresh)
  refresh()
}

export function englishVoices() {
  return voices
}

export function getEnTts() {
  return settings
}

export function setEnTts(patch: Partial<EnTtsSettings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {}
  notify()
}

/** Cấu hình + danh sách giọng, tự cập nhật khi đổi. */
export function useEnTts() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => version,
  )
  return { settings, voices }
}

export function currentVoice(): SpeechSynthesisVoice | null {
  if (settings.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === settings.voiceURI)
    if (chosen) return chosen
  }
  return voices[0] ?? null
}

export interface SpeakOptions {
  rate?: number
  /** Vị trí từ đang đọc (charIndex trong text). Không phải giọng nào cũng báo (giọng online của Chrome thường không). */
  onWord?: (start: number, end: number) => void
  onEnd?: () => void
}

let token = 0

/** Đọc một đoạn ngắn (một câu). Gọi lại sẽ dừng đoạn đang đọc; onEnd của đoạn bị dừng không được gọi. */
export function speakEn(text: string, opts: SpeakOptions = {}) {
  if (!canSpeakEn() || !text.trim()) return false
  const my = ++token
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = currentVoice()
  u.lang = voice?.lang ?? 'en-US'
  if (voice) u.voice = voice
  u.rate = opts.rate ?? settings.rate
  u.onboundary = (e) => {
    if (my !== token || e.name !== 'word') return
    const start = e.charIndex
    const len = e.charLength || text.slice(start).match(/^[\w'’-]+/)?.[0].length || 0
    if (len) opts.onWord?.(start, start + len)
  }
  const done = () => {
    if (my === token) opts.onEnd?.()
  }
  u.onend = done
  u.onerror = (e) => {
    // "interrupted"/"canceled" là do mình gọi cancel(): không coi là đọc xong.
    if (e.error !== 'interrupted' && e.error !== 'canceled') done()
  }
  speechSynthesis.speak(u)
  return true
}

export function stopEn() {
  token++
  if (canSpeakEn()) speechSynthesis.cancel()
}
