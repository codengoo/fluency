// Sinh src/lib/hanviet.json: âm Hán Việt theo pinyin cho cả chữ phồn thể lẫn giản thể.
//
// Nguồn: gói hanviet-pinyin-words (MIT, https://github.com/ph0ngp/hanviet-pinyin-words) — chỉ có chữ phồn thể.
// Mỗi chữ phồn thể được đổi sang giản thể bằng opencc-js rồi gộp âm theo pinyin
// (vd. 乾 gān/qián + 幹 gàn + 干 gān → 干: gan1 can, qian2 càn/kiền, gan4 cán).
//
// Chạy lại (không cần cài vào dự án):
//   npm i --no-save hanviet-pinyin-words opencc-js && node scripts/gen-hanviet.mjs

import fs from 'node:fs'
import * as OpenCC from 'opencc-js'
import { hanvietData } from 'hanviet-pinyin-words'

const t2s = OpenCC.Converter({ from: 't', to: 'cn' })
const out = {}
const add = (ch, py, list) => {
  if (!list.length) return
  const e = (out[ch] ??= {})
  e[py] = [...new Set([...(e[py] ?? []), ...list])]
}
// Chữ phồn thể trước để thứ tự âm của chữ gốc được giữ khi gộp.
for (const [ch, m] of Object.entries(hanvietData)) for (const [py, l] of Object.entries(m)) add(ch, py, l)
for (const [ch, m] of Object.entries(hanvietData)) {
  const s = t2s(ch)
  if (s === ch || [...s].length !== 1) continue
  for (const [py, l] of Object.entries(m)) add(s, py, l)
}
const compact = Object.fromEntries(
  Object.entries(out).map(([c, m]) => [c, Object.fromEntries(Object.entries(m).map(([p, l]) => [p, l.join(',')]))]),
)
fs.writeFileSync(new URL('../src/lib/hanviet.json', import.meta.url), JSON.stringify(compact))
console.log('Số chữ:', Object.keys(out).length)
