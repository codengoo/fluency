export interface Word {
  id: string
  kind: 'word'
  hanzi: string
  pinyin: string
  meaning: string
  example: string
  examplePinyin: string
  exampleMeaning: string
  /** Ghi chú tự do (mẹo nhớ, cách dùng…). Bản ghi cũ không có. */
  note?: string
  topicIds: string[]
  createdAt: number
  updatedAt: number
  deleted?: boolean
}

export interface Topic {
  id: string
  kind: 'topic'
  name: string
  emoji: string
  createdAt: number
  updatedAt: number
  deleted?: boolean
}

/** Bài đọc tiếng Anh (dán vào để nghe đọc lại). */
export interface Reading {
  id: string
  kind: 'reading'
  lang: 'en'
  title: string
  text: string
  createdAt: number
  updatedAt: number
  deleted?: boolean
}

export type Rec = Word | Topic | Reading

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'
