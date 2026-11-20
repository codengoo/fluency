import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, AudioLinesIcon, PlayIcon, RotateCcwIcon, ShuffleIcon, SpellCheckIcon, TypeIcon, Volume2Icon, type LucideIcon } from 'lucide-react'
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
import { playSyllable } from '@/lib/pinyin'
import { isAnswer, makeQuestions, type DrillKind, type DrillMode, type Question } from '@/lib/pinyin-drill'
import { cn } from '@/lib/utils'

// Luyện nghe pinyin: chọn kiểu + số câu, rồi một lượt kiểu "Nghe & chọn" (sai thì gặp lại cuối lượt).
// Phím tắt: 1–4 chọn, Space nghe lại, Enter sang câu tiếp.

const PREF_KEY = 'fluency:pinyin-drill'
const COUNTS = [10, 20] as const

type Pref = { mode: DrillMode; count: number }

const MODES: { id: DrillMode; icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'tone', icon: AudioLinesIcon, title: 'Thanh điệu', desc: 'Nghe âm tiết, chọn thanh 1–4' },
  { id: 'initial', icon: TypeIcon, title: 'Âm đầu', desc: 'Cặp dễ nhầm: zh / z / j, b / p, n / l…' },
  { id: 'final', icon: SpellCheckIcon, title: 'Vần', desc: 'Cặp dễ nhầm: an / ang, en / eng, u / ü…' },
  { id: 'mix', icon: ShuffleIcon, title: 'Trộn', desc: 'Lẫn cả ba kiểu' },
]

const HINT: Record<DrillKind, string> = {
  tone: 'Nghe và chọn đúng thanh',
  initial: 'Nghe và chọn đúng âm đầu',
  final: 'Nghe và chọn đúng vần',
}

function readPref(): Pref {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') as Partial<Pref>
    return {
      mode: MODES.some((m) => m.id === p.mode) ? p.mode! : 'tone',
      count: COUNTS.includes(p.count as never) ? p.count! : 10,
    }
  } catch {
    return { mode: 'tone', count: 10 }
  }
}

