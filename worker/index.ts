// Worker: POST /api/lib/:key/sync → Durable Object của sổ từ đó. Còn lại là file tĩnh.
// Khóa (key) là bí mật ngẫu nhiên sinh trên máy: ai có khóa thì vào được sổ (giống link nhóm của chiatien).

import { DurableObject } from 'cloudflare:workers'
import { KEY_RE, MAX_CHANGES, MAX_RECORD_BYTES, PAGE_SIZE, RECORD_KINDS, type SyncRequest, type SyncResponse, type WireRecord } from '../shared/sync.ts'

const SYNC_RE = /^\/api\/lib\/([^/]+)\/sync$/
const MAX_BODY = 4 * 1024 * 1024

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    const m = pathname.match(SYNC_RE)
    if (!m) return json(404, { error: 'not_found' })
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })
    const key = m[1]
    if (!KEY_RE.test(key)) return json(400, { error: 'bad_key' })
    const text = await request.text()
    if (text.length > MAX_BODY) return json(413, { error: 'too_large' })
    let body: SyncRequest
    try {
      body = parseRequest(JSON.parse(text))
    } catch (err) {
      return json(400, { error: (err as Error).message || 'bad_request' })
    }
    try {
      const stub = env.LIBRARIES.get(env.LIBRARIES.idFromName(key))
      return json(200, await stub.sync(body))
    } catch (err) {
      console.error(err)
      return json(500, { error: 'server' })
    }
  },
} satisfies ExportedHandler<Env>

function parseRequest(raw: unknown): SyncRequest {
  if (!raw || typeof raw !== 'object') throw new Error('bad_request')
  const { since, changes } = raw as Record<string, unknown>
  if (!Number.isSafeInteger(since) || (since as number) < 0) throw new Error('bad_since')
  if (!Array.isArray(changes) || changes.length > MAX_CHANGES) throw new Error('bad_changes')
  for (const c of changes as WireRecord[]) {
    if (!c || typeof c.id !== 'string' || c.id.length === 0 || c.id.length > 64) throw new Error('bad_id')
    if (!RECORD_KINDS.includes(c.kind)) throw new Error('bad_kind')
    if (!Number.isSafeInteger(c.updatedAt)) throw new Error('bad_updated_at')
    if (typeof c.deleted !== 'boolean') throw new Error('bad_deleted')
    if (!c.data || typeof c.data !== 'object' || JSON.stringify(c.data).length > MAX_RECORD_BYTES[c.kind]) throw new Error('bad_data')
  }
  return { since: since as number, changes: changes as WireRecord[] }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

type Row = { id: string; kind: string; data: string; updated_at: number; deleted: number; seq: number }

/** Một sổ từ. Durable Object xử lý request tuần tự nên bộ đếm seq không bị tranh chấp. */
export class LibraryStore extends DurableObject<Env> {
  private sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS recs (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        seq INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS recs_seq ON recs(seq);
    `)
  }

  sync({ since, changes }: SyncRequest): SyncResponse {
    let seq = Number(this.sql.exec('SELECT COALESCE(MAX(seq), 0) AS s FROM recs').one().s)
    for (const c of changes) {
      const cur = this.sql.exec('SELECT updated_at FROM recs WHERE id = ?', c.id).toArray()[0]
      if (cur && Number(cur.updated_at) >= c.updatedAt) continue
      seq++
      this.sql.exec(
        'INSERT OR REPLACE INTO recs (id, kind, data, updated_at, deleted, seq) VALUES (?, ?, ?, ?, ?, ?)',
        c.id,
        c.kind,
        JSON.stringify(c.data),
        c.updatedAt,
        c.deleted ? 1 : 0,
        seq,
      )
    }
    const rows = this.sql
      .exec('SELECT * FROM recs WHERE seq > ? ORDER BY seq LIMIT ?', since, PAGE_SIZE + 1)
      .toArray() as unknown as Row[]
    const more = rows.length > PAGE_SIZE
    const page = more ? rows.slice(0, PAGE_SIZE) : rows
    return {
      cursor: page.length ? page[page.length - 1].seq : Math.max(since, seq),
      more,
      records: page.map((r) => ({
        id: r.id,
        kind: r.kind as WireRecord['kind'],
        updatedAt: r.updated_at,
        deleted: r.deleted === 1,
        data: JSON.parse(r.data),
      })),
    }
  }
}
