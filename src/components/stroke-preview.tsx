import { useEffect, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { loadStrokes } from '@/lib/strokes'
import { cn } from '@/lib/utils'

// Ô xem trước cách viết: chữ tự vẽ lại từng nét theo vòng lặp trên khung 米字格,
// bộ thủ tô đỏ, phần còn lại tô xanh (giống hvdic.thivien.net).

/** Màu theo theme hiện tại (Hanzi Writer cần mã màu cụ thể, không nhận biến CSS). */
function previewColors() {
  const dark = document.documentElement.classList.contains('dark')
  return {
    strokeColor: dark ? '#7b9cff' : '#2f5bd8',
    radicalColor: dark ? '#ff6369' : '#e5484d',
    outlineColor: dark ? '#3a3a3c' : '#e3e3e8',
  }
}

interface Props {
  char: string
  size: number
  className?: string
  /** Số nét, báo lên sau khi tải xong dữ liệu. */
  onStrokes?: (n: number) => void
}

export function StrokePreview({ char, size, className, onStrokes }: Props) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!host) return
    host.innerHTML = ''
    setFailed(false)
    let alive = true
    const writer = HanziWriter.create(host, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.08),
      showCharacter: false,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 250,
      delayBetweenLoops: 1500,
      ...previewColors(),
      charDataLoader: (c, onLoad, onError) => {
        loadStrokes(c).then((data) => {
          if (alive) onStrokes?.(data.strokes.length)
          onLoad(data)
        }, onError)
      },
      onLoadCharDataError: () => alive && setFailed(true),
      onLoadCharDataSuccess: () => {
        if (alive) void writer.loopCharacterAnimation()
      },
    })
    return () => {
      alive = false
      void writer.pauseAnimation()
      host.innerHTML = ''
    }
    // onStrokes chỉ để báo số nét; không dựng lại khi hàm đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, char, size])

  return (
    <div className={cn('relative overflow-hidden rounded-xl border bg-card', className)} style={{ width: size, height: size }}>
      <Grid />
      <div ref={setHost} className="relative" aria-hidden />
      {failed && <span className="absolute inset-0 flex items-center justify-center font-hanzi" style={{ fontSize: size * 0.6 }}>{char}</span>}
    </div>
  )
}

/** Khung 米字格: hai đường giữa và hai đường chéo nét đứt. */
export function Grid() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full text-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke">
        <line x1="50" y1="0" x2="50" y2="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="0" y1="0" x2="100" y2="100" />
        <line x1="100" y1="0" x2="0" y2="100" />
      </g>
    </svg>
  )
}
