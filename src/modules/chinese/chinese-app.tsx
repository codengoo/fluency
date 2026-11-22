import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeftIcon, EyeIcon, EyeOffIcon, GraduationCapIcon, PencilIcon, PenLineIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { Emoji } from '@/components/emoji'
import { Button } from '@/components/ui/button'
import { StudyPicker, type StudyMode } from '@/components/study-picker'
import { TopicDrawer } from '@/components/topic-drawer'
import { WordCard } from '@/components/word-card'
import { WordDrawer } from '@/components/word-drawer'
import { useIsDesktop } from '@/hooks/use-media-query'
import { fold } from '@/lib/chinese'
import { hanChars } from '@/lib/strokes'
import { useStore } from '@/lib/store'
import type { Topic, Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toPinyin } from '@/lib/chinese'

type Tab = 'topics' | 'words' | 'pinyin'

// Tải lười: Hanzi Writer chỉ cần khi mở luyện viết.
const WritingPractice = lazy(() => import('@/components/writing-practice'))
const Flashcard = lazy(() => import('@/components/flashcard'))
const ListeningQuiz = lazy(() => import('@/components/listening-quiz'))
const PinyinView = lazy(() => import('@/components/pinyin-view'))

// Ba cỡ màn hình (giống chiatien):
// - Điện thoại (< 640px): một cột, tab Chủ đề / Tất cả từ, nút "Thêm từ" nổi, bảng trượt từ đáy.
// - Màn nhỏ (640–1023px): như điện thoại nhưng rộng hơn — lưới chủ đề 3 cột, từ vựng 2 cột, hộp thoại giữa màn hình.
// - Desktop (≥ 1024px): cột trái danh sách chủ đề, cột phải từ vựng; nút "Thêm từ" trên header.

