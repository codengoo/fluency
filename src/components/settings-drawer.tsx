import { useRef, useState } from 'react'
import { CopyIcon, DownloadIcon, RefreshCwIcon, UploadIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'
import { exportJson, importJson, shareLink, switchLibrary, syncNow, useStore } from '@/lib/store'
import { SyncBadge } from './sync-badge'
import { VoiceSettings } from './voice-settings'

export function SettingsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { words, topics, readings, lastSyncAt, pending } = useStore()
  const [other, setOther] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const link = shareLink()

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Cài đặt</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {words.length} từ · {topics.length} chủ đề · {readings.length} bài đọc
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="sheet-stagger flex flex-col gap-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <section className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
            <div>
              <SyncBadge showLabel />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lastSyncAt ? `Lần cuối: ${new Date(lastSyncAt).toLocaleString('vi-VN')}` : 'Chưa đồng bộ lần nào'}
                {pending > 0 && ` · ${pending} thay đổi chờ gửi`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void syncNow()}>
              <RefreshCwIcon /> Đồng bộ
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Mở sổ này trên máy khác</h3>
            <div className="flex justify-center rounded-2xl bg-white p-4">
              <QRCodeSVG value={link} size={180} />
            </div>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button
                variant="secondary"
                size="icon"
                aria-label="Sao chép link"
                onClick={() => navigator.clipboard.writeText(link).then(() => toast.success('Đã sao chép link'))}
              >
                <CopyIcon />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Ai có link này đều xem và sửa được sổ từ. Đừng chia sẻ công khai.</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Dùng sổ từ máy khác</h3>
            <div className="flex gap-2">
              <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Dán link hoặc khóa…" />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!confirm('Chuyển sang sổ đó? Dữ liệu trên máy này sẽ được gộp vào sổ mới.')) return
                  if (!switchLibrary(other)) toast.error('Link / khóa không hợp lệ')
                }}
                disabled={!other.trim()}
              >
                Mở
              </Button>
            </div>
          </section>

          <VoiceSettings />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Sao lưu</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={exportJson}>
                <DownloadIcon /> Xuất JSON
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <UploadIcon /> Nhập JSON
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                try {
                  const n = await importJson(file)
                  toast.success(`Đã nhập ${n} bản ghi`)
                } catch (err) {
                  toast.error((err as Error).message)
                }
              }}
            />
          </section>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
