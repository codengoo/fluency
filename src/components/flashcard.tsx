import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { answer, isDone, startDeck, type Deck } from '@/lib/flashcard'
import { useHanviet, wordHanviet } from '@/lib/hanviet'
import type { Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SpeakButton } from './speak-button'
import { StudySummary, SummaryActions } from './study-summary'

// Flashcard: nhìn mặt trước, lật, tự đánh giá. "Chưa nhớ" thì thẻ xuống cuối lượt; hết thẻ thì tổng kết.
// Phím tắt: Space/Enter lật, ← Chưa nhớ, → Nhớ rồi.

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Danh sách từ của lượt (chốt lúc mở). */
  words: Word[]
}

type Front = 'hanzi' | 'meaning'

const FRONT_KEY = 'fluency:flashcard-front'

function readFront(): Front {
  try {
    return localStorage.getItem(FRONT_KEY) === 'meaning' ? 'meaning' : 'hanzi'
  } catch {
    return 'hanzi'
  }
}

export default function Flashcard({ open, onOpenChange, words }: Props) {
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  const [deck, setDeck] = useState<Deck>(() => startDeck(words.map((w) => w.id)))
  const [flipped, setFlipped] = useState(false)
  // Tăng mỗi lần trả lời: đổi key để thẻ mới hiện ngay mặt trước, không chạy hiệu ứng lật ngược.
  const [step, setStep] = useState(0)
  const [front, setFront] = useState<Front>(readFront)

  const restart = (ids: string[]) => {
    setDeck(startDeck(ids))
    setFlipped(false)
    setStep((s) => s + 1)
  }

  // Mỗi lần mở: lượt mới, xáo lại.
  useEffect(() => {
    if (open) restart(words.map((w) => w.id))
  }, [open, words])

  const done = isDone(deck)
  const word = done ? undefined : byId.get(deck.queue[0])
  const learned = deck.total - deck.queue.length

  const reply = (remembered: boolean) => {
    if (!flipped || done) return
    setDeck((d) => answer(d, remembered))
    setFlipped(false)
    setStep((s) => s + 1)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (done) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft') reply(false)
      else if (e.key === 'ArrowRight') reply(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const changeFront = (f: Front) => {
    setFront(f)
    setFlipped(false)
    try {
      localStorage.setItem(FRONT_KEY, f)
    } catch {}
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Flashcard<span className="ml-2 font-normal text-muted-foreground tabular-nums">{learned}/{deck.total}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Nhớ ra rồi mới lật thẻ. Từ chưa nhớ sẽ gặp lại cuối lượt.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${deck.total ? (learned / deck.total) * 100 : 0}%` }} />
          </div>

          {word ? (
            <>
              <div className="mb-3 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
                {(['hanzi', 'meaning'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => changeFront(f)}
                    aria-pressed={front === f}
                    className={cn('rounded-lg py-1.5 transition-all', front === f ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                  >
                    {f === 'hanzi' ? 'Hán → Nghĩa' : 'Nghĩa → Hán'}
                  </button>
                ))}
              </div>
              <Card key={step} word={word} front={front} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
            </>
          ) : (
            <StudySummary deck={deck} byId={byId} />
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          {word ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" className="h-12" disabled={!flipped} onClick={() => reply(false)}>
                <XIcon /> Chưa nhớ
              </Button>
              <Button variant="brand" size="lg" className="h-12" disabled={!flipped} onClick={() => reply(true)}>
                <CheckIcon /> Nhớ rồi
              </Button>
            </div>
          ) : (
            <SummaryActions deck={deck} allIds={words.map((w) => w.id)} onRestart={restart} />
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function Card({ word, front, flipped, onFlip }: { word: Word; front: Front; flipped: boolean; onFlip: () => void }) {
  const hasExample = Boolean(word.example.trim())
  const hv = useHanviet()
  const hanviet = hv ? wordHanviet(hv, word.hanzi) : ''
  // Thẻ mới (key đổi) hiện thẳng mặt trước; chỉ chạy hiệu ứng úp lại sau khi đã lật ít nhất một lần.
  const touched = useRef(false)
  if (flipped) touched.current = true
  const face = 'col-start-1 row-start-1 flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border backface-hidden'

  return (
    // Hai mặt chồng trong cùng một ô lưới → khung cao bằng mặt dài hơn.
    // overflow-hidden + p-1: chặn dự phòng phần thẻ phóng to khi xoay, vẫn đủ chỗ cho viền/bóng.
    <div className="-m-1 overflow-hidden p-1 perspective-[2000px]">
      <div
        role="button"
        tabIndex={-1}
        onClick={onFlip}
        aria-label={flipped ? 'Úp thẻ' : 'Lật thẻ'}
        className={cn(
          'grid cursor-pointer transform-3d select-none',
          flipped ? 'animate-flip-to-back' : touched.current && 'animate-flip-to-front',
        )}
      >
        <div className={face} aria-hidden={flipped}>
          {front === 'hanzi' ? (
            <span className="font-hanzi text-7xl leading-tight font-medium">{word.hanzi}</span>
          ) : (
            <span className="text-2xl font-semibold">{word.meaning || '—'}</span>
          )}
          <span className="mt-4 text-xs text-muted-foreground">Chạm để lật</span>
        </div>

        <div className={cn(face, 'rotate-y-180')} aria-hidden={!flipped}>
          <span className="text-lg font-medium text-brand">{word.pinyin || '—'}</span>
          <div className="flex items-center gap-1">
            <span className="font-hanzi text-6xl leading-tight font-medium">{word.hanzi}</span>
            <SpeakButton text={word.hanzi} />
          </div>
          <span className="text-xl font-semibold">{word.meaning || '—'}</span>
          {hanviet && <span className="text-sm tracking-wide text-muted-foreground uppercase">{hanviet}</span>}
          {hasExample && (
            <div className="mt-3 flex w-full items-start gap-2 border-t border-border/70 pt-3 text-left">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-hanzi text-lg leading-snug">{word.example}</p>
                {word.examplePinyin && <p className="text-sm text-muted-foreground">{word.examplePinyin}</p>}
                {word.exampleMeaning && <p className="text-sm">{word.exampleMeaning}</p>}
              </div>
              <SpeakButton text={word.example} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
