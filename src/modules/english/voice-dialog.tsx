import { Volume2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { setEnTts, speakEn, useEnTts } from '@/lib/english-tts'

const SAMPLE = 'Hello! This is how I sound when I read your text.'

export function EnglishVoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { settings, voices } = useEnTts()

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Giọng đọc tiếng Anh</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Lưu riêng trên máy này (mỗi máy có bộ giọng khác nhau).</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {voices.length === 0 ? (
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
              Máy chưa có giọng tiếng Anh. Thêm giọng "English" trong cài đặt ngôn ngữ / giọng nói của hệ điều hành.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="en-voice">Giọng</Label>
              <select
                id="en-voice"
                value={settings.voiceURI}
                onChange={(e) => setEnTts({ voiceURI: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Tự động ({voices[0]?.name})</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} · {v.lang}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="en-rate">Tốc độ</Label>
              <span className="text-sm text-muted-foreground tabular-nums">{settings.rate.toFixed(2)}×</span>
            </div>
            <input
              id="en-rate"
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.rate}
              onChange={(e) => setEnTts({ rate: Number(e.target.value) })}
              className="w-full accent-[var(--brand)]"
            />
          </div>

          <Button variant="outline" onClick={() => speakEn(SAMPLE)}>
            <Volume2Icon /> Nghe thử
          </Button>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
