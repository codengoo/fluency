import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, PauseIcon, PencilIcon, PlayIcon, Repeat1Icon, SkipBackIcon, SkipForwardIcon, SlidersHorizontalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { canSpeakEn, englishVoices, setEnTts, speakEn, stopEn, useEnTts } from '@/lib/english-tts'
import { loadPosition, savePosition, splitReading, wordCount, type Sentence } from '@/lib/reading'
import type { Reading } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EnglishVoiceDialog } from './voice-dialog'

const SPEEDS = [0.6, 0.75, 0.9, 1, 1.15, 1.3]

/** Câu → các mảnh (từ / khoảng trắng) kèm vị trí ký tự, để tìm đúng từ mà giọng đọc báo về. */
function tokenize(text: string) {
  const out: { text: string; start: number; end: number; space: boolean }[] = []
  for (const m of text.matchAll(/\s+|\S+/g)) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length, space: /^\s/.test(m[0]) })
  }
  return out
}

/** Thời gian ô tô màu trượt sang từ kế tiếp (đủ ngắn để kịp nhịp đọc). */
const SLIDE = '220ms cubic-bezier(0.4, 0, 0.2, 1)'

interface Props {
  reading: Reading
  onBack: () => void
  onEdit: () => void
}

/**
 * Đọc lại bài: mỗi lần đọc một câu (câu ngắn ổn định hơn trên Chrome, và dễ tô sáng / nhảy câu).
 * Bấm vào câu bất kỳ để đọc từ câu đó. Vị trí đang đọc được nhớ theo máy.
 */
