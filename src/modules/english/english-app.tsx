import { useEffect, useState, type ReactNode } from 'react'
import { BookOpenTextIcon, ClipboardPasteIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPosition, splitReading, wordCount } from '@/lib/reading'
import { useStore } from '@/lib/store'
import type { Reading } from '@/lib/types'
import { Reader } from './reader'
import { ReadingEditor } from './reading-editor'

// Module tiếng Anh. Hiện có: Bài đọc (dán bài → nghe đọc lại từng câu).

export default function EnglishApp({ brand }: { brand: ReactNode }) {
  const { ready, readings } = useStore()
  const [readingId, setReadingId] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ open: boolean; reading: Reading | null }>({ open: false, reading: null })
  const reading = readings.find((r) => r.id === readingId) ?? null

  // Nút Back của điện thoại / trình duyệt: từ bài đọc quay về danh sách.
  useEffect(() => {
    const onPop = () => setReadingId(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const openReading = (id: string) => {
    history.pushState({ reading: id }, '')
    setReadingId(id)
    window.scrollTo({ top: 0 })
  }
  const closeReading = () => (history.state?.reading ? history.back() : setReadingId(null))

  // Bài bị xóa (kể cả từ máy khác) → về danh sách.
  useEffect(() => {
    if (readingId && ready && !reading) setReadingId(null)
  }, [readingId, reading, ready])

  const newReading = () => setEditor({ open: true, reading: null })

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 sm:max-w-3xl sm:px-6 lg:max-w-6xl lg:pt-6 lg:pb-12">
      {reading ? (
        <Reader reading={reading} onBack={closeReading} onEdit={() => setEditor({ open: true, reading })} />
      ) : (
        <>
          <header className="mb-4 flex items-center gap-2 lg:mb-6">{brand}</header>
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="flex-1 text-xl font-bold">
                Bài đọc {readings.length > 0 && <span className="ml-1 text-base font-normal text-muted-foreground">{readings.length}</span>}
              </h2>
              <Button variant="brand" onClick={newReading} className="hidden sm:inline-flex">
                <ClipboardPasteIcon /> Dán bài đọc
              </Button>
            </div>

            {!ready ? null : readings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center">
                <BookOpenTextIcon className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">Chưa có bài đọc nào. Dán một bài tiếng Anh để nghe đọc lại.</p>
                <button onClick={newReading} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
                  Dán bài đọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {readings.map((r, i) => (
                  <ReadingCard key={r.id} reading={r} index={i} onOpen={() => openReading(r.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Điện thoại: nút nổi giống "Thêm từ" của module tiếng Trung. */}
          <button
            onClick={newReading}
            className="fixed right-[max(1.25rem,calc(50%-15rem))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95 sm:hidden"
          >
            <PlusIcon className="size-5" /> Dán bài đọc
          </button>
        </>
      )}

      <ReadingEditor
        open={editor.open}
        reading={editor.reading}
        onOpenChange={(open) => setEditor((s) => ({ ...s, open }))}
        onSaved={(r, isNew) => isNew && openReading(r.id)}
        onDeleted={closeReading}
      />
    </div>
  )
}

function ReadingCard({ reading, index, onOpen }: { reading: Reading; index: number; onOpen: () => void }) {
  const total = splitReading(reading.text).length
  const pos = loadPosition(reading.id)
  const words = wordCount(reading.text)
  const preview = reading.text.replace(/\s+/g, ' ').slice(0, 220)
  return (
    <button
      onClick={onOpen}
      className="animate-stagger flex flex-col gap-2 rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-transform active:scale-[0.99]"
      style={{ '--i': index } as React.CSSProperties}
    >
      <span className="line-clamp-1 font-semibold">{reading.title}</span>
      <span lang="en" className="line-clamp-3 text-sm text-muted-foreground">
        {preview}
      </span>
      <span className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <span>
          {words} từ · {total} câu
        </span>
        {pos > 0 && total > 0 && (
          <>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(((pos + 1) / total) * 100)}%` }} />
            </span>
            <span className="tabular-nums">
              {pos + 1}/{total}
            </span>
          </>
        )}
      </span>
    </button>
  )
}
