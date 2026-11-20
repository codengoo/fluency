import { useState } from 'react'
import { PinyinChart } from './pinyin-chart'
import { ToneLesson } from './tone-lesson'
import { cn } from '@/lib/utils'

// Tab Pinyin: Bảng âm / Thanh điệu / Luyện nghe. Phần đang xem nhớ trong localStorage.

type Section = 'chart' | 'tones' | 'drill'

const SECTION_KEY = 'fluency:pinyin-section'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'chart', label: 'Bảng âm' },
  { id: 'tones', label: 'Thanh điệu' },
  { id: 'drill', label: 'Luyện nghe' },
]

function readSection(): Section {
  try {
    const s = localStorage.getItem(SECTION_KEY)
    return SECTIONS.some((x) => x.id === s) ? (s as Section) : 'chart'
  } catch {
    return 'chart'
  }
}

export default function PinyinView() {
  const [section, setSection] = useState<Section>(readSection)

  const change = (s: Section) => {
    setSection(s)
    try {
      localStorage.setItem(SECTION_KEY, s)
    } catch {}
  }

  return (
    <div className="animate-tab-in">
      <div className="mb-4 grid grid-cols-3 rounded-xl bg-muted p-1 text-sm font-medium sm:max-w-md">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => change(s.id)}
            aria-pressed={section === s.id}
            className={cn('rounded-lg py-1.5 transition-all', section === s.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div key={section} className="animate-tab-in">
        {section === 'chart' ? (
          <PinyinChart />
        ) : section === 'tones' ? (
          <ToneLesson />
        ) : (
          <p className="rounded-2xl bg-card px-4 py-10 text-center text-muted-foreground">Sắp có</p>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Âm thanh:{' '}
        <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          audio-cmn
        </a>{' '}
        — Chen Wang, Yue Tan (CC BY-SA 4.0)
      </p>
    </div>
  )
}