export function Reader({ reading, onBack, onEdit }: Props) {
  const sentences = useMemo(() => splitReading(reading.text), [reading.text])
  const paragraphs = useMemo(() => {
    const out: Sentence[][] = []
    for (const s of sentences) (out[s.para] ??= []).push(s)
    return out.filter(Boolean)
  }, [sentences])
  const [cur, setCur] = useState(() => Math.min(loadPosition(reading.id), Math.max(0, sentences.length - 1)))
  const [playing, setPlaying] = useState(false)
  const [word, setWord] = useState<[number, number] | null>(null)
  const [repeat, setRepeat] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const { settings } = useEnTts()

  // Ref cho callback onEnd (chạy sau khi state đã đổi).
  const playingRef = useRef(false)
  const repeatRef = useRef(repeat)
  repeatRef.current = repeat
  const sentenceEls = useRef(new Map<number, HTMLElement>())

  // Tô từ đang đọc: một ô màu duy nhất nằm dưới chữ, trượt từ từ này sang từ kế tiếp
  // (thay vì dựng lại <mark> mỗi từ, gây giật). Xuống dòng thì nhảy thẳng, không quét chéo qua cả dòng.
  const articleRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const tokenEls = useRef<(HTMLSpanElement | null)[]>([])
  const lastTop = useRef<number | null>(null)
  const curTokens = useMemo(() => tokenize(sentences[cur]?.text ?? ''), [sentences, cur])
  const activeToken = word ? curTokens.findIndex((t) => !t.space && word[0] >= t.start && word[0] < t.end) : -1

  const placeHighlight = useCallback(() => {
    const hl = highlightRef.current
    const article = articleRef.current
    if (!hl || !article) return
    const el = activeToken >= 0 ? tokenEls.current[activeToken] : null
    if (!el) {
      hl.style.opacity = '0'
      lastTop.current = null
      return
    }
    const a = article.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const x = r.left - a.left - 3
    const y = r.top - a.top - 1
    const sameLine = lastTop.current !== null && Math.abs(lastTop.current - y) < 4
    hl.style.transition = sameLine ? `transform ${SLIDE}, width ${SLIDE}, height ${SLIDE}, opacity 120ms ease-out` : 'opacity 120ms ease-out'
    hl.style.transform = `translate(${x}px, ${y}px)`
    hl.style.width = `${r.width + 6}px`
    hl.style.height = `${r.height + 2}px`
    hl.style.opacity = '1'
    lastTop.current = y
  }, [activeToken])

  useLayoutEffect(placeHighlight, [placeHighlight, cur])

  // Đổi cỡ màn hình / xoay máy: chữ xuống dòng khác → đặt lại ô màu (không trượt).
  useEffect(() => {
    const onResize = () => {
      lastTop.current = null
      placeHighlight()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [placeHighlight])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const words = wordCount(reading.text)
  const minutes = Math.max(1, Math.round(words / (150 * settings.rate)))

  const stop = () => {
    playingRef.current = false
    clearTimeout(timer.current)
    stopEn()
    setPlaying(false)
    setWord(null)
  }

  const play = (i: number) => {
    if (i < 0 || i >= sentences.length) return stop()
    clearTimeout(timer.current)
    setCur(i)
    setWord(null)
    savePosition(reading.id, i)
    playingRef.current = true
    setPlaying(true)
    const ok = speakEn(sentences[i].text, {
      onWord: (a, b) => setWord([a, b]),
      onEnd: () => {
        if (!playingRef.current) return
        setWord(null)
        const next = repeatRef.current ? i : i + 1
        if (next >= sentences.length) {
          stop()
          savePosition(reading.id, 0)
          return
        }
        // Nghỉ ngắn giữa các câu; lặp câu thì nghỉ lâu hơn để kịp nói theo.
        timer.current = setTimeout(() => playingRef.current && play(next), repeatRef.current ? 900 : 200)
      },
    })
    if (!ok) {
      stop()
      toast.error('Trình duyệt này không hỗ trợ đọc to')
    } else if (englishVoices().length === 0) {
      toast.warning('Máy chưa có giọng tiếng Anh', { description: 'Thêm giọng "English" trong cài đặt giọng nói của hệ điều hành.', id: 'no-en-voice' })
    }
  }

  const toggle = () => (playing ? stop() : play(cur))
  const go = (delta: number) => {
    const i = Math.min(Math.max(cur + delta, 0), sentences.length - 1)
    if (playing) play(i)
    else {
      setCur(i)
      savePosition(reading.id, i)
    }
  }
  const cycleSpeed = () => {
    const i = SPEEDS.findIndex((s) => s >= settings.rate - 0.001)
    setEnTts({ rate: SPEEDS[(i + 1) % SPEEDS.length] ?? SPEEDS[0] })
  }

  // Rời trang / đổi bài: dừng đọc.
  useEffect(() => () => stop(), [reading.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Câu đang đọc luôn nằm trong tầm nhìn.
  useEffect(() => {
    if (!playing) return
    sentenceEls.current.get(cur)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [cur, playing])

  // Desktop: phím Space = đọc / dừng, ← → = câu trước / sau.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role="dialog"]')) return
      if (e.key === ' ') {
        e.preventDefault()
        toggle()
      } else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
    <div className="animate-tab-in mx-auto max-w-3xl pb-32">
      <header className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="-ml-2 rounded-full p-2 hover:bg-muted" aria-label="Quay lại">
          <ChevronLeftIcon className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{reading.title}</h1>
          <p className="text-xs text-muted-foreground">
            {words} từ · {sentences.length} câu · ~{minutes} phút
          </p>
        </div>
        <button onClick={onEdit} className="rounded-full p-2 hover:bg-muted" aria-label="Sửa bài đọc">
          <PencilIcon className="size-5" />
        </button>
      </header>

      {/* Điện thoại: chữ nằm thẳng trên nền trang, không khung; từ màn nhỏ trở lên mới có khung.
          isolate + -z-10: ô tô màu nằm trên nền khung nhưng dưới chữ. */}
      <article
        ref={articleRef}
        lang="en"
        className="relative isolate space-y-4 text-lg leading-relaxed sm:rounded-2xl sm:bg-card sm:px-7 sm:py-6 sm:text-xl sm:leading-relaxed"
      >
        <div ref={highlightRef} aria-hidden className="pointer-events-none absolute top-0 left-0 -z-10 rounded-md bg-brand opacity-0 shadow-sm shadow-brand/30" />
        {paragraphs.map((para, pi) => (
          <p key={pi}>
            {para.map((s) => (
              <Fragment key={s.index}>
                <span
                  ref={(el) => {
                    if (el) sentenceEls.current.set(s.index, el)
                    else sentenceEls.current.delete(s.index)
                  }}
                  onClick={() => play(s.index)}
                  className={cn(
                    'cursor-pointer rounded-md box-decoration-clone py-0.5 transition-colors',
                    s.index === cur ? 'bg-brand/15' : 'hover:bg-muted',
                  )}
                >
                  {s.index === cur
                    ? curTokens.map((t, ti) =>
                        t.space ? (
                          t.text
                        ) : (
                          <span
                            key={ti}
                            ref={(el) => {
                              tokenEls.current[ti] = el
                            }}
                            className={cn('transition-colors duration-150', ti === activeToken && 'text-brand-foreground')}
                          >
                            {t.text}
                          </span>
                        ),
                      )
                    : s.text}
                </span>{' '}
              </Fragment>
            ))}
          </p>
        ))}
      </article>
      <p className="mt-3 text-center text-xs text-muted-foreground">Bấm vào một câu để đọc từ câu đó.</p>
    </div>

      {/* Nằm ngoài khối có animation (transform) để position: fixed bám đúng viewport. */}

      {/* Thanh điều khiển nổi ở đáy. */}
      <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
        <div className="flex w-full max-w-md items-center gap-1 rounded-full border bg-popover/95 p-1.5 shadow-xl backdrop-blur">
          <button onClick={() => setRepeat((r) => !r)} className={cn('flex size-10 items-center justify-center rounded-full', repeat ? 'bg-brand/15 text-brand' : 'text-muted-foreground hover:bg-muted')} aria-label="Lặp câu" title="Lặp lại câu hiện tại">
            <Repeat1Icon className="size-5" />
          </button>
          <button onClick={() => go(-1)} disabled={cur === 0} className="flex size-10 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40" aria-label="Câu trước">
            <SkipBackIcon className="size-5" />
          </button>
          <button
            onClick={toggle}
            disabled={!canSpeakEn() || sentences.length === 0}
            className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md shadow-brand/30 transition-transform active:scale-95 disabled:opacity-50"
            aria-label={playing ? 'Tạm dừng' : 'Đọc'}
          >
            {playing ? <PauseIcon className="size-6 fill-current" /> : <PlayIcon className="size-6 translate-x-px fill-current" />}
          </button>
          <button onClick={() => go(1)} disabled={cur >= sentences.length - 1} className="flex size-10 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40" aria-label="Câu sau">
            <SkipForwardIcon className="size-5" />
          </button>
          <span className="min-w-0 flex-1 text-center text-xs text-muted-foreground tabular-nums">
            {sentences.length ? cur + 1 : 0}/{sentences.length}
          </span>
          <button onClick={cycleSpeed} className="h-10 rounded-full px-2.5 text-sm font-semibold tabular-nums hover:bg-muted" aria-label="Tốc độ đọc" title="Đổi tốc độ">
            {settings.rate.toFixed(2).replace(/0$/, '')}×
          </button>
          <button onClick={() => setVoiceOpen(true)} className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Giọng đọc">
            <SlidersHorizontalIcon className="size-5" />
          </button>
        </div>
      </div>

      <EnglishVoiceDialog open={voiceOpen} onOpenChange={setVoiceOpen} />
    </>
  )
}