/** Module tiếng Trung. `brand`: header chung (logo, chuyển module, cài đặt) do App truyền vào. */
export default function ChineseApp({ brand }: { brand: ReactNode }) {
  const { ready, words, topics } = useStore()
  const [tab, setTab] = useState<Tab>('topics')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [hideMeaning, setHideMeaning] = useState(false)
  const isDesktop = useIsDesktop()

  const [wordDrawer, setWordDrawer] = useState<{ open: boolean; word: Word | null }>({ open: false, word: null })
  const [topicDrawer, setTopicDrawer] = useState<{ open: boolean; topic: Topic | null }>({ open: false, topic: null })
  // Luyện viết: danh sách từ chốt lúc mở (không đổi theo ô tìm kiếm khi đang luyện).
  const [practice, setPractice] = useState<{ open: boolean; words: Word[]; start: number }>({ open: false, words: [], start: 0 })
  // Ôn tập (Flashcard / Nghe & chọn): bảng chọn trước, rồi mở lượt với danh sách từ chốt lúc bắt đầu.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [study, setStudy] = useState<{ open: boolean; mode: StudyMode; words: Word[] }>({ open: false, mode: 'cards', words: [] })

  const topic = topics.find((t) => t.id === topicId) ?? null

  // Nút Back của điện thoại / trình duyệt: từ trang chủ đề quay về danh sách.
  useEffect(() => {
    const onPop = () => setTopicId(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const openTopic = (id: string) => {
    // Đang ở một chủ đề (desktop đổi qua lại ở cột trái): thay chứ không chồng thêm lịch sử.
    if (history.state?.topic) history.replaceState({ topic: id }, '')
    else history.pushState({ topic: id }, '')
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

  // Chữ Hán → các từ chứa chữ đó (tách chữ trong thẻ từ).
  const charIndex = useMemo(() => {
    const m = new Map<string, Word[]>()
    for (const w of words) for (const c of new Set(hanChars(w.hanzi))) m.set(c, [...(m.get(c) ?? []), w])
    return m
  }, [words])

  const index = useMemo(
    () => new Map(words.map((w) => [w.id, fold([w.hanzi, w.pinyin, toPinyin(w.hanzi), w.meaning, w.example, w.exampleMeaning, w.note ?? ''].join('|'))])),
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
  const practiceList = visibleWords.filter((w) => hanChars(w.hanzi).length > 0)
  const practiceWord = (w: Word) => setPractice({ open: true, words: [w], start: 0 })
  const practiceAll = () => practiceList.length && setPractice({ open: true, words: practiceList, start: 0 })
  const startStudy = (mode: StudyMode, list: Word[]) => {
    setPickerOpen(false)
    setStudy({ open: true, mode, words: list })
  }
  const addWord = () => setWordDrawer({ open: true, word: null })
  const newTopic = () => setTopicDrawer({ open: true, topic: null })
  const editTopic = () => topic && setTopicDrawer({ open: true, topic })
  const showPinyin = tab === 'pinyin' && !topic
  // Desktop: chủ đề nằm ở cột trái nên cột phải là danh sách từ (trừ khi đang ở Pinyin).
  const showWords = isDesktop || Boolean(topic) || tab === 'words'
  const pinyinView = (
    <Suspense fallback={null}>
      <PinyinView />
    </Suspense>
  )

  // Ba nút cạnh ô tìm kiếm: điện thoại chỉ hiện icon để ô tìm kiếm không bị ép.
  const toolLabel = 'hidden sm:inline'

  const wordList = (
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
          <span className={toolLabel}>{hideMeaning ? 'Đang ẩn' : 'Ẩn nghĩa'}</span>
        </button>
        <button
          onClick={practiceAll}
          disabled={practiceList.length === 0}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-card px-3 text-sm disabled:opacity-50"
          title="Luyện viết lần lượt các từ đang hiện"
        >
          <PenLineIcon className="size-4" />
          <span className={toolLabel}>Luyện viết</span>
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          disabled={visibleWords.length === 0}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-card px-3 text-sm disabled:opacity-50"
          title="Ôn tập các từ đang hiện: Flashcard / Nghe & chọn"
        >
          <GraduationCapIcon className="size-4" />
          <span className={toolLabel}>Ôn tập</span>
        </button>
      </div>

      {visibleWords.length === 0 ? (
        <Empty
          title={query ? 'Không tìm thấy từ nào' : topic ? 'Chủ đề chưa có từ nào' : 'Chưa có từ vựng'}
          action={!query ? { label: 'Thêm từ', onClick: addWord } : undefined}
        />
      ) : (
        // Từ màn nhỏ trở lên: 2 cột; items-start để thẻ đang mở không kéo giãn thẻ bên cạnh.
        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 sm:gap-3">
          {visibleWords.map((w, i) => (
            <WordCard key={w.id} word={w} index={i} hideMeaning={hideMeaning} topics={topic ? undefined : topics} onEdit={editWord} onPractice={practiceWord} charIndex={charIndex} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 sm:max-w-3xl sm:px-6 lg:max-w-6xl lg:pt-6 lg:pb-12">
      {isDesktop ? (
        <>
          <header className="mb-6 flex items-center gap-2">
            {brand}
            <Button variant="brand" className="ml-2" onClick={addWord}>
              <PlusIcon /> Thêm từ
            </Button>
          </header>

          <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-8">
            {/* Cột trái: điều hướng chủ đề, bám theo khi cuộn danh sách từ. */}
            <nav className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-1 overflow-y-auto no-scrollbar">
              <SideItem
                active={showPinyin}
                onClick={() => {
                  setTab('pinyin')
                  if (topic) closeTopic()
                }}
                emoji="🔤"
                label="Pinyin"
              />
              <SideItem
                active={!topic && !showPinyin}
                onClick={() => {
                  setTab('words')
                  if (topic) closeTopic()
                }}
                emoji="📖"
                label="Tất cả từ"
                count={words.length}
              />
              <p className="mt-4 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Chủ đề</p>
              {topics.map((t) => (
                <SideItem
                  key={t.id}
                  active={t.id === topicId}
                  onClick={() => {
                    setTab('words')
                    if (t.id !== topicId) openTopic(t.id)
                  }}
                  emoji={t.emoji}
                  label={t.name}
                  count={counts.get(t.id) ?? 0}
                />
              ))}
              <button
                onClick={newTopic}
                className="mt-1 flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card"
              >
                <PlusIcon className="size-4" /> Chủ đề mới
              </button>
            </nav>

            <main className="min-w-0">
              <div className="mb-4 flex h-10 items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-xl font-bold">
                  {showPinyin ? (
                    'Pinyin'
                  ) : topic ? (
                    <>
                      <Emoji char={topic.emoji} className="mr-1.5" />
                      {topic.name}
                    </>
                  ) : (
                    'Tất cả từ'
                  )}
                  {!showPinyin && <span className="ml-2 text-base font-normal text-muted-foreground">{visibleWords.length} từ</span>}
                </h2>
                {topic && (
                  <Button variant="ghost" onClick={editTopic}>
                    <PencilIcon /> Sửa chủ đề
                  </Button>
                )}
              </div>
              {showPinyin ? pinyinView : ready && wordList}
            </main>
          </div>
        </>
      ) : (
        <>
          <header className="mb-4 flex items-center gap-2">
            {topic ? (
              <>
                <button onClick={closeTopic} className="-ml-2 rounded-full p-2 hover:bg-muted" aria-label="Quay lại">
                  <ChevronLeftIcon className="size-6" />
                </button>
                <h1 className="min-w-0 flex-1 truncate text-xl font-bold">
                  <Emoji char={topic.emoji} className="mr-1.5" />
                  {topic.name}
                </h1>
                <button onClick={editTopic} className="rounded-full p-2 hover:bg-muted" aria-label="Sửa chủ đề">
                  <PencilIcon className="size-5" />
                </button>
              </>
            ) : (
              brand
            )}
          </header>

          {!topic && (
            <div className="mb-4 grid grid-cols-3 rounded-xl bg-muted p-1 text-sm font-medium sm:max-w-md">
              {(['topics', 'words', 'pinyin'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn('rounded-lg py-2 transition-all', tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}
                >
                  {t === 'topics' ? `Chủ đề (${topics.length})` : t === 'words' ? `Tất cả từ (${words.length})` : 'Pinyin'}
                </button>
              ))}
            </div>
          )}

          {showPinyin ? (
            pinyinView
          ) : !ready ? null : showWords ? (
            wordList
          ) : (
            <div className="animate-tab-in grid grid-cols-2 gap-3 sm:grid-cols-3">
              {topics.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => openTopic(t.id)}
                  className="animate-stagger flex aspect-[4/3] flex-col justify-between rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-transform active:scale-[0.98]"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <Emoji char={t.emoji} className="size-9" />
                  <span>
                    <span className="line-clamp-2 font-semibold leading-tight">{t.name}</span>
                    <span className="text-sm text-muted-foreground">{counts.get(t.id) ?? 0} từ</span>
                  </span>
                </button>
              ))}
              <button
                onClick={newTopic}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-muted-foreground hover:bg-card"
              >
                <PlusIcon className="size-6" />
                <span className="text-sm font-medium">Chủ đề mới</span>
              </button>
            </div>
          )}

          {/* Nút nổi bám mép phải khung nội dung: max-w-lg (điện thoại) / max-w-3xl (màn nhỏ). Ẩn ở tab Pinyin. */}
          {!showPinyin && (
            <button
              onClick={addWord}
              className="fixed right-[max(1.25rem,calc(50%-15rem))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-95 sm:right-[max(1.5rem,calc(50%-22.5rem))]"
            >
              <PlusIcon className="size-5" /> Thêm từ
            </button>
          )}
        </>
      )}

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
      {practice.words.length > 0 && (
        <Suspense fallback={null}>
          <WritingPractice
            open={practice.open}
            words={practice.words}
            startIndex={practice.start}
            onOpenChange={(open) => setPractice((s) => ({ ...s, open }))}
          />
        </Suspense>
      )}
      <StudyPicker open={pickerOpen} onOpenChange={setPickerOpen} words={visibleWords} poolSize={words.length} onStart={startStudy} />
      {study.words.length > 0 && (
        <Suspense fallback={null}>
          {study.mode === 'cards' ? (
            <Flashcard open={study.open} words={study.words} onOpenChange={(open) => setStudy((s) => ({ ...s, open }))} />
          ) : (
            <ListeningQuiz open={study.open} words={study.words} pool={words} onOpenChange={(open) => setStudy((s) => ({ ...s, open }))} />
          )}
        </Suspense>
      )}
    </div>
  )
}

function SideItem({ active, onClick, emoji, label, count }: { active: boolean; onClick: () => void; emoji: string; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
        active ? 'bg-card font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
      )}
    >
      <Emoji char={emoji} className="size-5" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
    </button>
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
