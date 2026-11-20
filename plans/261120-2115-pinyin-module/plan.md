# Module học Pinyin (tab "Pinyin")

**Date:** 2026-11-20 21:15 (Asia/Ho_Chi_Minh)
**Scope:** `src/lib/`, `src/components/`, `src/App.tsx`
**Trigger:** Fluency mới có sổ từ + ôn tập từ vựng; người mới học cần nắm hệ thống pinyin (âm đầu, vần, thanh điệu)
trước/song song với học từ. Kết quả: tab thứ 3 "Pinyin" có bảng âm nghe được, bài thanh điệu và luyện nghe phân biệt.

## 1. Goal

- Tab **Pinyin** (điện thoại: tab thứ 3 cạnh Chủ đề / Tất cả từ; desktop: mục trong cột trái) gồm 3 phần:
  - **Bảng âm**: chọn âm đầu → lưới âm tiết ghép được; bấm âm tiết → nghe 4 thanh (giọng người thu sẵn) + mẹo
    phát âm âm đầu / vần cho người Việt.
  - **Thanh điệu**: 4 thanh + thanh nhẹ (đường cao độ, so với thanh tiếng Việt), biến điệu 3-3 / 一 / 不, quy tắc
    đặt dấu — ví dụ nào cũng bấm nghe được.
  - **Luyện nghe**: nghe âm tiết → chọn thanh / âm đầu / vần (cặp dễ nhầm), lượt 10/20 câu, sai thì gặp lại cuối lượt.
- Không đổi dữ liệu `Word`/`Topic`, không đổi đồng bộ, không đổi worker.

## 2. Quyết định đã chốt (Q&A 1 vòng + nghiên cứu)

| Câu hỏi | Lựa chọn |
|---|---|
| Phạm vi | Bảng pinyin + Bài thanh điệu + Luyện nghe phân biệt. **Không** làm "gõ pinyin từ trong sổ". |
| Nguồn âm thanh | MP3 thu sẵn **`hugolpz/audio-cmn`** (CC BY-SA, Chen Wang / Yue Tan), commit `f759a0f18f27690742957619e1248ed91e9b3f2c`, bản `24k-abr` (~5 KB/file), **tự host trong `public/audio/`** (1660 âm tiết + 28 từ, 7.3 MB) bằng `scripts/fetch-pinyin-audio.mjs`. |
| Vì sao tự host (đổi lúc làm phase 01) | jsDelivr từ chối repo >50 MB: chỉ trả file đã có sẵn trong cache, còn lại 403 (vd. `cmn-ri4.mp3`). Không tin cậy cho production. |
| Vì sao không dùng `@hanzikite/pinyin-mp3` (đã đề xuất lúc hỏi) | Kiểm tra thực tế: thiếu thanh ở âm tiết thông dụng (`zai4` 在, `jing1`, `xin1`, `xiang1`, `cuo4`…) + có âm tiết rác (`diang`, `shong`, `luun`). audio-cmn đủ 4 thanh cho 423 âm tiết và có thêm ~8000 từ HSK thu giọng thật. |
| Âm tiết thiếu file / từ ví dụ không có trong HSK | Từ: rơi về TTS của máy (`speak`). Âm tiết: không xảy ra (bảng chỉ hiện âm tiết có file). |
| Ghi công CC BY-SA | Dòng nhỏ cuối tab Pinyin: "Âm thanh: audio-cmn — Chen Wang, Yue Tan (CC BY-SA 4.0)" + link repo. |
| Cách phát | `fetch()` cả file → blob → `new Audio(objectURL)` (tránh Range/206 để SW cache được). SW thêm nhánh cache-first `/audio/*` vào cache `audio-v1` (giữ qua các VERSION). File thiếu → Worker trả `index.html` 200 (SPA) → kiểm tra `content-type: audio/*`. |
| Lưu tiến độ | Không lưu. Chỉ tổng kết cuối lượt (giống Flashcard / Nghe & chọn). Lựa chọn kiểu luyện + số câu nhớ trong `localStorage` `fluency:pinyin-drill`. |
| Lối vào | Tab thứ 3 "Pinyin" (điện thoại / màn nhỏ); desktop: mục "Pinyin" trên cùng cột trái. Ẩn nút nổi "Thêm từ" khi đang ở tab Pinyin. |
| Thanh nhẹ (轻声) | Bảng âm chỉ 4 thanh. Thanh nhẹ minh hoạ bằng từ (妈妈, 爸爸, 谢谢…) trong bài Thanh điệu. |

