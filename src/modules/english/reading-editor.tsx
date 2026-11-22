import { useEffect, useState } from 'react'
import { ClipboardPasteIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Textarea } from '@/components/ui/textarea'
import { defaultTitle, splitReading, wordCount } from '@/lib/reading'
import { removeRecord, saveReading } from '@/lib/store'
import type { Reading } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bài đang sửa; null = bài mới. */
  reading: Reading | null
  onSaved?: (r: Reading, isNew: boolean) => void
  onDeleted?: () => void
}

/** Giới hạn theo server (256 KB / bản ghi): chừa chỗ cho tiêu đề + JSON. */
const MAX_CHARS = 120_000

export function ReadingEditor({ open, onOpenChange, reading, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(reading?.title ?? '')
    setText(reading?.text ?? '')
  }, [open, reading])

  const words = wordCount(text)
  const sentences = text.trim() ? splitReading(text).length : 0

  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip.trim()) return toast.error('Clipboard đang trống')
      setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${clip}` : clip))
    } catch {
      toast.error('Trình duyệt không cho đọc clipboard', { description: 'Hãy nhấn giữ vào ô bên dưới rồi chọn Dán.' })
    }
  }

  const submit = () => {
    const body = text.trim()
    if (!body) return toast.error('Dán nội dung bài đọc trước đã')
    if (body.length > MAX_CHARS) return toast.error(`Bài quá dài (tối đa ${MAX_CHARS.toLocaleString('vi-VN')} ký tự)`)
    const r = saveReading({ id: reading?.id, title: title.trim() || defaultTitle(body), text: body })
    onOpenChange(false)
    onSaved?.(r, !reading)
  }

  const remove = () => {
    if (!reading || !confirm(`Xóa bài đọc "${reading.title}"?`)) return
    removeRecord(reading.id)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{reading ? 'Sửa bài đọc' : 'Bài đọc mới'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Dán một bài tiếng Anh, app sẽ tách câu và đọc lại cho bạn nghe.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form
            className="flex flex-col gap-4 pb-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="reading-title">Tiêu đề</Label>
              <Input
                id="reading-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={text.trim() ? defaultTitle(text) : 'Để trống: lấy câu đầu tiên'}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reading-text">Nội dung</Label>
                <button type="button" onClick={paste} className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                  <ClipboardPasteIcon className="size-4" /> Dán từ clipboard
                </button>
              </div>
              <Textarea
                id="reading-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your English text here…"
                spellCheck={false}
                className="min-h-56 text-base leading-relaxed sm:min-h-72"
              />
              <p className="text-xs text-muted-foreground">
                {words} từ · {sentences} câu
              </p>
            </div>
          </form>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <div className="flex gap-2">
            {reading && (
              <Button type="button" variant="destructive" size="lg" className="h-12" onClick={remove} aria-label="Xóa bài đọc">
                <Trash2Icon />
              </Button>
            )}
            <Button type="button" variant="brand" size="lg" className="h-12 flex-1" onClick={submit}>
              {reading ? 'Lưu thay đổi' : 'Lưu & đọc'}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
