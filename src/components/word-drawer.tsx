import { useEffect, useMemo, useRef, useState } from 'react'
import { PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { hasHanzi, toPinyin } from '@/lib/chinese'
import { removeRecord, saveTopic, saveWord, useStore } from '@/lib/store'
import type { Word } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Emoji } from './emoji'
import { SpeakButton } from './speak-button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Từ đang sửa; null = thêm mới. */
  word: Word | null
  /** Chủ đề chọn sẵn khi thêm mới (đang ở trong trang chủ đề). */
  defaultTopicId?: string
}

const EMPTY = { hanzi: '', pinyin: '', meaning: '', example: '', examplePinyin: '', exampleMeaning: '', note: '' }

export function WordDrawer({ open, onOpenChange, word, defaultTopicId }: Props) {
  const { topics, words } = useStore()
  const [f, setF] = useState(EMPTY)
  const [topicIds, setTopicIds] = useState<string[]>([])
  // Đã sửa tay pinyin thì không tự sinh đè lên nữa.
  const [manual, setManual] = useState({ pinyin: false, example: false })
  const [newTopic, setNewTopic] = useState<string | null>(null)
  const hanziRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (word) {
      setF({
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.meaning,
        example: word.example,
        examplePinyin: word.examplePinyin,
        exampleMeaning: word.exampleMeaning,
        note: word.note ?? '',
      })
      setTopicIds(word.topicIds)
      setManual({ pinyin: word.pinyin !== toPinyin(word.hanzi), example: word.examplePinyin !== toPinyin(word.example, true) })
    } else {
      setF(EMPTY)
      setTopicIds(defaultTopicId ? [defaultTopicId] : [])
      setManual({ pinyin: false, example: false })
    }
    setNewTopic(null)
  }, [open, word, defaultTopicId])

  const duplicate = useMemo(() => {
    const h = f.hanzi.trim()
    return h ? words.find((w) => w.hanzi === h && w.id !== word?.id) : undefined
  }, [f.hanzi, words, word])

  const setHanzi = (hanzi: string) => setF((s) => ({ ...s, hanzi, pinyin: manual.pinyin ? s.pinyin : toPinyin(hanzi) }))
  const setExample = (example: string) =>
    setF((s) => ({ ...s, example, examplePinyin: manual.example ? s.examplePinyin : toPinyin(example, true) }))

  const toggleTopic = (id: string) => setTopicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const addTopic = () => {
    const name = newTopic?.trim()
    if (!name) return setNewTopic(null)
    const t = saveTopic({ name, emoji: '📚' })
    setTopicIds((ids) => [...ids, t.id])
    setNewTopic(null)
  }

  const submit = (keepOpen: boolean) => {
    const hanzi = f.hanzi.trim()
    if (!hanzi) return toast.error('Nhập chữ Hán trước đã')
    saveWord({
      id: word?.id,
      hanzi,
      pinyin: f.pinyin.trim(),
      meaning: f.meaning.trim(),
      example: f.example.trim(),
      examplePinyin: f.examplePinyin.trim(),
      exampleMeaning: f.exampleMeaning.trim(),
      note: f.note.trim(),
      topicIds,
    })
    if (keepOpen) {
      toast.success(`Đã lưu ${hanzi}`)
      setF(EMPTY)
      setManual({ pinyin: false, example: false })
      hanziRef.current?.focus()
    } else {
      toast.success(word ? 'Đã cập nhật' : `Đã thêm ${hanzi}`)
      onOpenChange(false)
    }
  }

  const remove = () => {
    if (!word || !confirm(`Xóa từ "${word.hanzi}"?`)) return
    removeRecord(word.id)
    toast.success('Đã xóa')
    onOpenChange(false)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{word ? 'Sửa từ' : 'Thêm từ mới'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Pinyin tự sinh khi gõ chữ Hán, sửa tay được.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
        <form
          className="sheet-stagger flex flex-col gap-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit(false)
          }}
        >
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="hanzi">Chữ Hán</Label>
              <Input
                id="hanzi"
                ref={hanziRef}
                value={f.hanzi}
                onChange={(e) => setHanzi(e.target.value)}
                placeholder="三"
                autoComplete="off"
                className="h-14 font-hanzi text-3xl md:text-3xl"
              />
            </div>
            <SpeakButton text={f.hanzi} className="mb-2" />
          </div>
          {duplicate && <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">Đã có từ này trong sổ ({duplicate.meaning || duplicate.pinyin}).</p>}

          <PinyinField
            id="pinyin"
            label="Pinyin"
            value={f.pinyin}
            source={f.hanzi}
            onChange={(pinyin) => {
              setF((s) => ({ ...s, pinyin }))
              setManual((m) => ({ ...m, pinyin: true }))
            }}
            onRegenerate={() => {
              setF((s) => ({ ...s, pinyin: toPinyin(s.hanzi) }))
              setManual((m) => ({ ...m, pinyin: false }))
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="meaning">Nghĩa tiếng Việt</Label>
            <Input id="meaning" value={f.meaning} onChange={(e) => setF((s) => ({ ...s, meaning: e.target.value }))} placeholder="số ba" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="example">Câu ví dụ</Label>
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <Textarea
                id="example"
                rows={2}
                value={f.example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="我有三本书。"
                className="font-hanzi text-lg md:text-lg"
              />
              <SpeakButton text={f.example} size="sm" className="mt-1" />
            </div>
          </div>

          <PinyinField
            id="examplePinyin"
            label="Pinyin câu ví dụ"
            value={f.examplePinyin}
            source={f.example}
            multiline
            onChange={(examplePinyin) => {
              setF((s) => ({ ...s, examplePinyin }))
              setManual((m) => ({ ...m, example: true }))
            }}
            onRegenerate={() => {
              setF((s) => ({ ...s, examplePinyin: toPinyin(s.example, true) }))
              setManual((m) => ({ ...m, example: false }))
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="exampleMeaning">Nghĩa câu ví dụ</Label>
            <Textarea
              id="exampleMeaning"
              rows={2}
              value={f.exampleMeaning}
              onChange={(e) => setF((s) => ({ ...s, exampleMeaning: e.target.value }))}
              placeholder="Tôi có ba quyển sách."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              rows={2}
              value={f.note}
              onChange={(e) => setF((s) => ({ ...s, note: e.target.value }))}
              placeholder="Mẹo nhớ, cách dùng, từ dễ nhầm…"
            />
          </div>

          <div className="space-y-2">
            <Label>Chủ đề</Label>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    topicIds.includes(t.id) ? 'border-brand bg-brand text-brand-foreground' : 'bg-background hover:bg-muted',
                  )}
                >
                  <Emoji char={t.emoji} className="mr-1" />
                  {t.name}
                </button>
              ))}
              {newTopic === null ? (
                <button
                  type="button"
                  onClick={() => setNewTopic('')}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <PlusIcon className="size-3.5" /> Chủ đề mới
                </button>
              ) : (
                <Input
                  autoFocus
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onBlur={addTopic}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTopic()
                    }
                    if (e.key === 'Escape') setNewTopic(null)
                  }}
                  placeholder="Tên chủ đề…"
                  className="h-9 w-44 rounded-full"
                />
              )}
            </div>
          </div>
          <button type="submit" hidden />
        </form>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="flex gap-2">
            {word ? (
              <Button type="button" variant="destructive" size="lg" className="h-12" onClick={remove} aria-label="Xóa từ">
                <Trash2Icon />
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="lg" className="h-12 flex-1" onClick={() => submit(true)}>
                Lưu & thêm tiếp
              </Button>
            )}
            <Button type="button" variant="brand" size="lg" className="h-12 flex-1" onClick={() => submit(false)}>
              {word ? 'Lưu thay đổi' : 'Lưu'}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function PinyinField(props: {
  id: string
  label: string
  value: string
  source: string
  multiline?: boolean
  onChange: (v: string) => void
  onRegenerate: () => void
}) {
  const auto = hasHanzi(props.source) ? toPinyin(props.source, props.multiline) : ''
  const Field = props.multiline ? Textarea : Input
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={props.id}>{props.label}</Label>
        {auto && props.value !== auto && (
          <button type="button" onClick={props.onRegenerate} className="inline-flex items-center gap-1 text-xs text-brand">
            <RefreshCwIcon className="size-3" /> Tự sinh lại
          </button>
        )}
      </div>
      <Field
        id={props.id}
        value={props.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => props.onChange(e.target.value)}
        placeholder="tự động"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        {...(props.multiline ? { rows: 2 } : {})}
      />
    </div>
  )
}
