# Ôn tập: Nghe & chọn, tách chữ, Flashcard ở mọi danh sách

Ngày: 2026-11-20. Nối tiếp `2026-11-20-flashcard-design.md`.

## Nút "Ôn tập"

- Thay nút Flashcard; có ở cả chủ đề lẫn "Tất cả từ". Điện thoại chỉ hiện icon cho cả 3 nút cạnh ô tìm kiếm.
- Mở `StudyPicker`: chế độ **Flashcard** / **Nghe & chọn**, số thẻ **10 / 20 / Tất cả** (chỉ hiện mốc nhỏ hơn tổng; chọn mốc → lấy ngẫu nhiên).
  Lưu `localStorage` `fluency:study` = `{ mode, count }`.
- Nghe & chọn bị khóa khi trình duyệt không có Web Speech hoặc cả sổ < 2 từ.

## Nghe & chọn (`listening-quiz.tsx`)

- Mỗi câu: tự đọc chữ Hán (chờ 250ms sau khi hiện), nút nghe lại to + nút đọc chậm (rate 0.5).
- 4 đáp án (`pickOptions` trong `src/lib/quiz.ts`): nhiễu lấy trong lượt trước, thiếu thì lấy cả sổ, bỏ đáp án hiện trùng nhau.
- Đáp án là chữ Hán (mặc định) hoặc nghĩa — `fluency:quiz-show`, chỉ đổi được trước khi chọn.
- Chọn sai: tô đỏ lựa chọn, tô xanh đáp án đúng, đọc lại; từ đó xuống cuối lượt (dùng chung `answer` của flashcard).
- Phím: 1–4 chọn, Space nghe lại, Enter tiếp.
- Tổng kết dùng chung `study-summary.tsx` với Flashcard.

## Tách chữ (thẻ từ mở rộng)

- Mỗi chữ Hán trong từ + pinyin theo ngữ cảnh cả từ (`charPinyins`), kèm tối đa 6 từ khác trong sổ chứa chữ đó (bấm để nghe).
- Từ một chữ chưa có từ liên quan → ẩn phần này.
- `charIndex` (chữ → từ) tính một lần trong `App.tsx`.

## Không đổi

Dữ liệu `Word`/`Topic`, đồng bộ: không đổi. Kết quả ôn không lưu.
