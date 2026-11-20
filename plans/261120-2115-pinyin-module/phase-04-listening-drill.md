# Phase 04 — Luyện nghe phân biệt

**Goal:** Phần "Luyện nghe" trong `PinyinView`: chọn kiểu (Thanh điệu / Âm đầu / Vần / Trộn) + số câu (10 / 20),
bấm Bắt đầu → hộp thoại luyện giống "Nghe & chọn": tự phát âm tiết, chọn 1 đáp án, sai thì tô đỏ/xanh + gặp lại cuối lượt,
cuối lượt tổng kết (đúng ngay lần đầu x/n, danh sách âm tiết phải ôn, bấm để nghe lại).

## 1. Files chạm vào

| File | Action |
|---|---|
| `src/lib/pinyin-drill.ts` | CREATE |
| `src/components/pinyin-drill.tsx` | CREATE |
| `src/components/pinyin-view.tsx` | MODIFY (thay placeholder bằng phần chọn kiểu + nút Bắt đầu) |

## 2. `src/lib/pinyin-drill.ts`

```ts
import { shuffle } from './flashcard'
import { isSyllable, spell, TONES, toneMark, type Tone } from './pinyin'

export type DrillKind = 'tone' | 'initial' | 'final'
export type DrillMode = DrillKind | 'mix'

export interface Option { syllable: string; tone: Tone; label: string }
export interface Question { id: string; kind: DrillKind; syllable: string; tone: Tone; options: Option[] }

// Cặp/nhóm người Việt hay nhầm.
export const INITIAL_SETS = [['b','p'],['d','t'],['g','k'],['j','q','x'],['zh','ch','sh'],['z','c','s'],
  ['zh','z','j'],['ch','c','q'],['sh','s','x'],['n','l'],['f','h'],['r','l']]
export const FINAL_SETS = [['an','ang'],['en','eng'],['in','ing'],['ian','iang'],['uan','uang'],['u','ü'],
  ['ie','üe'],['ou','uo'],['ai','ei'],['ong','eng']]

export function makeQuestions(mode: DrillMode, n: number): Question[]
```

- **tone**: âm tiết ngẫu nhiên trong `RECORDED` (qua danh sách mọi `syllablesOf`), thanh ngẫu nhiên; 4 lựa chọn
  `toneMark(s, 1..4)` theo thứ tự thanh (không xáo, để phím 1–4 = thanh 1–4).
- **initial**: chọn nhóm trong `INITIAL_SETS`, chọn vần sao cho ≥ 2 âm đầu trong nhóm ghép được (`isSyllable(spell(i,f))`);
  lựa chọn = các âm tiết hợp lệ đó, cùng thanh, hiện có dấu; xáo.
- **final**: tương tự với `FINAL_SETS` và một âm đầu (kể cả không âm đầu) ghép được ≥ 2 vần trong nhóm.
- **mix**: mỗi câu chọn ngẫu nhiên một trong 3 kiểu.
- Không lặp cùng (syllable, tone) trong một lượt; `id` = `q0..q{n-1}`.
- Đáp án đúng là option có `syllable === q.syllable && tone === q.tone`.

## 3. `src/components/pinyin-drill.tsx` (default export, tải lười)

- Cấu trúc theo `listening-quiz.tsx`: `ResponsiveDialog`, thanh tiến độ, nút nghe lại to (Space), lựa chọn dạng nút lớn
  (phím 1–4), sau khi chọn: đúng → xanh, sai → đỏ + xanh đáp án đúng + phát lại; nút "Tiếp" (Enter).
- Hàng đợi: `startDeck(ids)` / `answer(deck, correct)` / `isDone` từ `src/lib/flashcard.ts`.
- Tự phát khi hiện câu (chờ 250 ms như Nghe & chọn); lỗi tải → hiện nút "Thử lại" thay vì toast liên tục.
- Tổng kết: tự viết (không dùng `StudySummary` vì kiểu `Word`): "Xong lượt n câu", "Đúng ngay lần đầu x/n",
  danh sách âm tiết sai (`toneMark`) bấm để nghe, nút `Luyện lại câu sai` / `Lượt mới` dùng `SummaryActions`-style
  layout (chú ý lỗi nút bẹt: `sm:flex-1`, không `flex-1` trong `flex-col`).
- Gợi ý theo kiểu câu dưới tiêu đề: "Nghe và chọn thanh" / "Nghe và chọn âm đầu đúng" / "Nghe và chọn vần đúng".

## 4. `pinyin-view.tsx` — phần chọn

Hai nhóm nút như `StudyPicker`: kiểu luyện (4 thẻ có icon + mô tả) và số câu (10 / 20); nhớ `fluency:pinyin-drill`.
Nút "Bắt đầu" → `makeQuestions(mode, count)` → mở `PinyinDrill`.

## 5. Acceptance criteria

- [ ] `npm run build` pass.
- [ ] Script scratchpad: `makeQuestions(k, 20)` cho mỗi kiểu × 200 lần: luôn đủ 20 câu, mọi option `isSyllable`, đúng 1
  option khớp đáp án, initial/final có ≥ 2 option, không trùng label trong một câu.
- [ ] Playwright 390×844: chạy một lượt 10 câu (chọn sai 1 câu → câu đó quay lại cuối), thấy tổng kết; phím 1–4 / Space / Enter
  chạy trên desktop.
- [ ] Nút tổng kết không bẹt ở 390px (chụp màn hình).
- [ ] Thử trên iPhone thật (người dùng): âm thanh tự phát khi sang câu mới.

## 6. Out of scope

Lưu kết quả, độ khó thích ứng, luyện thanh của cụm 2 âm tiết.

## 7. Commit message dự kiến

```
Thêm luyện nghe phân biệt pinyin: thanh, âm đầu, vần

src/lib/pinyin-drill.ts sinh câu hỏi từ các nhóm dễ nhầm (zh/z/j, an/ang, u/ü…);
PinyinDrill chạy lượt kiểu Nghe & chọn, sai thì gặp lại cuối lượt, có tổng kết.
```
