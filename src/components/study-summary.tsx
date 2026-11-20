import { RotateCcwIcon, ShuffleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Deck } from '@/lib/flashcard'
import type { Word } from '@/lib/types'

// Màn tổng kết cuối lượt, dùng chung cho Flashcard và Nghe & chọn.

export function StudySummary({ deck, byId }: { deck: Deck; byId: Map<string, Word> }) {
  const firstTry = deck.total - deck.missed.length
  const missed = deck.missed.map((id) => byId.get(id)).filter((w): w is Word => Boolean(w))

  return (
    <div className="animate-tab-in flex flex-col items-center gap-2 py-4 text-center">
      <span className="font-hanzi text-5xl text-brand">{missed.length === 0 ? '棒' : '好'}</span>
      <p className="text-lg font-semibold">Xong lượt {deck.total} từ</p>
      <p className="text-muted-foreground">
        Đúng ngay lần đầu: <span className="font-semibold text-foreground tabular-nums">{firstTry}/{deck.total}</span>
      </p>
      {missed.length > 0 && (
        <div className="mt-3 w-full text-left">
          <p className="mb-1.5 text-sm text-muted-foreground">Phải ôn lại:</p>
          <ul className="divide-y divide-border/70 rounded-2xl bg-card ring-1 ring-border">
            {missed.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-2">
                <span className="font-hanzi text-2xl">{w.hanzi}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted-foreground">{w.pinyin}</span>
                  <span className="block truncate text-sm">{w.meaning || '—'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Nút cuối lượt: ôn lại các từ sai (nếu có) / làm lại cả lượt. */
export function SummaryActions({ deck, allIds, onRestart }: { deck: Deck; allIds: string[]; onRestart: (ids: string[]) => void }) {
  const hasMissed = deck.missed.length > 0
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {hasMissed && (
        <Button variant="brand" size="lg" className="h-12 flex-1" onClick={() => onRestart(deck.missed)}>
          <RotateCcwIcon /> Ôn {deck.missed.length} từ chưa thuộc
        </Button>
      )}
      <Button variant={hasMissed ? 'secondary' : 'brand'} size="lg" className="h-12 flex-1" onClick={() => onRestart(allIds)}>
        <ShuffleIcon /> Học lại
      </Button>
    </div>
  )
}
