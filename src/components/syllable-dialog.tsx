import { useEffect, useRef, useState } from 'react'
import { ListMusicIcon } from 'lucide-react'
import { toast } from 'sonner'
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
import { playSyllable, TONES, toneMark, type Final, type Initial, type Tone } from '@/lib/pinyin'
import { cn } from '@/lib/utils'

// Một âm tiết: nghe từng thanh hoặc lần lượt 1→4, kèm mẹo phát âm âm đầu và vần.

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Initial
  final: Final
  syllable: string
}

const STEP_MS = 900

export function SyllableDialog({ open, onOpenChange, initial, final, syllable }: Props) {
  const [active, setActive] = useState<Tone | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => {
    if (!open) stop()
    setActive(null)
    return stop
  }, [open, syllable])

  const play = (t: Tone) => {
    setActive(t)
    playSyllable(syllable, t).catch((e: Error) => toast.error(e.message))
  }

  const playAll = () => {
    stop()
    timers.current = TONES.map((t, i) => setTimeout(() => play(t), i * STEP_MS))
    timers.current.push(setTimeout(() => setActive(null), TONES.length * STEP_MS))
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl">{syllable}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Bấm từng thanh để nghe</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-3 pb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  stop()
                  play(t)
                }}
                className={cn(
                  'flex h-20 flex-col items-center justify-center rounded-2xl ring-1 ring-inset transition-colors active:scale-95',
                  active === t ? 'bg-brand text-brand-foreground ring-brand' : 'bg-card ring-border hover:bg-muted',
                )}
              >
                <span className="text-2xl font-semibold">{toneMark(syllable, t)}</span>
                <span className={cn('text-xs', active === t ? 'text-brand-foreground/80' : 'text-muted-foreground')}>Thanh {t}</span>
              </button>
            ))}
          </div>

          {initial.id && (
            <p className="rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border">
              <span className="mr-1.5 font-semibold">Âm đầu {initial.id}</span>
              <span className="text-muted-foreground">{initial.tip}</span>
            </p>
          )}
          <p className="rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border">
            <span className="mr-1.5 font-semibold">Vần {final.id}</span>
            <span className="text-muted-foreground">{final.tip}</span>
          </p>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button variant="brand" size="lg" onClick={playAll}>
            <ListMusicIcon /> Nghe lần lượt 1 → 4
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
