import { useState } from 'react'
import { toast } from 'sonner'
import { FINALS, INITIALS, playSyllable, syllablesOf, type Final, type Initial } from '@/lib/pinyin'
import { cn } from '@/lib/utils'
import { SyllableDialog } from './syllable-dialog'

// Bảng âm: chọn âm đầu → lưới âm tiết ghép được, chia theo hàng vần (a / i / u / ü). Bấm ô để nghe 4 thanh.

const INITIAL_KEY = 'fluency:pinyin-initial'
const ROWS: { row: Final['row']; label: string }[] = [
  { row: 'a', label: 'Vần đơn & vần ghép' },
  { row: 'i', label: 'Vần bắt đầu bằng i' },
  { row: 'u', label: 'Vần bắt đầu bằng u' },
  { row: 'ü', label: 'Vần bắt đầu bằng ü' },
]

function readInitial() {
  try {
    const id = localStorage.getItem(INITIAL_KEY)
    return INITIALS.find((i) => i.id === id) ?? INITIALS[0]
  } catch {
    return INITIALS[0]
  }
}

const groups = INITIALS.reduce<{ group: string; items: Initial[] }[]>((acc, i) => {
  const last = acc.at(-1)
  if (last?.group === i.group) last.items.push(i)
  else acc.push({ group: i.group, items: [i] })
  return acc
}, [])

export function PinyinChart() {
  const [initial, setInitial] = useState<Initial>(readInitial)
  const [open, setOpen] = useState(false)
  const [cell, setCell] = useState<{ final: Final; syllable: string }>({ final: FINALS[0], syllable: 'ba' })
  const cells = syllablesOf(initial.id)

  const pickInitial = (i: Initial) => {
    setInitial(i)
    try {
      localStorage.setItem(INITIAL_KEY, i.id)
    } catch {}
  }

  const openCell = (c: { final: Final; syllable: string }) => {
    setCell(c)
    setOpen(true)
    playSyllable(c.syllable, 1).catch((e: Error) => toast.error(e.message))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="mb-1 text-xs text-muted-foreground">{g.group}</p>
            <div className="flex gap-1.5">
              {g.items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => pickInitial(i)}
                  aria-pressed={i.id === initial.id}
                  className={cn(
                    'h-10 min-w-10 rounded-xl px-2.5 text-base font-semibold transition-colors',
                    i.id === initial.id ? 'bg-brand text-brand-foreground' : 'bg-card hover:bg-muted',
                  )}
                >
                  {i.id || 'Ø'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-brand/8 px-4 py-3 text-sm ring-1 ring-brand/15">
        <span className="mr-1.5 font-semibold text-brand">{initial.id || 'Không âm đầu'}</span>
        {initial.tip}
      </p>

      <div key={initial.id} className="animate-tab-in mt-4 space-y-4">
        {ROWS.map(({ row, label }) => {
          const list = cells.filter((c) => c.final.row === row)
          if (!list.length) return null
          return (
            <section key={row}>
              <p className="mb-1.5 text-sm text-muted-foreground">{label}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {list.map((c) => (
                  <button
                    key={c.final.id}
                    type="button"
                    onClick={() => openCell(c)}
                    className="flex h-16 flex-col items-center justify-center rounded-2xl bg-card px-1 transition-transform hover:bg-muted active:scale-95"
                  >
                    <span className="text-lg font-semibold">{c.syllable}</span>
                    {c.syllable !== initial.id + c.final.id && <span className="text-[11px] text-muted-foreground">{c.final.id}</span>}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <SyllableDialog open={open} onOpenChange={setOpen} initial={initial} final={cell.final} syllable={cell.syllable} />
    </div>
  )
}
