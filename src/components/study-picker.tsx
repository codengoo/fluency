import { useEffect, useState } from 'react'
import { HeadphonesIcon, LayersIcon, PlayIcon } from 'lucide-react'
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
import { canSpeak } from '@/lib/chinese'
import { shuffle } from '@/lib/flashcard'
import type { Word } from '@/lib/types'
import { cn } from '@/lib/utils'

// Bảng chọn trước khi ôn: chế độ + số thẻ mỗi lượt. Lựa chọn nhớ trong localStorage.

export type StudyMode = 'cards' | 'listen'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Các từ đang hiện (chủ đề / tất cả từ, có tính ô tìm kiếm). */
  words: Word[]
  /** Số từ cả sổ: Nghe & chọn cần ít nhất 2 từ để có đáp án nhiễu. */
  poolSize: number
  onStart: (mode: StudyMode, words: Word[]) => void
}

const PREF_KEY = 'fluency:study'
const COUNTS = [10, 20, 0] as const // 0 = tất cả

type Pref = { mode: StudyMode; count: number }

function readPref(): Pref {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') as Partial<Pref>
    return { mode: p.mode === 'listen' ? 'listen' : 'cards', count: COUNTS.includes(p.count as never) ? p.count! : 0 }
  } catch {
    return { mode: 'cards', count: 0 }
  }
}

const MODES: { id: StudyMode; icon: typeof LayersIcon; title: string; desc: string }[] = [
  { id: 'cards', icon: LayersIcon, title: 'Flashcard', desc: 'Lật thẻ, tự đánh giá nhớ hay chưa' },
  { id: 'listen', icon: HeadphonesIcon, title: 'Nghe & chọn', desc: 'Nghe đọc, chọn đúng 1 trong 4 đáp án' },
]

export function StudyPicker({ open, onOpenChange, words, poolSize, onStart }: Props) {
  const [pref, setPref] = useState(readPref)
  useEffect(() => {
    if (open) setPref(readPref())
  }, [open])

  const total = words.length
  const listenBlocked = !canSpeak() ? 'Trình duyệt không hỗ trợ đọc to' : poolSize < 2 ? 'Cần ít nhất 2 từ trong sổ' : ''
  const mode: StudyMode = pref.mode === 'listen' && listenBlocked ? 'cards' : pref.mode
  // Chỉ hiện mốc nhỏ hơn tổng số từ; đã lưu mốc lớn hơn thì coi như "Tất cả".
  const counts = COUNTS.filter((c) => c === 0 || c < total)
  const count = pref.count && pref.count < total ? pref.count : 0

  const update = (patch: Partial<Pref>) => {
    const next = { ...pref, ...patch }
    setPref(next)
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next))
    } catch {}
  }

  const start = () => onStart(mode, count ? shuffle(words).slice(0, count) : words)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ôn tập</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{total} từ đang hiện</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-5 pb-4">
          <div role="radiogroup" aria-label="Chế độ" className="grid gap-2">
            {MODES.map(({ id, icon: Icon, title, desc }) => {
              const blocked = id === 'listen' ? listenBlocked : ''
              const active = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={Boolean(blocked)}
                  onClick={() => update({ mode: id })}
                  className={cn(
                    // ring-inset: viền vẽ vào trong, không bị khung cuộn của hộp thoại cắt mất mép trên.
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 ring-inset transition-colors disabled:opacity-50',
                    active ? 'bg-brand/10 ring-2 ring-brand' : 'bg-card ring-border hover:bg-muted',
                  )}
                >
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand text-brand-foreground' : 'bg-muted')}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-muted-foreground">{blocked || desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Số thẻ mỗi lượt</p>
            <div className="flex rounded-xl bg-muted p-1 text-sm font-medium">
              {counts.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ count: c })}
                  aria-pressed={count === c}
                  className={cn('flex-1 rounded-lg py-1.5 transition-all', count === c ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                >
                  {c || `Tất cả (${total})`}
                </button>
              ))}
            </div>
            {count > 0 && <p className="mt-1.5 text-xs text-muted-foreground">Lấy ngẫu nhiên {count} từ.</p>}
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button variant="brand" size="lg" className="h-12" onClick={start} disabled={total === 0}>
            <PlayIcon /> Bắt đầu
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
