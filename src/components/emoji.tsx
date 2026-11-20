import { useState } from 'react'
import { cn } from '@/lib/utils'

// Emoji bộ Google Noto (ảnh SVG từ repo googlefonts/noto-emoji qua jsDelivr) để mọi máy hiện giống nhau.
// Ảnh lỗi (emoji không có trong bộ, mất mạng chưa cache) thì hiện ký tự Unicode của hệ điều hành.

const NOTO = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.047/svg/emoji_u'

/** Tên file Noto: mã các codepoint dạng hex nối bằng "_", bỏ ký tự chọn kiểu FE0F. */
function notoSrc(char: string) {
  const codes = Array.from(char)
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16).padStart(4, '0'))
  return codes.length ? `${NOTO}${codes.join('_')}.svg` : ''
}

interface Props {
  char?: string
  /** Đứng một mình (không có chữ đi kèm) → đọc được bằng trình đọc màn hình. */
  label?: string
  className?: string
}

/** Cỡ mặc định 1em, theo cỡ chữ xung quanh (đổi bằng `size-*`). */
export function Emoji({ char, label, className }: Props) {
  const [failed, setFailed] = useState<string>()
  if (!char) return null
  const src = notoSrc(char)
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true }

  if (!src || failed === char) {
    return (
      <span className={cn('inline-block leading-none', className)} {...a11y}>
        {char}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={label ?? char}
      {...(!label && { 'aria-hidden': true })}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(char)}
      className={cn('pointer-events-none inline-block size-[1em] shrink-0 select-none object-contain align-[-0.125em]', className)}
    />
  )
}
