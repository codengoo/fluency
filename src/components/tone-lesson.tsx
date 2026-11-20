import { Volume2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { playSyllable, playWord, TONES, toneMark, type Tone } from '@/lib/pinyin'
import { cn } from '@/lib/utils'

// Bài Thanh điệu: 4 thanh + thanh nhẹ, biến điệu, quy tắc đặt dấu. Ví dụ nào cũng bấm nghe được
// (âm tiết / từ thu sẵn trong public/audio; từ không có file thì đọc bằng giọng máy).

// Cao độ theo thang 5 bậc (Chao): 1 thấp nhất, 5 cao nhất.
const CONTOURS: Record<Tone | 0, number[]> = { 1: [5, 5], 2: [3, 5], 3: [2, 1, 4], 4: [5, 1], 0: [3] }

const TONE_INFO: { tone: Tone | 0; name: string; mark: string; desc: string; vi: string; word: { hanzi: string; pinyin: string } }[] = [
  { tone: 1, name: 'Thanh 1', mark: 'ˉ', desc: 'Cao, ngang, giữ đều.', vi: 'Như thanh ngang tiếng Việt nhưng cao hơn.', word: { hanzi: '飞机', pinyin: 'fēijī' } },
  { tone: 2, name: 'Thanh 2', mark: 'ˊ', desc: 'Từ giữa lên cao.', vi: 'Gần dấu sắc, lên từ từ.', word: { hanzi: '学习', pinyin: 'xuéxí' } },
  {
    tone: 3,
    name: 'Thanh 3',
    mark: 'ˇ',
    desc: 'Xuống thấp rồi lên; nói nhanh thường chỉ xuống thấp rồi dừng.',
    vi: 'Gần dấu hỏi.',
    word: { hanzi: '我', pinyin: 'wǒ' },
  },
  { tone: 4, name: 'Thanh 4', mark: 'ˋ', desc: 'Từ cao rơi mạnh xuống.', vi: 'Rơi dứt khoát như khi ra lệnh, gần dấu nặng nói to.', word: { hanzi: '再见', pinyin: 'zàijiàn' } },
  {
    tone: 0,
    name: 'Thanh nhẹ',
    mark: '·',
    desc: 'Ngắn, nhẹ, không dấu; cao độ theo chữ đứng trước.',
    vi: 'Thường là chữ thứ hai của từ lặp hoặc trợ từ.',
    word: { hanzi: '妈妈', pinyin: 'māma' },
  },
]

const NEUTRAL = [
  { hanzi: '妈妈', pinyin: 'māma' },
  { hanzi: '爸爸', pinyin: 'bàba' },
  { hanzi: '谢谢', pinyin: 'xièxie' },
  { hanzi: '朋友', pinyin: 'péngyou' },
  { hanzi: '东西', pinyin: 'dōngxi' },
]

type Example = { hanzi: string; written: string; spoken: string }

const SANDHI: { title: string; rule: string; note?: string; groups: { label: string; items: Example[] }[] }[] = [
  {
    title: '3 + 3 → 2 + 3',
    rule: 'Hai thanh 3 liền nhau: chữ đầu đọc thành thanh 2.',
    note: 'Chữ viết vẫn giữ dấu thanh 3.',
    groups: [
      {
        label: '',
        items: [
          { hanzi: '你好', written: 'nǐhǎo', spoken: 'níhǎo' },
          { hanzi: '水果', written: 'shuǐguǒ', spoken: 'shuíguǒ' },
          { hanzi: '可以', written: 'kěyǐ', spoken: 'kéyǐ' },
          { hanzi: '展览', written: 'zhǎnlǎn', spoken: 'zhánlǎn' },
          { hanzi: '小姐', written: 'xiǎojiě', spoken: 'xiáojiě' },
        ],
      },
    ],
  },
  {
    title: '一 (yī)',
    rule: 'Đứng một mình, khi đếm hoặc cuối từ đọc yī. Trước thanh 4 đọc yí, trước thanh 1 / 2 / 3 đọc yì.',
    groups: [
      {
        label: 'Trước thanh 4 → yí',
        items: [
          { hanzi: '一样', written: 'yīyàng', spoken: 'yíyàng' },
          { hanzi: '一定', written: 'yīdìng', spoken: 'yídìng' },
          { hanzi: '一下', written: 'yīxià', spoken: 'yíxià' },
        ],
      },
      {
        label: 'Trước thanh 1 / 2 / 3 → yì',
        items: [
          { hanzi: '一般', written: 'yībān', spoken: 'yìbān' },
          { hanzi: '一边', written: 'yībiān', spoken: 'yìbiān' },
          { hanzi: '一直', written: 'yīzhí', spoken: 'yìzhí' },
          { hanzi: '一起', written: 'yīqǐ', spoken: 'yìqǐ' },
        ],
      },
    ],
  },
  {
    title: '不 (bù)',
    rule: 'Trước thanh 4 đọc bú; còn lại giữ bù.',
    groups: [
      {
        label: 'Trước thanh 4 → bú',
        items: [
          { hanzi: '不是', written: 'bùshì', spoken: 'búshì' },
          { hanzi: '不对', written: 'bùduì', spoken: 'búduì' },
          { hanzi: '不要', written: 'bùyào', spoken: 'búyào' },
          { hanzi: '不用', written: 'bùyòng', spoken: 'búyòng' },
        ],
      },
      {
        label: 'Trước thanh 1 / 2 / 3 → giữ bù',
        items: [
          { hanzi: '不同', written: 'bùtóng', spoken: 'bùtóng' },
          { hanzi: '不行', written: 'bùxíng', spoken: 'bùxíng' },
          { hanzi: '不久', written: 'bùjiǔ', spoken: 'bùjiǔ' },
          { hanzi: '不少', written: 'bùshǎo', spoken: 'bùshǎo' },
        ],
      },
    ],
  },
]

const MARK_EXAMPLES: [string, Tone][] = [
  ['hao', 3],
  ['xie', 3],
  ['duo', 1],
  ['zhou', 1],
  ['liu', 4],
  ['gui', 4],
  ['lü', 4],
]

const say = (syllable: string, tone: Tone) => playSyllable(syllable, tone).catch((e: Error) => toast.error(e.message))

export function ToneLesson() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-lg font-bold">Bốn thanh và thanh nhẹ</h3>
        <p className="mb-3 text-sm text-muted-foreground">Cùng một âm tiết, đổi thanh là đổi nghĩa: mā 妈 (mẹ), má 麻 (tê), mǎ 马 (ngựa), mà 骂 (mắng).</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => say('ma', t)}
              className="flex h-16 flex-col items-center justify-center rounded-2xl bg-card transition-transform hover:bg-muted active:scale-95"
            >
              <span className="text-xl font-semibold">{toneMark('ma', t)}</span>
              <span className="text-xs text-muted-foreground">Thanh {t}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TONE_INFO.map((t) => (
            <div key={t.tone} className="flex gap-3 rounded-2xl bg-card p-3">
              <Contour levels={CONTOURS[t.tone]} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {t.name} <span className="ml-1 text-muted-foreground">{t.mark}</span>
                </p>
                <p className="text-sm">{t.desc}</p>
                <p className="text-sm text-muted-foreground">{t.vi}</p>
                <WordChip hanzi={t.word.hanzi} pinyin={t.word.pinyin} className="mt-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-sm text-muted-foreground">Thanh nhẹ:</span>
          {NEUTRAL.map((w) => (
            <WordChip key={w.hanzi} hanzi={w.hanzi} pinyin={w.pinyin} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg font-bold">Biến điệu</h3>
        <p className="mb-3 text-sm text-muted-foreground">Một số chữ đổi thanh khi đứng cạnh chữ khác. Bấm để nghe cách đọc thật.</p>
        <div className="space-y-3">
          {SANDHI.map((s) => (
            <div key={s.title} className="rounded-2xl bg-card p-4">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm">{s.rule}</p>
              {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
              {s.groups.map((g) => (
                <div key={g.label} className="mt-3">
                  {g.label && <p className="mb-1.5 text-xs text-muted-foreground">{g.label}</p>}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {g.items.map((e) => (
                      <button
                        key={e.hanzi}
                        type="button"
                        onClick={() => playWord(e.hanzi)}
                        className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-left transition-transform active:scale-95"
                      >
                        <span className="font-hanzi text-xl">{e.hanzi}</span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-sm font-semibold text-brand">{e.spoken}</span>
                          {e.written !== e.spoken && <span className="block text-xs text-muted-foreground line-through">{e.written}</span>}
                        </span>
                        <Volume2Icon className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg font-bold">Đặt dấu thanh</h3>
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
          <li>
            Có <b>a</b> hoặc <b>e</b> → dấu trên a / e (hǎo, xiě).
          </li>
          <li>
            Có <b>ou</b> → dấu trên o (zhōu).
          </li>
          <li>Còn lại → dấu trên nguyên âm cuối (duō, liù, guì).</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          {MARK_EXAMPLES.map(([s, t]) => (
            <button
              key={s}
              type="button"
              onClick={() => say(s, t)}
              className="rounded-xl bg-card px-3 py-1.5 text-lg font-semibold transition-transform hover:bg-muted active:scale-95"
            >
              {toneMark(s, t)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          ü: sau j q x y viết u (ju, qu, xu, yu) nhưng vẫn đọc ü; sau n l giữ ü (nǚ, lǜ).
        </p>
      </section>
    </div>
  )
}

function WordChip({ hanzi, pinyin, className }: { hanzi: string; pinyin: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => playWord(hanzi)}
      className={cn('inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 transition-transform active:scale-95', className)}
    >
      <span className="font-hanzi">{hanzi}</span>
      <span className="text-sm text-brand">{pinyin}</span>
      <Volume2Icon className="size-3.5 text-muted-foreground" />
    </button>
  )
}

/** Đường cao độ trên thang 5 bậc (đường kẻ mờ = bậc 1…5). */
function Contour({ levels }: { levels: number[] }) {
  const y = (l: number) => 4 + (5 - l) * 8
  const x = (i: number) => (levels.length === 1 ? 30 : 8 + (i * 44) / (levels.length - 1))
  const pts = levels.map((l, i) => [x(i), y(l)] as const)
  const d =
    pts.length === 3
      ? `M${pts[0][0]},${pts[0][1]} Q${pts[1][0]},${pts[1][1] + 10} ${pts[2][0]},${pts[2][1]}`
      : `M${pts.map((p) => p.join(',')).join(' L')}`
  return (
    <svg viewBox="0 0 60 40" className="h-12 w-[72px] shrink-0 rounded-xl bg-muted" aria-hidden>
      {[1, 2, 3, 4, 5].map((l) => (
        <line key={l} x1="4" x2="56" y1={y(l)} y2={y(l)} className="stroke-muted-foreground/25" strokeWidth="0.5" />
      ))}
      {pts.length === 1 ? (
        <circle cx={pts[0][0]} cy={pts[0][1]} r="3" className="fill-brand" />
      ) : (
        <path d={d} fill="none" className="stroke-brand" strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  )
}
