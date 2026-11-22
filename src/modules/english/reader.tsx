import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, PauseIcon, PencilIcon, PlayIcon, Repeat1Icon, SkipBackIcon, SkipForwardIcon, SlidersHorizontalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { canSpeakEn, englishVoices, setEnTts, speakEn, stopEn, useEnTts } from '@/lib/english-tts'
import { loadPosition, savePosition, splitReading, wordCount, type Sentence } from '@/lib/reading'
import type { Reading } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EnglishVoiceDialog } from './voice-dialog'

const SPEEDS = [0.6, 0.75, 0.9, 1, 1.15, 1.3]

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

      <article lang="en" className="space-y-4 rounded-2xl bg-card px-5 py-5 text-lg leading-relaxed sm:px-7 sm:py-6 sm:text-xl sm:leading-relaxed">
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
                  {s.index === cur && word ? (
                    <>
                      {s.text.slice(0, word[0])}
                      <mark className="rounded bg-brand px-0.5 text-brand-foreground">{s.text.slice(word[0], word[1])}</mark>
                      {s.text.slice(word[1])}
                    </>
                  ) : (
                    s.text
                  )}
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
