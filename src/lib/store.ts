// Kho dữ liệu offline-first: mọi thao tác đọc/ghi vào bộ nhớ + IndexedDB ngay,
// rồi đồng bộ nền lên Durable Object của sổ từ (POST /api/lib/:key/sync).

import { useSyncExternalStore } from 'react'
import { get, set } from 'idb-keyval'
import { KEY_RE, type SyncResponse, type WireRecord } from '@shared/sync'
import { seedRecords } from './seed'
import type { Rec, SyncStatus, Topic, Word } from './types'

const DB_KEY = 'fluency.db'
const LIB_KEY = 'fluency.key'

interface Persisted {
  recs: Rec[]
  dirty: string[]
  cursor: number
  lastSyncAt: number
}

export interface Snapshot {
  ready: boolean
  words: Word[]
  topics: Topic[]
  status: SyncStatus
  pending: number
  lastSyncAt: number
  key: string
}

const recs = new Map<string, Rec>()
const dirty = new Set<string>()
let cursor = 0
let lastSyncAt = 0
let status: SyncStatus = 'idle'
let ready = false
let key = ''

const listeners = new Set<() => void>()
let snapshot: Snapshot = build()

function build(): Snapshot {
  const words: Word[] = []
  const topics: Topic[] = []
  for (const r of recs.values()) {
    if (r.deleted) continue
    if (r.kind === 'word') words.push(r)
    else topics.push(r)
  }
  words.sort((a, b) => a.createdAt - b.createdAt)
  topics.sort((a, b) => a.createdAt - b.createdAt)
  return { ready, words, topics, status, pending: dirty.size, lastSyncAt, key }
}

function emit() {
  snapshot = build()
  for (const l of listeners) l()
}

export function useStore(): Snapshot {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
  )
}

// ───────────── Lưu xuống IndexedDB ─────────────

let persistTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const data: Persisted = { recs: [...recs.values()], dirty: [...dirty], cursor, lastSyncAt }
    set(DB_KEY, data).catch((err) => console.error('IndexedDB', err))
  }, 150)
}

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Đọc khóa từ link "#k=..." (mở trên máy mới) rồi xóa khỏi thanh địa chỉ. */
function keyFromHash(): string | null {
  const m = location.hash.match(/[#&]k=([A-Za-z0-9_-]+)/)
  if (!m || !KEY_RE.test(m[1])) return null
  history.replaceState(null, '', location.pathname + location.search)
  return m[1]
}

export async function init() {
  const fromHash = keyFromHash()
  let stored = ''
  try {
    stored = localStorage.getItem(LIB_KEY) ?? ''
  } catch {}
  const saved = await get<Persisted>(DB_KEY).catch(() => undefined)

  if (fromHash && fromHash !== stored) {
    // Chuyển sang sổ khác: bỏ dữ liệu cũ nếu nó chỉ là dữ liệu mẫu chưa sửa, còn không thì gộp lên sổ mới.
    key = fromHash
    const local = saved?.recs ?? []
    const onlySeed = local.every((r) => r.updatedAt <= 1)
    for (const r of onlySeed ? [] : local) {
      recs.set(r.id, r)
      dirty.add(r.id)
    }
    cursor = 0
  } else if (stored && KEY_RE.test(stored)) {
    key = stored
    for (const r of saved?.recs ?? []) recs.set(r.id, r)
    for (const id of saved?.dirty ?? []) dirty.add(id)
    cursor = saved?.cursor ?? 0
    lastSyncAt = saved?.lastSyncAt ?? 0
    // Bổ sung chủ đề mẫu mới ra sau khi sổ đã tạo. Bản đã sửa/xóa vẫn nằm trong recs (xóa mềm) nên không bị thêm lại;
    // updatedAt = 1 nên trên server bản thật luôn thắng.
    for (const r of seedRecords()) {
      if (recs.has(r.id)) continue
      recs.set(r.id, r)
      dirty.add(r.id)
    }
  } else {
    // Lần đầu dùng: tạo sổ mới + dữ liệu mẫu (updatedAt = 1 nên không bao giờ đè dữ liệu thật).
    key = randomKey()
    for (const r of seedRecords()) {
      recs.set(r.id, r)
      dirty.add(r.id)
    }
  }
  try {
    localStorage.setItem(LIB_KEY, key)
  } catch {}
  ready = true
  persist()
  emit()
  startAutoSync()
}

// ───────────── Ghi ─────────────

export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}

function stamp(prev?: Rec) {
  return Math.max(Date.now(), (prev?.updatedAt ?? 0) + 1)
}

function put(rec: Rec) {
  recs.set(rec.id, rec)
  dirty.add(rec.id)
  persist()
  emit()
  scheduleSync()
}

export function saveWord(input: Omit<Word, 'id' | 'kind' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const prev = input.id ? (recs.get(input.id) as Word | undefined) : undefined
  const word: Word = {
    ...input,
    id: input.id ?? newId(),
    kind: 'word',
    createdAt: prev?.createdAt ?? Date.now(),
    updatedAt: stamp(prev),
    deleted: false,
  }
  put(word)
  return word
}

export function saveTopic(input: { id?: string; name: string; emoji: string }) {
  const prev = input.id ? (recs.get(input.id) as Topic | undefined) : undefined
  const topic: Topic = {
    id: input.id ?? newId(),
    kind: 'topic',
    name: input.name,
    emoji: input.emoji,
    createdAt: prev?.createdAt ?? Date.now(),
    updatedAt: stamp(prev),
    deleted: false,
  }
  put(topic)
  return topic
}

export function removeRecord(id: string) {
  const prev = recs.get(id)
  if (!prev) return
  put({ ...prev, deleted: true, updatedAt: stamp(prev) } as Rec)
}

/** Xóa chủ đề: từ vựng vẫn giữ, chỉ bỏ khỏi chủ đề đó. */
export function removeTopic(id: string) {
  for (const r of [...recs.values()]) {
    if (r.kind === 'word' && !r.deleted && r.topicIds.includes(id)) {
      put({ ...r, topicIds: r.topicIds.filter((t) => t !== id), updatedAt: stamp(r) })
    }
  }
  removeRecord(id)
}

export function getRecord(id: string) {
  return recs.get(id)
}

// ───────────── Đồng bộ ─────────────

function toWire(r: Rec): WireRecord {
  const { id, kind, updatedAt, deleted, ...rest } = r
  return { id, kind, updatedAt, deleted: Boolean(deleted), data: rest as Record<string, unknown> }
}

function fromWire(w: WireRecord): Rec {
  return { ...(w.data as object), id: w.id, kind: w.kind, updatedAt: w.updatedAt, deleted: w.deleted } as Rec
}

let syncing = false
let again = false
let syncTimer: ReturnType<typeof setTimeout> | undefined

function setStatus(s: SyncStatus) {
  if (status === s) return
  status = s
  emit()
}

function scheduleSync(delay = 800) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => void syncNow(), delay)
}

