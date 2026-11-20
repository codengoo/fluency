# Phase 03 — Bài Thanh điệu

**Goal:** Phần "Thanh điệu" trong `PinyinView` là một bài đọc ngắn, cuộn dọc, mọi ví dụ bấm nghe được (âm tiết → file
audio-cmn, từ → file HSK, thiếu thì TTS).

## 1. Files chạm vào

| File | Action |
|---|---|
| `src/components/tone-lesson.tsx` | CREATE |
| `src/components/pinyin-view.tsx` | MODIFY (thay placeholder) |

## 2. Nội dung `tone-lesson.tsx`

### 2.1 Bốn thanh + thanh nhẹ
Mỗi thanh một thẻ: đường cao độ (SVG nhỏ, thang 5 bậc Chao: T1 55, T2 35, T3 214, T4 51; thanh nhẹ: chấm ngắn),
dấu (ˉ ˊ ˇ ˋ), mô tả, so sánh gần đúng với tiếng Việt, ví dụ `mā má mǎ mà` (bấm → `playSyllable('ma', t)`) + một từ.

| Thanh | Mô tả | Gần với tiếng Việt | Từ ví dụ (có file HSK) |
|---|---|---|---|
| 1 | Cao, ngang, giữ đều | Thanh ngang nhưng cao hơn | 先生 |
| 2 | Từ giữa lên cao | Gần dấu sắc, lên từ từ | 学生 |
| 3 | Xuống thấp rồi lên (nói nhanh thường chỉ xuống thấp) | Gần dấu hỏi | 马 |
| 4 | Từ cao rơi mạnh xuống | Rơi dứt khoát, gần dấu nặng nói to | 骂 |
| nhẹ | Ngắn, nhẹ, không dấu, cao độ theo chữ trước | — | 妈妈, 爸爸, 谢谢, 朋友, 东西 |

### 2.2 Biến điệu (nghe cả từ để thấy cách đọc thật)
- **3 + 3 → 2 + 3**: 水果, 可以, 展览, 小姐, 你好 (你好 không có file → TTS). Ghi: chữ viết vẫn giữ dấu thanh 3.
- **一 (yī)**: đứng một mình / đếm / cuối từ → yī; trước thanh 4 → yí (一样, 一定, 一下); trước thanh 1/2/3 → yì
  (一般, 一边, 一直, 一起).
- **不 (bù)**: trước thanh 4 → bú (不是, 不对, 不要, 不用); còn lại giữ bù (不同, 不行, 不久, 不少).
- Mỗi ví dụ: chữ Hán + pinyin **đọc thật** (vd. 一样 yíyàng) + nút nghe `playWord(word)`.

### 2.3 Quy tắc đặt dấu
Danh sách 3 bước (a/e trước; "ou" đặt trên o; còn lại nguyên âm cuối: liù, guì) + bảng ví dụ dùng `toneMark` để sinh
(hǎo, xiě, duō, liù, guì, lǜ). Ghi chú ü: sau j q x y viết u (ju, qu, xu, yu), sau n l giữ ü (nǚ, lǜ).

## 3. Wiring notes

- Dữ liệu ví dụ khai báo hằng trong file component (nội dung tĩnh, không cần lib).
- Từ ví dụ đã kiểm tra có trong `24k-abr/hsk/` tại commit ghim (trừ 你好 → TTS).
- Không thêm thư viện vẽ; SVG viết tay, màu theo token (`stroke="currentColor"` / `text-brand`).

## 4. Acceptance criteria

- [ ] `npm run build` pass.
- [ ] Playwright 390×844: phần Thanh điệu hiện đủ 3 mục; bấm 一样 → request `cmn-一样.mp3` 200; bấm 你好 → không lỗi
  (rơi về TTS, không có toast lỗi).
- [ ] SVG đường cao độ đúng hình (T3 xuống rồi lên, T4 rơi) ở cả nền sáng/tối — chụp màn hình.

## 5. Out of scope

Bài tập trong bài học (đã có phần Luyện nghe), biến điệu khác (啊, 儿化).

## 6. Commit message dự kiến

```
Thêm bài Thanh điệu cho tab Pinyin

Bốn thanh + thanh nhẹ (đường cao độ, so với thanh tiếng Việt), biến điệu 3-3 / 一 / 不,
quy tắc đặt dấu; ví dụ nghe bằng file audio-cmn, thiếu file thì đọc bằng giọng máy.
```
