// Tải âm thanh pinyin về public/audio từ audio-cmn (https://github.com/hugolpz/audio-cmn, CC BY-SA:
// âm tiết – Chen Wang, từ HSK – Yue Tan), bản 24k-abr (~5 KB/file), ghim commit.
//
// jsDelivr không phục vụ repo này (>50 MB, chỉ trả file đã có sẵn trong cache) → tự host cùng app.
// - public/audio/syllables/<âm tiết><thanh>.mp3, ü viết v (lv3.mp3). Bản gốc lưu ju4 dưới tên jv4 → đổi lại ju4.
// - public/audio/words/<từ>.mp3: các từ ví dụ trong bài Thanh điệu (src/components/tone-lesson.tsx) có trong danh sách HSK.
//
// Chạy lại: node scripts/fetch-pinyin-audio.mjs

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const REPO = 'hugolpz/audio-cmn'
const COMMIT = 'f759a0f18f27690742957619e1248ed91e9b3f2c'
const RAW = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/24k-abr/`
const OUT = new URL('../public/audio/', import.meta.url)

const WORDS = [
  '飞机', '学习', '我', '再见', '妈妈', '爸爸', '谢谢', '朋友', '东西',
  '水果', '可以', '展览', '小姐', '你好',
  '一样', '一定', '一下', '一般', '一边', '一直', '一起',
  '不是', '不对', '不要', '不用', '不同', '不行', '不久', '不少',
]

const tree = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${COMMIT}?recursive=1`).then((r) => r.json())
if (!tree.tree) throw new Error('Không đọc được cây file audio-cmn: ' + JSON.stringify(tree).slice(0, 200))
const paths = new Set(tree.tree.map((t) => t.path))

const jobs = []
for (const p of paths) {
  const m = p.match(/^24k-abr\/syllabs\/cmn-([a-z]+)([1-4])\.mp3$/)
  if (!m) continue // bỏ âm tiết hiếm (_hm, _ng…) và thanh nhẹ
  const name = (m[1] === 'jv' ? 'ju' : m[1]) + m[2]
  jobs.push({ url: RAW + p.slice('24k-abr/'.length), out: `syllables/${name}.mp3` })
}
const missing = []
for (const w of WORDS) {
  if (paths.has(`24k-abr/hsk/cmn-${w}.mp3`)) jobs.push({ url: RAW + `hsk/cmn-${encodeURIComponent(w)}.mp3`, out: `words/${w}.mp3` })
  else missing.push(w)
}

rmSync(new URL('words/', OUT), { recursive: true, force: true })
mkdirSync(new URL('syllables/', OUT), { recursive: true })
mkdirSync(new URL('words/', OUT), { recursive: true })
let bytes = 0
for (let i = 0; i < jobs.length; i += 8) {
  await Promise.all(
    jobs.slice(i, i + 8).map(async ({ url, out }) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      const buf = Buffer.from(await res.arrayBuffer())
      bytes += buf.length
      writeFileSync(new URL(out, OUT), buf)
    }),
  )
}
console.log(`Đã tải ${jobs.length} file, ${(bytes / 1024 / 1024).toFixed(1)} MB`)
if (missing.length) console.log('Không có trong HSK (dùng giọng máy):', missing.join(' '))
