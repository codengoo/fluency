// Giao thức đồng bộ dùng chung client + Worker.
// Mỗi bản ghi (từ / chủ đề) đi kèm updatedAt; bản sửa sau cùng thắng (last-write-wins).
// Xóa là xóa mềm (deleted = true) để máy khác cũng biết mà xóa.

export type RecordKind = 'word' | 'topic'

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
