# Phase 02 — Tab Pinyin + Bảng âm

**Goal:** App có tab thứ 3 "Pinyin" (điện thoại / màn nhỏ) và mục "Pinyin" ở cột trái (desktop), mở `PinyinView`
(tải lười). `PinyinView` có thanh chọn 3 phần: **Bảng âm** (làm xong ở phase này), **Thanh điệu**, **Luyện nghe**
(phase 03/04 — tạm hiện "Sắp có"). Bấm âm tiết trong bảng → hộp thoại nghe 4 thanh + mẹo phát âm.

## 1. Files chạm vào

| File | Action |
|---|---|
| `src/App.tsx` | MODIFY |
| `src/components/pinyin-view.tsx` | CREATE |
| `src/components/pinyin-chart.tsx` | CREATE |
| `src/components/syllable-dialog.tsx` | CREATE |

## 2. `src/App.tsx`

- `type Tab = 'topics' | 'words' | 'pinyin'`.
- `const PinyinView = lazy(() => import('@/components/pinyin-view'))`.
- **Điện thoại / màn nhỏ**: thanh tab `grid-cols-2` → `grid-cols-3`, nhãn `Chủ đề (n)` / `Tất cả từ (n)` / `Pinyin`;
  `sm:max-w-sm` → `sm:max-w-md`. Khi `tab === 'pinyin'` (và không mở chủ đề) render
  `<Suspense fallback={null}><PinyinView /></Suspense>` thay cho lưới chủ đề / danh sách từ.
  Ẩn nút nổi "Thêm từ" khi `tab === 'pinyin' && !topic`.
- **Desktop**: thêm `SideItem` "Pinyin" (emoji `🔤`, không đếm số → `count` thành optional) ở đầu `nav`, trên "Tất cả từ".
  `active = tab === 'pinyin'`. Bấm "Tất cả từ" / một chủ đề → `setTab('words')` trước khi điều hướng.
  Cột phải: `tab === 'pinyin'` → `PinyinView`, ngược lại như cũ. Tiêu đề cột phải "Pinyin" khi ở tab này.
- `showWords` giữ nguyên ý nghĩa nhưng loại trừ `tab === 'pinyin'` trên desktop.

## 3. `src/components/pinyin-view.tsx` (default export)

- Thanh phân đoạn giống thanh tab hiện có (`rounded-xl bg-muted p-1`): `Bảng âm` / `Thanh điệu` / `Luyện nghe`.
  Phần đang chọn nhớ trong `localStorage` `fluency:pinyin-section` (try/catch như `study-picker.tsx`).
- Nội dung: `<PinyinChart />` | placeholder (phase 03) | placeholder (phase 04).
- Chân trang: dòng ghi công nhỏ `text-xs text-muted-foreground`:
  "Âm thanh: <a href="https://github.com/hugolpz/audio-cmn">audio-cmn</a> — Chen Wang, Yue Tan (CC BY-SA 4.0)".

## 4. `src/components/pinyin-chart.tsx`

- Hàng chip âm đầu, chia nhóm theo `Initial.group` (nhãn nhóm nhỏ phía trên mỗi cụm; chip `''` hiện "Ø" / "không").
  Âm đầu đang chọn nhớ trong `localStorage` `fluency:pinyin-initial`, mặc định `b`.
- Dưới chip: thẻ mẹo của âm đầu đang chọn (`Initial.tip`).
- Lưới âm tiết `syllablesOf(initial)`, chia theo `Final.row` (4 khối a / i / u / ü, khối rỗng thì ẩn):
  ô `grid-cols-4 sm:grid-cols-6 lg:grid-cols-8`, mỗi ô chữ viết âm tiết (font to) + id vần nhỏ bên dưới nếu khác chữ viết
  (vd. ô `you` ghi nhỏ `iou`). Bấm ô → mở `SyllableDialog`.
- Bấm ô cũng phát luôn thanh 1 (`playSyllable(s, 1)`), lỗi → `toast.error(err.message)`.

## 5. `src/components/syllable-dialog.tsx`

- `ResponsiveDialog` (như `study-picker.tsx`). Tiêu đề: chữ viết âm tiết.
- 4 nút lớn `grid-cols-2 sm:grid-cols-4`: `toneMark(s, t)` + "Thanh t", bấm → `playSyllable(s, t)`; nút đang phát tô `brand`.
- Nút "Nghe lần lượt 1→4": phát 4 thanh cách nhau ~900 ms (huỷ khi đóng hộp thoại).
- Hai thẻ mẹo: âm đầu (`Initial.tip`, bỏ nếu không âm đầu) và vần (`Final.tip`).
- Props: `{ open, onOpenChange, initial: Initial, final: Final, syllable: string }`.

## 6. Encapsulation / wiring notes

- Component chỉ gọi hàm public của `src/lib/pinyin.ts`; không fetch trực tiếp.
- `PinyinView` là default export để `lazy()` dùng được (giống `flashcard.tsx`).
- Không đụng `WordDrawer`, `StudyPicker`, đồng bộ.

## 7. Acceptance criteria

- [ ] `npm run build` pass; `PinyinView` tách chunk riêng (xem output vite).
- [ ] Chạy `npm run dev`, Playwright ở 390×844 và 1280×800:
  - tab Pinyin hiện, chọn `zh` → có ô `zhi`, `zhuang`; chọn `j` → có `ju`, `juan`, không có `jü`; chọn `l` → có `lü`.
  - bấm ô `ma` → hộp thoại, 4 nút `mā má mǎ mà`; request `cmn-ma3.mp3` trả 200 khi bấm thanh 3.
  - desktop: mục Pinyin ở cột trái, bấm "Tất cả từ" quay lại danh sách từ.
- [ ] Hồi quy: tab Chủ đề / Tất cả từ, mở chủ đề + nút Back, nút "Thêm từ" vẫn chạy.
- [ ] Chụp màn hình điện thoại sáng + tối để người dùng xem.

## 8. Out of scope

Nội dung Thanh điệu, Luyện nghe; ma trận đầy đủ; xem theo vần.

## 9. Commit message dự kiến

```
Thêm tab Pinyin và bảng âm nghe được

Tab thứ 3 (desktop: mục cột trái) mở PinyinView tải lười. Bảng âm: chọn âm đầu →
lưới âm tiết theo hàng vần, bấm để nghe 4 thanh (audio-cmn) kèm mẹo phát âm.
```
