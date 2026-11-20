// Dữ liệu nét chữ cho luyện viết: mỗi chữ một file JSON (Make Me a Hanzi, qua gói hanzi-writer-data trên jsDelivr).
// Tải khi cần; service worker cache lại (cache `cdn-…`) nên chữ đã luyện một lần thì lần sau viết được khi offline.

import type { CharacterJson } from 'hanzi-writer'

const HAN = /\p{Script=Han}/u
const DATA_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/'

/** Các chữ Hán trong chuỗi (bỏ dấu câu, chữ Latin, khoảng trắng). */
export function hanChars(text: string) {
  return Array.from(text).filter((c) => HAN.test(c))
}

export class StrokeError extends Error {
  readonly reason: 'missing' | 'network'
  constructor(reason: 'missing' | 'network') {
    super(reason === 'missing' ? 'Chưa có dữ liệu nét cho chữ này' : 'Không tải được dữ liệu nét (mất mạng?)')
    this.reason = reason
  }
}

const memo = new Map<string, Promise<CharacterJson>>()

export function loadStrokes(char: string): Promise<CharacterJson> {
  let p = memo.get(char)
  if (!p) {
    p = fetch(DATA_URL + encodeURIComponent(char) + '.json')
      .catch(() => {
        throw new StrokeError('network')
      })
      .then((res) => {
        if (res.status === 404) throw new StrokeError('missing')
        if (!res.ok) throw new StrokeError('network')
        return res.json() as Promise<CharacterJson>
      })
    // Lỗi thì không nhớ, để lần sau (có mạng lại) thử tiếp.
    p.catch(() => memo.delete(char))
    memo.set(char, p)
  }
  return p
}
