// Giao thức đồng bộ dùng chung client + Worker.
// Mỗi bản ghi (từ / chủ đề / bài đọc) đi kèm updatedAt; bản sửa sau cùng thắng (last-write-wins).
// Xóa là xóa mềm (deleted = true) để máy khác cũng biết mà xóa.

export const RECORD_KINDS = ['word', 'topic', 'reading'] as const
export type RecordKind = (typeof RECORD_KINDS)[number]

/** Giới hạn kích thước một bản ghi (JSON). Bài đọc dán vào có thể dài nên được rộng hơn. */
export const MAX_RECORD_BYTES: Record<RecordKind, number> = { word: 32 * 1024, topic: 32 * 1024, reading: 256 * 1024 }

export interface WireRecord {
  id: string
  kind: RecordKind
  updatedAt: number
  deleted: boolean
  data: Record<string, unknown>
}

export interface SyncRequest {
  /** seq lớn nhất client đã nhận từ server. */
  since: number
  changes: WireRecord[]
}

export interface SyncResponse {
  cursor: number
  records: WireRecord[]
  /** Còn bản ghi chưa trả hết (lô có giới hạn) → gọi tiếp với since = cursor. */
  more: boolean
}

export const KEY_RE = /^[A-Za-z0-9_-]{22,64}$/
export const MAX_CHANGES = 2000
export const PAGE_SIZE = 2000
