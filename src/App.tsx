import { lazy, Suspense, useEffect, useState } from 'react'
import { SettingsIcon } from 'lucide-react'
import { SettingsDrawer } from '@/components/settings-drawer'
import { SyncBadge } from '@/components/sync-badge'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import ChineseApp from '@/modules/chinese/chinese-app'

// Hai luồng chính tách riêng: Tiếng Trung (từ vựng, pinyin, luyện viết…) và Tiếng Anh (bài đọc…).
// Dùng chung: sổ dữ liệu + đồng bộ, cài đặt, thông báo. Module đang chọn lưu theo máy.

const EnglishApp = lazy(() => import('@/modules/english/english-app'))

export type Module = 'zh' | 'en'
const MODULE_KEY = 'fluency:module'

function loadModule(): Module {
  try {
    return localStorage.getItem(MODULE_KEY) === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export default function App() {
  const [module, setModule] = useState<Module>(loadModule)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    // Màu nhấn theo module (index.css: [data-module='en']).
    document.documentElement.dataset.module = module
    try {
      localStorage.setItem(MODULE_KEY, module)
    } catch {}
  }, [module])

  const switchModule = (m: Module) => {
    if (m === module) return
    // Bỏ lịch sử "đang mở chủ đề / bài đọc" của module cũ để nút Back không nhảy lung tung.
    if (history.state) history.replaceState(null, '')
    setModule(m)
    window.scrollTo({ top: 0 })
  }

  const brand = <AppBrand module={module} onModule={switchModule} onSettings={() => setSettingsOpen(true)} />

  return (
    <>
      {module === 'zh' ? (
        <ChineseApp brand={brand} />
      ) : (
        <Suspense fallback={null}>
          <EnglishApp brand={brand} />
        </Suspense>
      )}
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster position="top-center" />
    </>
  )
}

function AppBrand({ module, onModule, onSettings }: { module: Module; onModule: (m: Module) => void; onSettings: () => void }) {
  return (
    <>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand font-bold text-brand-foreground transition-colors',
          module === 'zh' ? 'font-hanzi text-xl' : 'font-heading text-lg',
        )}
      >
        {module === 'zh' ? '字' : 'Aa'}
      </div>
      <h1 className="hidden text-2xl font-bold sm:block">Fluency</h1>
      <div role="tablist" aria-label="Ngôn ngữ" className="ml-1 flex rounded-xl bg-muted p-1 text-sm font-medium sm:ml-3">
        {(
          [
            ['zh', '中文', 'Tiếng Trung'],
            ['en', 'English', 'Tiếng Anh'],
          ] as const
        ).map(([m, label, title]) => (
          <button
            key={m}
            role="tab"
            aria-selected={module === m}
            title={title}
            onClick={() => onModule(m)}
            className={cn('rounded-lg px-3 py-1.5 transition-all', module === m ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground', m === 'zh' && 'font-hanzi')}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button onClick={onSettings} className="flex items-center gap-1 rounded-full p-2 hover:bg-muted" aria-label="Đồng bộ & cài đặt">
        <SyncBadge />
        <SettingsIcon className="size-5" />
      </button>
    </>
  )
}