## 3. State machine

Không có (không async lifecycle). Luyện nghe dùng lại hàng đợi `Deck` của `src/lib/flashcard.ts`
(sai → xuống cuối hàng; bấm nhanh liên tục chỉ phát âm thanh của lần bấm cuối — xem token phát trong phase 01).

## 4. Schema

Không có.

## 5. Payload / DTO

Không có API mới. Kiểu dữ liệu nội bộ xem `phase-01` (`src/lib/pinyin.ts`) và `phase-04` (`src/lib/pinyin-drill.ts`).

## 6. Phase breakdown

| Phase | File | Mục tiêu | Phụ thuộc |
|---|---|---|---|
| 01 | phase-01-pinyin-data.md | `src/lib/pinyin.ts`: âm đầu, vần, ghép chữ, dấu thanh, URL + phát âm thanh audio-cmn | — |
| 02 | phase-02-tab-and-chart.md | Tab Pinyin trong `App.tsx` + khung `PinyinView` + Bảng âm + hộp nghe 4 thanh | 01 |
| 03 | phase-03-tone-lesson.md | Bài Thanh điệu (đường cao độ, biến điệu, đặt dấu) | 02 |
| 04 | phase-04-listening-drill.md | Luyện nghe: thanh / âm đầu / vần, lượt + tổng kết | 02 |

## 7. Bài học từ lần revert

Không áp dụng (chưa có plan trước cho tính năng này).

## 8. Phạm vi (In / Out)

**In scope:**
- CREATE `src/lib/pinyin.ts`, `src/lib/pinyin-drill.ts`
- CREATE `src/components/pinyin-view.tsx`, `pinyin-chart.tsx`, `syllable-dialog.tsx`, `tone-lesson.tsx`, `pinyin-drill.tsx`
- MODIFY `src/App.tsx` (tab thứ 3, mục cột trái desktop, lazy import, ẩn FAB)
- CREATE `scripts/fetch-pinyin-audio.mjs`, `public/audio/**`; MODIFY `pwa.plugin.ts` (cache `/audio/`), `public/_headers`, `.gitattributes`

**Out of scope:**
- Gõ pinyin cho từ trong sổ / chế độ ôn tập mới trong `StudyPicker`.
- Lưu tiến độ, đồng bộ cloud, thống kê điểm yếu.
- Bảng ma trận đầy đủ 21×35 kiểu sách giáo khoa (dùng giao diện chọn âm đầu → lưới).
- Tải trước toàn bộ ~1700 file để offline sẵn (chỉ cache khi đã nghe).
- Nhận diện giọng nói / chấm phát âm.

## 9. Risks

- **Repo tăng ~7.3 MB file nhị phân** (tiền lệ: chiatien commit ~9 MB emoji). Chấp nhận.
- **Mất mạng lần đầu nghe** → toast "Không tải được âm thanh"; từ ví dụ rơi về TTS. Chấp nhận.
- **iOS chặn autoplay**: `audio.play()` chỉ gọi trong handler bấm; câu hỏi luyện nghe tự phát khi chuyển câu nằm trong chuỗi
  sự kiện bấm "Tiếp" / chọn đáp án — nếu iOS vẫn chặn thì người dùng bấm nút nghe. Kiểm thử trên iPhone ở phase 04.
- **Mẹo phát âm so với tiếng Việt chỉ là gần đúng** → ghi rõ "gần giống", nghe file thu là chuẩn.
- **Dữ liệu audio-cmn lệch tên**: `ju4` nằm ở `jv4`; ü viết `v`. Xử lý trong `audioKey()`; phase 01 có script kiểm tra mọi ô của bảng đều có file.