/** Phần "Luyện nghe" trong tab Pinyin: chọn kiểu + số câu, nút Bắt đầu mở lượt luyện. */
export function PinyinDrill() {
  const [pref, setPref] = useState(readPref)
  const [session, setSession] = useState<{ open: boolean; questions: Question[] }>({ open: false, questions: [] })

  const update = (patch: Partial<Pref>) =>
    setPref((p) => {
      const next = { ...p, ...patch }
      try {
        localStorage.setItem(PREF_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

  const newRound = () => setSession({ open: true, questions: makeQuestions(pref.mode, pref.count) })

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Kiểu luyện" className="grid gap-2 sm:grid-cols-2">
        {MODES.map(({ id, icon: Icon, title, desc }) => {
          const active = pref.mode === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update({ mode: id })}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 ring-inset transition-colors',
                active ? 'bg-brand/10 ring-2 ring-brand' : 'bg-card ring-border hover:bg-muted',
              )}
            >
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand text-brand-foreground' : 'bg-muted')}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="sm:max-w-xs">
        <p className="mb-2 text-sm font-medium">Số câu mỗi lượt</p>
        <div className="flex rounded-xl bg-muted p-1 text-sm font-medium">
          {COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ count: c })}
              aria-pressed={pref.count === c}
              className={cn('flex-1 rounded-lg py-1.5 transition-all', pref.count === c ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Button variant="brand" size="lg" className="w-full sm:w-auto" onClick={newRound}>
        <PlayIcon /> Bắt đầu
      </Button>

      {session.questions.length > 0 && (
        <DrillSession
          open={session.open}
          onOpenChange={(open) => setSession((s) => ({ ...s, open }))}
          questions={session.questions}
          onNewRound={newRound}
        />
      )}
    </div>
  )
}

interface SessionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: Question[]
  onNewRound: () => void
}

function DrillSession({ open, onOpenChange, questions, onNewRound }: SessionProps) {
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])
  const [deck, setDeck] = useState<Deck>(() => startDeck(questions.map((q) => q.id)))
  // Tăng mỗi câu hỏi: phát lại âm (kể cả khi cùng một câu quay lại).
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  const restart = (ids: string[]) => {
    setDeck(startDeck(ids))
    setPicked(null)
    setStep((s) => s + 1)
  }

  useEffect(() => {
    if (open) restart(questions.map((q) => q.id))
  }, [open, questions])

  const done = isDone(deck)
  const q = done ? undefined : byId.get(deck.queue[0])
  const learned = deck.total - deck.queue.length

  const play = () => {
    if (!q) return
    setFailed(false)
    playSyllable(q.syllable, q.tone).catch(() => setFailed(true))
  }

  // Phát âm khi hiện câu hỏi (chờ hộp thoại mở xong một chút).
  useEffect(() => {
    if (!open || !q) return
    const t = setTimeout(play, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, q?.id])

  const choose = (i: number) => {
    if (!q) return
    // Đã chọn rồi: bấm lựa chọn nào thì nghe lựa chọn đó để so sánh.
    if (picked !== null) {
      const o = q.options[i]
      playSyllable(o.syllable, o.tone).catch(() => setFailed(true))
      return
    }
    setPicked(i)
    // Chọn sai: phát lại để nghe đúng âm cần nhận ra.
    if (!isAnswer(q, q.options[i])) play()
  }

  const next = () => {
    if (picked === null || !q) return
    setDeck((d) => answer(d, isAnswer(q, q.options[picked])))
    setPicked(null)
    setStep((s) => s + 1)
  }

  useEffect(() => {
    if (!open || done || !q) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= q.options.length) choose(n - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        play()
      } else if (e.key === 'Enter' && picked !== null) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const correct = q && picked !== null && isAnswer(q, q.options[picked])
  const missed = deck.missed.map((id) => byId.get(id)).filter((x): x is Question => Boolean(x))

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Luyện nghe<span className="ml-2 font-normal text-muted-foreground tabular-nums">{learned}/{deck.total}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{q ? `${HINT[q.kind]}. Chọn sai sẽ gặp lại cuối lượt.` : 'Xong lượt.'}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${deck.total ? (learned / deck.total) * 100 : 0}%` }} />
          </div>

          {q ? (
            <>
              <div className="mb-5 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={play}
                  aria-label="Nghe lại"
                  className="flex size-20 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95"
                >
                  <Volume2Icon className="size-9" />
                </button>
                {failed && <p className="text-sm text-red-600 dark:text-red-400">Không tải được âm thanh – bấm để thử lại.</p>}
              </div>

              <div key={step} className={cn('animate-tab-in grid gap-2', q.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                {q.options.map((o, i) => {
                  const right = isAnswer(q, o)
                  const state = picked === null ? 'idle' : right ? 'correct' : i === picked ? 'wrong' : 'dim'
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => choose(i)}
                      className={cn(
                        'relative flex min-h-20 items-center justify-center rounded-2xl px-2 py-3 text-center ring-1 transition-colors',
                        state === 'idle' && 'bg-card ring-border hover:bg-muted active:scale-[0.98]',
                        state === 'correct' && 'bg-emerald-500/15 text-emerald-700 ring-2 ring-emerald-500 dark:text-emerald-300',
                        state === 'wrong' && 'bg-red-500/15 text-red-700 ring-2 ring-red-500 dark:text-red-300',
                        state === 'dim' && 'bg-card text-muted-foreground ring-border',
                      )}
                    >
                      <span className="absolute top-1.5 left-2.5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className="text-2xl font-semibold">{o.label}</span>
                    </button>
                  )
                })}
              </div>

              {picked !== null && <p className="animate-tab-in mt-4 text-center text-sm text-muted-foreground">Bấm từng lựa chọn để nghe so sánh.</p>}
            </>
          ) : (
            <Summary deck={deck} missed={missed} />
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          {q ? (
            <Button variant={picked !== null ? 'brand' : 'secondary'} size="lg" disabled={picked === null} onClick={next}>
              {picked === null ? 'Chọn một đáp án' : correct ? 'Đúng rồi · Tiếp' : 'Tiếp'} {picked !== null && <ArrowRightIcon />}
            </Button>
          ) : (
            // sm:flex-1 chứ không flex-1: trong flex-col (điện thoại) flex-1 làm nút bẹt.
            <div className="flex flex-col gap-2 sm:flex-row">
              {missed.length > 0 && (
                <Button variant="brand" size="lg" className="sm:flex-1" onClick={() => restart(deck.missed)}>
                  <RotateCcwIcon /> Luyện lại {missed.length} câu sai
                </Button>
              )}
              <Button variant={missed.length ? 'secondary' : 'brand'} size="lg" className="sm:flex-1" onClick={onNewRound}>
                <ShuffleIcon /> Lượt mới
              </Button>
            </div>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function Summary({ deck, missed }: { deck: Deck; missed: Question[] }) {
  return (
    <div className="animate-tab-in flex flex-col items-center gap-2 py-4 text-center">
      <span className="font-hanzi text-5xl text-brand">{missed.length === 0 ? '棒' : '好'}</span>
      <p className="text-lg font-semibold">Xong lượt {deck.total} câu</p>
      <p className="text-muted-foreground">
        Đúng ngay lần đầu:{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {deck.total - missed.length}/{deck.total}
        </span>
      </p>
      {missed.length > 0 && (
        <div className="mt-3 w-full text-left">
          <p className="mb-1.5 text-sm text-muted-foreground">Phải nghe lại (bấm để so sánh):</p>
          <ul className="divide-y divide-border/70 rounded-2xl bg-card ring-1 ring-border">
            {missed.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                {q.options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => playSyllable(o.syllable, o.tone).catch(() => {})}
                    className={cn(
                      'rounded-lg px-2.5 py-1 font-semibold transition-transform active:scale-95',
                      isAnswer(q, o) ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
