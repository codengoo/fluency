import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
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
import { hanChars, loadStrokes, StrokeError } from '@/lib/strokes'
import type { Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SpeakButton } from './speak-button'
import { Grid, StrokePreview } from './stroke-preview'

// Luyện viết theo nét (Hanzi Writer): vẽ từng nét lên khung 米字格, nét sai báo đỏ, sai 3 lần thì gợi ý.
// Trên khung viết có ô xem trước cách viết từng chữ (tự vẽ lặp lại, bộ thủ tô đỏ).
// Từ nhiều chữ thì viết lần lượt từng chữ; luyện nhiều từ thì có Trước / Tiếp.

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Danh sách từ để luyện (chỉ những từ có chữ Hán). */
  words: Word[]
  startIndex?: number
}

type Status = 'loading' | 'ready' | 'missing' | 'network'

const MAX_SIZE = 300
const HINT_AFTER = 3
const OUTLINE_KEY = 'fluency:writing-outline'

function readOutline() {
  try {
    return localStorage.getItem(OUTLINE_KEY) !== '0'
  } catch {
    return true
  }
}

/** Màu theo theme hiện tại (Hanzi Writer cần mã màu cụ thể, không nhận biến CSS). */
function themeColors() {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  const dark = document.documentElement.classList.contains('dark')
  return {
    strokeColor: v('--foreground', '#1c1c1e'),
    drawingColor: v('--brand', '#e5484d'),
    highlightColor: v('--brand', '#e5484d'),
    outlineColor: dark ? '#3a3a3c' : '#e3e3e8',
  }
}

