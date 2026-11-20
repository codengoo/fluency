import { useState } from 'react'
import { Fragment } from 'react'
import { PencilIcon, PenLineIcon } from 'lucide-react'
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
}

export function WordCard({ word, topics, hideMeaning, index = 0, onEdit, onPractice }: Props) {
  const [open, setOpen] = useState(false)
  const reveal = !hideMeaning || open
  const hasExample = Boolean(word.example.trim())
  const tags = topics?.filter((t) => word.topicIds.includes(t.id)) ?? []

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
