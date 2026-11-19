import { useEffect, useMemo, useState } from 'react'
import { ChevronLeftIcon, EyeIcon, EyeOffIcon, PencilIcon, PlusIcon, SearchIcon, SettingsIcon, XIcon } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { SettingsDrawer } from '@/components/settings-drawer'
import { SyncBadge } from '@/components/sync-badge'
import { TopicDrawer } from '@/components/topic-drawer'
import { WordCard } from '@/components/word-card'
import { WordDrawer } from '@/components/word-drawer'
import { fold } from '@/lib/chinese'
import { useStore } from '@/lib/store'
import type { Topic, Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toPinyin } from '@/lib/chinese'

type Tab = 'topics' | 'words'

export default function App() {
  const { ready, words, topics } = useStore()
  const [tab, setTab] = useState<Tab>('topics')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [hideMeaning, setHideMeaning] = useState(false)

  const [wordDrawer, setWordDrawer] = useState<{ open: boolean; word: Word | null }>({ open: false, word: null })
  const [topicDrawer, setTopicDrawer] = useState<{ open: boolean; topic: Topic | null }>({ open: false, topic: null })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const topic = topics.find((t) => t.id === topicId) ?? null

  // Nút Back của điện thoại / trình duyệt: từ trang chủ đề quay về danh sách.
  useEffect(() => {
    const onPop = () => setTopicId(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const openTopic = (id: string) => {
    history.pushState({ topic: id }, '')
    setTopicId(id)
    setQuery('')
    window.scrollTo({ top: 0 })
  }
  const closeTopic = () => (history.state?.topic ? history.back() : setTopicId(null))

  // Chủ đề bị xóa (kể cả từ máy khác) → về danh sách.
  useEffect(() => {
    if (topicId && ready && !topic) setTopicId(null)
  }, [topicId, topic, ready])

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of words) for (const id of w.topicIds) m.set(id, (m.get(id) ?? 0) + 1)
    return m
  }, [words])

  const index = useMemo(
    () => new Map(words.map((w) => [w.id, fold([w.hanzi, w.pinyin, toPinyin(w.hanzi), w.meaning, w.example, w.exampleMeaning].join('|'))])),
    [words],
  )

  const visibleWords = useMemo(() => {
    const base = topic ? words.filter((w) => w.topicIds.includes(topic.id)) : words
    const q = fold(query)
    const list = q ? base.filter((w) => index.get(w.id)?.includes(q)) : base
    // "Tất cả từ": mới nhất lên đầu; trong chủ đề: theo thứ tự nhập (1, 2, 3…).
    return topic ? list : [...list].reverse()
  }, [words, topic, query, index])

  const editWord = (w: Word) => setWordDrawer({ open: true, word: w })
  const showWords = Boolean(topic) || tab === 'words'

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-4 flex items-center gap-2">
        {topic ? (
          <>
            <button onClick={closeTopic} className="-ml-2 rounded-full p-2 hover:bg-muted" aria-label="Quay lại">
              <ChevronLeftIcon className="size-6" />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-xl font-bold">
              {topic.emoji} {topic.name}
            </h1>
            <button onClick={() => setTopicDrawer({ open: true, topic })} className="rounded-full p-2 hover:bg-muted" aria-label="Sửa chủ đề">
              <PencilIcon className="size-5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand font-hanzi text-xl font-bold text-brand-foreground">字</div>
            <h1 className="flex-1 text-2xl font-bold">Fluency</h1>
            <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-1 rounded-full p-2 hover:bg-muted" aria-label="Đồng bộ & cài đặt">
              <SyncBadge />
              <SettingsIcon className="size-5" />
            </button>
          </>
        )}
      </header>

      {!topic && (
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
          {(['topics', 'words'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('rounded-lg py-2 transition-all', tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              {t === 'topics' ? `Chủ đề (${topics.length})` : `Tất cả từ (${words.length})`}
            </button>
          ))}
        </div>
      )}

      {!ready ? null : showWords ? (
        <div key={topic?.id ?? 'all'} className="animate-tab-in">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm chữ Hán, pinyin, nghĩa…"
                className="h-10 w-full rounded-xl bg-card pr-9 pl-9 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted-foreground" aria-label="Xóa tìm kiếm">
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setHideMeaning((h) => !h)}
              className={cn('flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm', hideMeaning ? 'bg-brand text-brand-foreground' : 'bg-card')}
              title="Ẩn nghĩa để tự kiểm tra"
            >
              {hideMeaning ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              {hideMeaning ? 'Đang ẩn' : 'Ẩn nghĩa'}
            </button>
          </div>

          {visibleWords.length === 0 ? (
            <Empty
              title={query ? 'Không tìm thấy từ nào' : topic ? 'Chủ đề chưa có từ nào' : 'Chưa có từ vựng'}
              action={!query ? { label: 'Thêm từ', onClick: () => setWordDrawer({ open: true, word: null }) } : undefined}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {visibleWords.map((w, i) => (
                <WordCard key={w.id} word={w} index={i} hideMeaning={hideMeaning} topics={topic ? undefined : topics} onEdit={editWord} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-tab-in grid grid-cols-2 gap-3">
          {topics.map((t, i) => (
            <button
              key={t.id}
              onClick={() => openTopic(t.id)}
              className="animate-stagger flex aspect-[4/3] flex-col justify-between rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-transform active:scale-[0.98]"
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className="text-3xl">{t.emoji}</span>
              <span>
                <span className="line-clamp-2 font-semibold leading-tight">{t.name}</span>
                <span className="text-sm text-muted-foreground">{counts.get(t.id) ?? 0} từ</span>
              </span>
            </button>
          ))}
          <button
            onClick={() => setTopicDrawer({ open: true, topic: null })}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-muted-foreground hover:bg-card"
          >
            <PlusIcon className="size-6" />
            <span className="text-sm font-medium">Chủ đề mới</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setWordDrawer({ open: true, word: null })}
        className="fixed right-[max(1.25rem,calc(50%-15rem))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95"
      >
        <PlusIcon className="size-5" /> Thêm từ
      </button>

      <WordDrawer
        open={wordDrawer.open}
        word={wordDrawer.word}
        defaultTopicId={topic?.id}
        onOpenChange={(open) => setWordDrawer((s) => ({ ...s, open }))}
      />
      <TopicDrawer
        open={topicDrawer.open}
        topic={topicDrawer.topic}
        onOpenChange={(open) => setTopicDrawer((s) => ({ ...s, open }))}
        onDeleted={closeTopic}
        onCreated={(t) => openTopic(t.id)}
      />
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster position="top-center" />
    </div>
  )
}

function Empty({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center">
      <span className="font-hanzi text-5xl text-muted-foreground/40">空</span>
      <p className="text-muted-foreground">{title}</p>
      {action && (
        <button onClick={action.onClick} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
          {action.label}
        </button>
      )}
    </div>
  )
}