export default function WritingPractice({ open, onOpenChange, words, startIndex = 0 }: Props) {
  const [wi, setWi] = useState(startIndex)
  const [ci, setCi] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [outline, setOutline] = useState(readOutline)
  // Số nét sai của từng chữ đã viết xong trong từ hiện tại.
  const [results, setResults] = useState<(number | undefined)[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [attempt, setAttempt] = useState(0)

  // Khung vuông vừa bề ngang màn hình (điện thoại nhỏ 320px vẫn lọt), tối đa 300px.
  const size = Math.min(MAX_SIZE, window.innerWidth - 48)
  // Callback ref (state): nội dung dialog gắn vào portal sau lần render đầu, ref thường lúc đó còn null.
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const writerRef = useRef<HanziWriter | null>(null)
  const advanceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Mỗi lần mở: bắt đầu lại từ từ được chọn.
  useEffect(() => {
    if (!open) return
    setWi(startIndex)
    setCi(0)
    setResults([])
  }, [open, startIndex])

  const word = words[wi] as Word | undefined
  const chars = word ? hanChars(word.hanzi) : []
  const char = chars[ci]
  // Ô xem trước: to khi từ ngắn, nhỏ lại cho vừa hàng khi từ nhiều chữ.
  const tile = Math.min(chars.length <= 2 ? 88 : 72, Math.floor((size - 8 * (chars.length - 1)) / Math.max(1, chars.length)))
  const [strokeCounts, setStrokeCounts] = useState<Record<string, number>>({})
  const wordDone = chars.length > 0 && results.length === chars.length && results.every((r) => r !== undefined)

  const startQuiz = (writer: HanziWriter) => {
    setMistakes(0)
    void writer.quiz({
      showHintAfterMisses: HINT_AFTER,
      onMistake: (s) => setMistakes(s.totalMistakes),
      onComplete: ({ totalMistakes }) => {
        setMistakes(totalMistakes)
        setResults((r) => {
          const next = [...r]
          next[ci] = totalMistakes
          return next
        })
        // Tự sang chữ kế tiếp trong cùng từ.
        if (ci < chars.length - 1) advanceRef.current = setTimeout(() => setCi((i) => i + 1), 900)
      },
    })
  }

  // Dựng Hanzi Writer cho chữ hiện tại.
  useEffect(() => {
    if (!open || !host || !char) return
    clearTimeout(advanceRef.current)
    host.innerHTML = ''
    setStatus('loading')
    setMistakes(0)
    let alive = true
    const writer = HanziWriter.create(host, char, {
      width: size,
      height: size,
      padding: 12,
      showCharacter: false,
      showOutline: outline,
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 180,
      ...themeColors(),
      charDataLoader: (c, onLoad, onError) => {
        loadStrokes(c).then(onLoad, onError)
      },
      onLoadCharDataError: (err) => {
        if (alive) setStatus(err instanceof StrokeError && err.reason === 'missing' ? 'missing' : 'network')
      },
      onLoadCharDataSuccess: () => {
        if (!alive) return
        setStatus('ready')
        startQuiz(writer)
      },
    })
    writerRef.current = writer
    return () => {
      alive = false
      clearTimeout(advanceRef.current)
      writer.cancelQuiz()
      writerRef.current = null
    }
    // startQuiz đọc ci / chars của lần dựng này; chỉ dựng lại khi đổi chữ hoặc bấm thử lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, host, wi, ci, char, attempt, size])

  const restart = () => {
    const w = writerRef.current
    if (!w || status !== 'ready') return
    clearTimeout(advanceRef.current)
    w.cancelQuiz()
    setResults((r) => {
      const next = [...r]
      next[ci] = undefined
      return next
    })
    startQuiz(w)
  }

  const demo = () => {
    const w = writerRef.current
    if (!w || status !== 'ready') return
    clearTimeout(advanceRef.current)
    w.cancelQuiz()
    void w.animateCharacter({
      onComplete: ({ canceled }) => {
        if (canceled || writerRef.current !== w) return
        void w.hideCharacter({ duration: 300 })
        startQuiz(w)
      },
    })
  }

  const toggleOutline = () => {
    const next = !outline
    setOutline(next)
    try {
      localStorage.setItem(OUTLINE_KEY, next ? '1' : '0')
    } catch {}
    const w = writerRef.current
    if (w) void (next ? w.showOutline() : w.hideOutline())
  }

  const goWord = (i: number) => {
    setWi(i)
    setCi(0)
    setResults([])
  }

  const total = words.length
  const hasPrev = wi > 0
  const hasNext = wi < total - 1
  const skipChar = () => (ci < chars.length - 1 ? setCi(ci + 1) : hasNext ? goWord(wi + 1) : undefined)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Luyện viết{total > 1 && <span className="ml-2 font-normal text-muted-foreground">{wi + 1}/{total}</span>}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Vẽ từng nét theo đúng thứ tự. Sai {HINT_AFTER} lần thì có gợi ý.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          {word && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex w-full items-center gap-3 rounded-2xl bg-brand/8 px-4 py-3 ring-1 ring-brand/15">
                <div className="min-w-0 flex-1">
                  <p className="text-xl leading-tight font-semibold text-brand">{word.pinyin || '—'}</p>
                  <p className="mt-0.5 truncate text-base font-medium">{word.meaning || '—'}</p>
                </div>
                <SpeakButton text={word.hanzi} className="bg-card shadow-sm" />
              </div>

              {/* Xem trước cách viết từng chữ (tự lặp); bấm để chọn chữ cần viết. */}
              <div className="flex justify-center gap-2">
                {chars.map((c, i) => {
                  const done = results[i] !== undefined
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCi(i)}
                      className="flex flex-col items-center gap-1"
                      aria-label={`Chữ thứ ${i + 1}`}
                      aria-pressed={i === ci}
                    >
                      <span className={cn('relative rounded-xl transition-shadow', i === ci && 'ring-2 ring-brand ring-offset-2 ring-offset-background')}>
                        {/* Tắt chữ mờ = tự nhớ viết: chưa viết xong thì không lộ chữ. */}
                        {done || outline ? (
                          <StrokePreview char={c} size={tile} onStrokes={(n) => setStrokeCounts((m) => (m[c] === n ? m : { ...m, [c]: n }))} />
                        ) : (
                          <span className="flex items-center justify-center rounded-xl border bg-muted text-lg text-muted-foreground" style={{ width: tile, height: tile }}>
                            {i + 1}
                          </span>
                        )}
                        {done && <CheckIcon className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-emerald-500 p-0.5 text-white" />}
                      </span>
                      <span className="h-4 text-xs text-muted-foreground">{strokeCounts[c] && (done || outline) ? `${strokeCounts[c]} nét` : ''}</span>
                    </button>
                  )
                })}
              </div>

              {/* data-vaul-no-drag + touch-none: vẽ trên điện thoại không kéo drawer / cuộn trang. */}
              <div
                data-vaul-no-drag
                className="relative touch-none overflow-hidden rounded-2xl border bg-card select-none"
                style={{ width: size, height: size }}
              >
                <Grid />
                <div ref={setHost} className="relative" />
                {status !== 'ready' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 p-6 text-center text-sm">
                    {status === 'loading' && <span className="text-muted-foreground">Đang tải nét chữ…</span>}
                    {status === 'missing' && (
                      <>
                        <span className="font-hanzi text-4xl">{char}</span>
                        <span className="text-muted-foreground">Chưa có dữ liệu nét cho chữ này.</span>
                        <Button variant="secondary" size="sm" onClick={skipChar}>
                          Bỏ qua
                        </Button>
                      </>
                    )}
                    {status === 'network' && (
                      <>
                        <span className="text-muted-foreground">Không tải được nét chữ. Kiểm tra mạng rồi thử lại.</span>
                        <Button variant="secondary" size="sm" onClick={() => setAttempt((a) => a + 1)}>
                          Thử lại
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <p className={cn('h-5 text-sm', results[ci] !== undefined ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {results[ci] !== undefined
                  ? results[ci] === 0
                    ? '✓ Hoàn hảo, không sai nét nào'
                    : `✓ Xong · sai ${results[ci]} nét`
                  : mistakes > 0
                    ? `Sai ${mistakes} nét`
                    : ''}
              </p>

              <div className="grid w-full grid-cols-3 gap-2">
                <Button variant="secondary" onClick={demo} disabled={status !== 'ready'}>
                  <PlayIcon /> Xem nét
                </Button>
                <Button variant="secondary" onClick={restart} disabled={status !== 'ready'}>
                  <RotateCcwIcon /> Viết lại
                </Button>
                <Button variant={outline ? 'secondary' : 'outline'} onClick={toggleOutline} aria-pressed={outline}>
                  {outline ? <EyeIcon /> : <EyeOffIcon />} {outline ? 'Chữ mờ' : 'Tự nhớ'}
                </Button>
              </div>
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="flex gap-2">
            {total > 1 && (
              <Button variant="secondary" size="lg" className="h-12" onClick={() => goWord(wi - 1)} disabled={!hasPrev} aria-label="Từ trước">
                <ChevronLeftIcon />
              </Button>
            )}
            {hasNext ? (
              <Button variant={wordDone ? 'brand' : 'secondary'} size="lg" className="h-12 flex-1" onClick={() => goWord(wi + 1)}>
                {wordDone ? 'Từ tiếp' : 'Bỏ qua'} <ChevronRightIcon />
              </Button>
            ) : (
              <Button variant={wordDone ? 'brand' : 'secondary'} size="lg" className="h-12 flex-1" onClick={() => onOpenChange(false)}>
                Xong
              </Button>
            )}
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
