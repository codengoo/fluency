import { CloudAlertIcon, CloudCheckIcon, CloudOffIcon, CloudUploadIcon, LoaderCircleIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function SyncBadge({ showLabel }: { showLabel?: boolean }) {
  const { status, pending } = useStore()
  const [Icon, label, tone] =
    status === 'syncing'
      ? [LoaderCircleIcon, 'Đang đồng bộ…', 'text-muted-foreground']
      : status === 'offline'
        ? [CloudOffIcon, 'Ngoại tuyến – lưu trên máy', 'text-amber-600 dark:text-amber-400']
        : status === 'error'
          ? [CloudAlertIcon, 'Lỗi đồng bộ, sẽ thử lại', 'text-destructive']
          : pending > 0
            ? [CloudUploadIcon, 'Chờ đồng bộ', 'text-muted-foreground']
            : [CloudCheckIcon, 'Đã đồng bộ', 'text-emerald-600 dark:text-emerald-400']
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', tone)} title={label}>
      <Icon className={cn('size-4', status === 'syncing' && 'animate-spin')} />
      {showLabel && label}
    </span>
  )
}
