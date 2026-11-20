import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, SnailIcon, Volume2Icon } from 'lucide-react'
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
import { speak } from '@/lib/chinese'
import { answer, isDone, startDeck, type Deck } from '@/lib/flashcard'
import { optionLabel, pickOptions, type QuizShow } from '@/lib/quiz'
import type { Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StudySummary, SummaryActions } from './study-summary'

// Nghe & chọn: máy đọc từ, chọn 1 trong 4 đáp án. Sai thì từ đó gặp lại cuối lượt.
// Phím tắt: 1–4 chọn, Space nghe lại, Enter sang câu tiếp.

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Các từ của lượt (chốt lúc mở). */
  words: Word[]
  /** Cả sổ: lấy thêm đáp án nhiễu khi lượt có ít từ. */
  pool: Word[]
}

const SHOW_KEY = 'fluency:quiz-show'
const SLOW_RATE = 0.5

function readShow(): QuizShow {
  try {
    return localStorage.getItem(SHOW_KEY) === 'meaning' ? 'meaning' : 'hanzi'
  } catch {
    return 'hanzi'
  }
}

export default function ListeningQuiz({ open, onOpenChange, words, pool }: Props) {
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  const [deck, setDeck] = useState<Deck>(() => startDeck(words.map((w) => w.id)))
  // Tăng mỗi câu hỏi: sinh lại đáp án và đọc lại (kể cả khi cùng một từ quay lại).
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [show, setShow] = useState<QuizShow>(readShow)

  const restart = (ids: string[]) => {
    setDeck(startDeck(ids))
    setPicked(null)
    setStep((s) => s + 1)
  }

  useEffect(() => {
    if (open) restart(words.map((w) => w.id))
  }, [open, words])

  const done = isDone(deck)
  const word = done ? undefined : byId.get(deck.queue[0])
  const learned = deck.total - deck.queue.length

  const options = useMemo(
    () => (word ? pickOptions(word, words, pool, show) : []),
    // Chỉ sinh lại khi sang câu mới hoặc đổi kiểu đáp án; pool đổi (đồng bộ nền) không xáo lại câu đang làm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, show, word?.id],
  )

  // Đọc từ khi hiện câu hỏi (chờ hộp thoại mở xong một chút).
  useEffect(() => {
    if (!open || !word) return
    const t = setTimeout(() => speak(word.hanzi), 250)
    return () => clearTimeout(t)
  }, [open, step, word])

  const replay = (slow = false) => word && speak(word.hanzi, slow ? { rate: SLOW_RATE } : {})

  const choose = (id: string) => {
    if (picked || !word) return
    setPicked(id)
    // Chọn sai: đọc lại để nghe đúng từ cần nhận ra.
    if (id !== word.id) replay()
  }

  const next = () => {
    if (!picked || !word) return
    setDeck((d) => answer(d, picked === word.id))
    setPicked(null)
    setStep((s) => s + 1)
  }

  useEffect(() => {
    if (!open || done) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) choose(options[n - 1].id)
      else if (e.key === ' ') {
        e.preventDefault()
        replay()
      } else if (e.key === 'Enter' && picked) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const changeShow = (s: QuizShow) => {
    if (picked) return
    setShow(s)
    try {
      localStorage.setItem(SHOW_KEY, s)
    } catch {}
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Nghe & chọn<span className="ml-2 font-normal text-muted-foreground tabular-nums">{learned}/{deck.total}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Nghe từ được đọc rồi chọn đáp án đúng. Chọn sai sẽ gặp lại cuối lượt.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${deck.total ? (learned / deck.total) * 100 : 0}%` }} />
          </div>

          {word ? (
            <>
              <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
                {(['hanzi', 'meaning'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeShow(s)}
                    disabled={Boolean(picked)}
                    aria-pressed={show === s}
                    className={cn('rounded-lg py-1.5 transition-all', show === s ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                  >
                    {s === 'hanzi' ? 'Chọn chữ Hán' : 'Chọn nghĩa'}
                  </button>
                ))}
              </div>

              <div className="mb-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => replay()}
                  aria-label="Nghe lại"
                  className="flex size-20 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95"
                >
                  <Volume2Icon className="size-9" />
                </button>
                <button
                  type="button"
                  onClick={() => replay(true)}
                  aria-label="Đọc chậm"
                  title="Đọc chậm"
                  className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground active:scale-95"
                >
                  <SnailIcon className="size-5" />
                </button>
              </div>

              <div key={step} className="animate-tab-in grid grid-cols-2 gap-2">
                {options.map((o, i) => {
                  const correct = o.id === word.id
                  const state = !picked ? 'idle' : correct ? 'correct' : o.id === picked ? 'wrong' : 'dim'
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => choose(o.id)}
                      disabled={Boolean(picked)}
                      className={cn(
                        'relative flex min-h-20 items-center justify-center rounded-2xl px-3 py-3 text-center ring-1 transition-colors',
                        state === 'idle' && 'bg-card ring-border hover:bg-muted active:scale-[0.98]',
                        state === 'correct' && 'bg-emerald-500/15 text-emerald-700 ring-2 ring-emerald-500 dark:text-emerald-300',
                        state === 'wrong' && 'bg-red-500/15 text-red-700 ring-2 ring-red-500 dark:text-red-300',
                        state === 'dim' && 'bg-card opacity-50 ring-border',
                      )}
                    >
                      <span className="absolute top-1.5 left-2.5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className={cn(show === 'hanzi' ? 'font-hanzi text-3xl' : 'text-base font-medium')}>{optionLabel(o, show) || '—'}</span>
                    </button>
                  )
                })}
              </div>

              {picked && (
                <div className="animate-tab-in mt-4 flex items-center gap-3 rounded-2xl bg-brand/8 px-4 py-3 ring-1 ring-brand/15">
                  <span className="font-hanzi text-3xl">{word.hanzi}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-brand">{word.pinyin || '—'}</span>
                    <span className="block truncate">{word.meaning || '—'}</span>
                  </span>
                </div>
              )}
            </>
          ) : (
            <StudySummary deck={deck} byId={byId} />
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          {word ? (
            <Button variant={picked ? 'brand' : 'secondary'} size="lg" className="h-12" disabled={!picked} onClick={next}>
              {picked ? (picked === word.id ? 'Đúng rồi · Tiếp' : 'Tiếp') : 'Chọn một đáp án'} {picked && <ArrowRightIcon />}
            </Button>
          ) : (
            <SummaryActions deck={deck} allIds={words.map((w) => w.id)} onRestart={restart} />
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