export async function syncNow() {
  if (!key) return
  if (syncing) {
    again = true
    return
  }
  if (!navigator.onLine) return setStatus('offline')
  syncing = true
  setStatus('syncing')
  try {
    let first = true
    let more = true
    while (more) {
      // Gửi ảnh chụp các bản ghi đang chờ; bản nào bị sửa tiếp trong lúc gửi thì giữ lại cho lần sau.
      const sent = first ? [...dirty].map((id) => recs.get(id)!).filter(Boolean) : []
      first = false
      const res = await fetch(`/api/lib/${key}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: cursor, changes: sent.map(toWire) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as SyncResponse
      for (const r of sent) if (recs.get(r.id)?.updatedAt === r.updatedAt) dirty.delete(r.id)
      for (const w of body.records) {
        const cur = recs.get(w.id)
        if (!cur || w.updatedAt > cur.updatedAt) {
          recs.set(w.id, fromWire(w))
          dirty.delete(w.id)
        }
      }
      cursor = body.cursor
      more = body.more
    }
    lastSyncAt = Date.now()
    persist()
    status = 'idle'
    emit()
  } catch (err) {
    console.warn('sync', err)
    setStatus(navigator.onLine ? 'error' : 'offline')
  } finally {
    syncing = false
    if (again) {
      again = false
      scheduleSync(100)
    }
  }
}

function startAutoSync() {
  void syncNow()
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => setStatus('offline'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  // Lấy thay đổi từ máy khác khi app đang mở.
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow()
  }, 30_000)
}

// ───────────── Sổ từ / sao lưu ─────────────

export function shareLink() {
  return `${location.origin}/#k=${key}`
}

/** Dùng sổ khác (dán link/khóa từ máy kia). */
export function switchLibrary(input: string) {
  const m = input.trim().match(/(?:k=)?([A-Za-z0-9_-]{22,64})$/)
  if (!m) return false
  location.hash = `k=${m[1]}`
  location.reload()
  return true
}

export function exportJson() {
  const data = { app: 'fluency', version: 1, exportedAt: new Date().toISOString(), records: [...recs.values()].filter((r) => !r.deleted) }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `fluency-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function importJson(file: File) {
  const data = JSON.parse(await file.text()) as { records?: Rec[] }
  if (!Array.isArray(data.records)) throw new Error('File không đúng định dạng')
  let n = 0
  for (const r of data.records) {
    if (!r?.id || (r.kind !== 'word' && r.kind !== 'topic')) continue
    const cur = recs.get(r.id)
    if (cur && cur.updatedAt >= r.updatedAt) continue
    recs.set(r.id, { ...r, updatedAt: stamp(cur) })
    dirty.add(r.id)
    n++
  }
  persist()
  emit()
  scheduleSync(100)
  return n
}
