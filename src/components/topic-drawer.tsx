import { useEffect, useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { removeTopic, saveTopic } from '@/lib/store'
import type { Topic } from '@/lib/types'
import { cn } from '@/lib/utils'

const EMOJIS = ['📚', '🔢', '👋', '🍜', '🏠', '👪', '🎨', '⏰', '🚗', '💼', '🛒', '🌤️', '🐼', '❤️', '🏥', '✈️']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic: Topic | null
  onDeleted?: () => void
  onCreated?: (t: Topic) => void
}

export function TopicDrawer({ open, onOpenChange, topic, onDeleted, onCreated }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📚')

  useEffect(() => {
    if (!open) return
    setName(topic?.name ?? '')
    setEmoji(topic?.emoji ?? '📚')
  }, [open, topic])

  const submit = () => {
    if (!name.trim()) return toast.error('Nhập tên chủ đề')
    const t = saveTopic({ id: topic?.id, name: name.trim(), emoji })
    onOpenChange(false)
    if (!topic) onCreated?.(t)
  }

  const remove = () => {
    if (!topic || !confirm(`Xóa chủ đề "${topic.name}"? Các từ vựng trong đó vẫn được giữ lại.`)) return
    removeTopic(topic.id)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">{topic ? 'Sửa chủ đề' : 'Chủ đề mới'}</DrawerTitle>
        </DrawerHeader>
        <form
          className="flex flex-col gap-4 px-5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="topic-name">Tên</Label>
            <Input id="topic-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Số đếm 1–10" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Biểu tượng</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn('aspect-square rounded-xl text-xl transition-colors', emoji === e ? 'bg-brand/15 ring-2 ring-brand' : 'bg-muted hover:bg-muted/70')}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </form>
        <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            {topic && (
              <Button type="button" variant="destructive" size="lg" className="h-12" onClick={remove} aria-label="Xóa chủ đề">
                <Trash2Icon />
              </Button>
            )}
            <Button type="button" variant="brand" size="lg" className="h-12 flex-1" onClick={submit}>
              Lưu
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
