# 字 Fluency

Sổ từ vựng tiếng Trung cá nhân (PWA). Mở là dùng, không cần đăng nhập, đồng bộ cloud.

- Từ vựng: chữ Hán, pinyin (tự sinh bằng `pinyin-pro`, sửa tay được), nghĩa tiếng Việt, câu ví dụ + pinyin + nghĩa.
- Đọc to bằng Web Speech API (giọng zh-CN của hệ điều hành).
- Nhóm theo chủ đề (một từ có thể thuộc nhiều chủ đề). Sổ mới có sẵn chủ đề "Số đếm 1–10".
- Tìm theo chữ Hán / pinyin không dấu / nghĩa; chế độ "Ẩn nghĩa" để tự kiểm tra.
- Âm Hán Việt theo pinyin (dữ liệu [hanviet-pinyin-words](https://github.com/ph0ngp/hanviet-pinyin-words), MIT; sinh lại bằng `scripts/gen-hanviet.mjs`).
- Offline-first: dữ liệu nằm trong IndexedDB, đồng bộ nền lên Durable Object.

## Kiến trúc

| Phần | Công nghệ |
| --- | --- |
| Giao diện | React + Vite + TS + Tailwind v4 + shadcn (lấy từ chiatien) |
| Lưu trên máy | IndexedDB (`idb-keyval`), `src/lib/store.ts` |
| Đồng bộ | `POST /api/lib/:key/sync`, last-write-wins theo `updatedAt`, xóa mềm (`shared/sync.ts`) |
| Server | Cloudflare Worker + 1 Durable Object SQLite cho mỗi sổ (`worker/index.ts`) |

**Khóa sổ**: lần đầu mở app sinh một khóa ngẫu nhiên (lưu ở localStorage). Mở sổ trên máy khác bằng link
`https://<domain>/#k=<khóa>` (có QR trong màn Đồng bộ). Ai có link thì vào được sổ.

## Chạy

```bash
npm install
npm run dev       # http://localhost:5173 (frontend + Worker + DO chạy local, dữ liệu ở .wrangler/)
npm run deploy    # build + deploy lên Cloudflare (https://fluency.cangao.asia)
```

Deploy dùng tài khoản Cloudflare của chiatien: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` trong `.env`
(không commit; wrangler tự đọc, ưu tiên hơn `wrangler login`).
