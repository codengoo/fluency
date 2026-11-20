import { useMemo, useState } from 'react'
import { Fragment } from 'react'
import { PencilIcon, PenLineIcon } from 'lucide-react'
import { charPinyins, speak } from '@/lib/chinese'
import { charReadings, useHanviet, wordHanviet, type CharReading } from '@/lib/hanviet'
import { hanChars } from '@/lib/strokes'
import type { Topic, Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Emoji } from './emoji'
import { SpeakButton } from './speak-button'

interface Props {
  word: Word
  topics?: Topic[]
  hideMeaning?: boolean
  index?: number
  onEdit: (w: Word) => void
  onPractice?: (w: Word) => void
  /** Chữ Hán → các từ trong sổ chứa chữ đó (để tách chữ trong từ). */
  charIndex?: Map<string, Word[]>
}

export function WordCard({ word, topics, hideMeaning, index = 0, onEdit, onPractice, charIndex }: Props) {
  const [open, setOpen] = useState(false)
  const reveal = !hideMeaning || open
  const hasExample = Boolean(word.example.trim())
  const tags = topics?.filter((t) => word.topicIds.includes(t.id)) ?? []
  const hv = useHanviet()
  const hanviet = useMemo(() => (hv ? wordHanviet(hv, word.hanzi) : ''), [hv, word.hanzi])

  return (
    <div
      className="animate-stagger rounded-2xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
      style={{ '--i': index } as React.CSSProperties}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((o) => !o)}
        className="flex items-center gap-3 px-4 py-3 outline-none"
      >
        <div className="flex min-w-16 flex-col items-center">
          <span className={cn('text-sm text-muted-foreground transition-opacity', !reveal && 'opacity-0')}>{word.pinyin}</span>
          <span className="font-hanzi text-3xl leading-tight font-medium">{word.hanzi}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-medium transition-all', !reveal && 'blur-sm select-none')}>{word.meaning || '—'}</p>
          {hanviet && (
            <p className={cn('truncate text-xs tracking-wide text-muted-foreground uppercase transition-all', !reveal && 'blur-sm select-none')}>{hanviet}</p>
          )}
          {tags.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {tags.map((t, i) => (
                <Fragment key={t.id}>
                  {i > 0 && ' · '}
                  <Emoji char={t.emoji} className="mr-1" />
                  {t.name}
                </Fragment>
              ))}
            </p>
          )}
        </div>
        <SpeakButton text={word.hanzi} />
      </div>

      {open && (
        <div className="animate-tab-in border-t border-border/70 px-4 pt-3 pb-3">
          {hasExample ? (
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-hanzi text-lg leading-snug">{word.example}</p>
                {word.examplePinyin && <p className="text-sm text-muted-foreground">{word.examplePinyin}</p>}
                {word.exampleMeaning && <p className="text-sm">{word.exampleMeaning}</p>}
              </div>
              <SpeakButton text={word.example} size="sm" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có câu ví dụ.</p>
          )}
          <CharBreakdown word={word} charIndex={charIndex} />
          <div className="mt-2 flex justify-end gap-1">
            {onPractice && hanChars(word.hanzi).length > 0 && (
              <button
                type="button"
                onClick={() => onPractice(word)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                <PenLineIcon className="size-3.5" /> Luyện viết
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(word)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              <PencilIcon className="size-3.5" /> Sửa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const MAX_RELATED = 6

/** Từng chữ trong từ: pinyin, âm Hán Việt, và các từ khác trong sổ có chữ đó (bấm để nghe). */
function CharBreakdown({ word, charIndex }: { word: Word; charIndex?: Map<string, Word[]> }) {
  const hv = useHanviet()
  const chars = hanChars(word.hanzi)
  const pys = charPinyins(word.hanzi)
  const hvs: CharReading[] = hv ? charReadings(hv, word.hanzi) : []
  const seen = new Set<string>()
  const rows = chars
    .map((c, i) => ({
      c,
      py: pys[i] ?? '',
      hv: hvs[i] ?? { main: [], other: [] },
      related: (charIndex?.get(c) ?? []).filter((w) => w.id !== word.id),
    }))
    .filter((r) => !seen.has(r.c) && seen.add(r.c))
  // Không tra được âm Hán Việt và cũng không có từ liên quan thì không có gì để hiện.
  if (!rows.some((r) => r.hv.main.length || r.related.length)) return null

  return (
    <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
      {rows.map(({ c, py, hv, related }) => (
        <div key={c} className="flex items-start gap-3">
          <span className="font-hanzi text-2xl leading-none">{c}</span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm leading-tight">
              <span className="text-muted-foreground">{py}</span>
              {hv.main.length > 0 && <span className="ml-2 font-semibold tracking-wide uppercase">{hv.main.join(', ')}</span>}
              {hv.other.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground" title="Cách đọc khác">
                  ({hv.other.join(', ')})
                </span>
              )}
            </p>
            {related.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {related.slice(0, MAX_RELATED).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => speak(w.hanzi)}
                    title={[w.pinyin, w.meaning].filter(Boolean).join(' · ')}
                    className="inline-flex items-baseline gap-1 rounded-full bg-muted px-2.5 py-0.5 text-sm hover:bg-muted/70"
                  >
                    <span className="font-hanzi">{w.hanzi}</span>
                    {w.meaning && <span className="max-w-28 truncate text-xs text-muted-foreground">{w.meaning}</span>}
                  </button>
                ))}
                {related.length > MAX_RELATED && <span className="self-center text-xs text-muted-foreground">+{related.length - MAX_RELATED}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
