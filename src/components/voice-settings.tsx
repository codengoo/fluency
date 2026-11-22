import { useState, useSyncExternalStore } from 'react'
import { RotateCcwIcon, Volume2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SliderField } from '@/components/ui/slider'
import {
  autoVoiceName,
  canSpeak,
  getTtsSettings,
  listVoices,
  resetTtsSettings,
  setTtsSettings,
  speak,
  subscribeTts,
  type TtsSettings,
} from '@/lib/chinese'

const SAMPLE = '你好，我在学习中文。'

export function VoiceSettings() {
  const tts = useSyncExternalStore(subscribeTts, getTtsSettings)
  const voices = useSyncExternalStore(subscribeTts, listVoices)
  const [sample, setSample] = useState(SAMPLE)

  if (!canSpeak()) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Giọng đọc</h3>
        <p className="text-xs text-muted-foreground">Trình duyệt này không hỗ trợ đọc to.</p>
      </section>
    )
  }

  const zh = voices.filter((v) => /^(zh|cmn|yue)([-_]|$)/i.test(v.lang) || /chinese|mandarin|cantonese|普通话|中文/i.test(v.name))
  const others = voices.filter((v) => !zh.includes(v))
  const set = (patch: Partial<TtsSettings>) => setTtsSettings(patch)
  const auto = autoVoiceName()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Giọng đọc</h3>
        <Button variant="ghost" size="sm" onClick={resetTtsSettings}>
          <RotateCcwIcon /> Mặc định
        </Button>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Giọng</span>
        <NativeSelect
          value={tts.voiceURI}
          onChange={(e) => set({ voiceURI: e.target.value })}
        >
          <option value="">Tự động{auto ? ` (${auto})` : ''}</option>
          {zh.length > 0 && (
            <optgroup label="Tiếng Trung">
              {zh.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                  {v.localService ? '' : ' · online'}
                </option>
              ))}
            </optgroup>
          )}
          {others.length > 0 && (
            <optgroup label="Giọng khác">
              {others.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                </option>
              ))}
            </optgroup>
          )}
        </NativeSelect>
        {zh.length === 0 && (
          <span className="block text-xs text-amber-600">
            Máy chưa có giọng tiếng Trung — cài "Chinese (Simplified)" trong cài đặt giọng nói của hệ điều hành.
          </span>
        )}
      </label>

      <SliderField format={(v) => `${v.toFixed(2)}×`} label="Tốc độ" value={tts.rate} min={0.3} max={1.5} step={0.05} onChange={(rate) => set({ rate })} />
      <SliderField label="Cao độ" value={tts.pitch} min={0.5} max={1.5} step={0.05} onChange={(pitch) => set({ pitch })} />
      <SliderField format={(v) => `${Math.round(v * 100)}%`} label="Âm lượng" value={tts.volume} min={0.1} max={1} step={0.05} onChange={(volume) => set({ volume })} />

      <div className="flex gap-2">
        <Input value={sample} onChange={(e) => setSample(e.target.value)} placeholder="Câu nghe thử…" />
        <Button variant="secondary" onClick={() => speak(sample || SAMPLE)}>
          <Volume2Icon /> Nghe thử
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Cấu hình chỉ lưu trên máy này, không đồng bộ.</p>
    </section>
  )
}
