import { Volume2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { canSpeak, hasChineseVoice, speak } from '@/lib/chinese'
import { cn } from '@/lib/utils'

let warned = false

export function SpeakButton({ text, className, size = 'md' }: { text: string; className?: string; size?: 'sm' | 'md' }) {
  if (!canSpeak() || !text.trim()) return null
  return (
    <button
      type="button"
      aria-label="Đọc to"
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
        if (!warned && !hasChineseVoice()) {
          warned = true
          toast.warning('Máy chưa có giọng đọc tiếng Trung', {
            description: 'Cài thêm giọng "Chinese (Simplified)" trong cài đặt ngôn ngữ / giọng nói của hệ điều hành.',
          })
        }
      }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full text-brand transition-colors hover:bg-brand/10 active:scale-95',
        size === 'md' ? 'size-10' : 'size-8',
        className,
      )}
    >
      <Volume2Icon className={size === 'md' ? 'size-5' : 'size-4'} />
    </button>
  )
}
