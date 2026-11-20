# Flashcard trong chủ đề

Ngày: 2026-11-20

## Mục tiêu

Học thuộc từ của một chủ đề bằng thẻ lật: nhìn mặt trước, lật, tự đánh giá **Nhớ rồi / Chưa nhớ**.
Không lưu tiến độ lâu dài (không đổi dữ liệu, không đồng bộ).

## Phạm vi

- Nút **Flashcard** cạnh nút Luyện viết, chỉ hiện khi đang trong một chủ đề.
- Một lượt = các từ đang hiện của chủ đề (có tính ô tìm kiếm), chốt lúc mở. Không có từ → nút bị vô hiệu.
- Thứ tự xáo trộn mỗi lượt.

## Luồng

1. Thanh tiến độ `đã nhớ / tổng`.
2. Mặt trước: chữ Hán (mặc định) hoặc nghĩa tiếng Việt — công tắc trong hộp thoại, lưu `localStorage`
   `fluency:flashcard-front` (`hanzi` | `meaning`), đọc/ghi bọc try/catch.
3. Bấm thẻ hoặc Space/Enter để lật (hiệu ứng lật 3D). Mặt sau: chữ Hán, pinyin, nghĩa, câu ví dụ + pinyin + nghĩa,
   nút đọc to.
4. Sau khi lật mới bấm được **Chưa nhớ** (phím ←) / **Nhớ rồi** (phím →).
   Chưa nhớ → thẻ xuống cuối hàng đợi. Hết hàng đợi → tổng kết.
5. Tổng kết: số từ nhớ ngay lần đầu, danh sách từ phải ôn lại.
   Nút **Học lại** (xáo lại tất cả) và **Ôn từ chưa nhớ** (chỉ các từ từng chưa nhớ; ẩn nếu không có).

## Code

- `src/lib/flashcard.ts`: hàm thuần cho hàng đợi (`startDeck`, `answer`), `shuffle`.
- `src/components/flashcard.tsx`: default export, dùng `ResponsiveDialog`, tải `lazy` trong `App.tsx` như `WritingPractice`.
- Không đổi `types.ts`, `store.ts`, đồng bộ.

## Kiểm tra

Chưa có test runner → `npm run build` (tsc + vite) và thử thật bằng trình duyệt ở cỡ điện thoại và desktop.
