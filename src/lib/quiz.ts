// Trắc nghiệm "Nghe & chọn": sinh đáp án nhiễu cho một câu hỏi.

import { shuffle } from './flashcard'
import type { Word } from './types'

export type QuizShow = 'hanzi' | 'meaning'

export const optionLabel = (w: Word, show: QuizShow) => (show === 'hanzi' ? w.hanzi : w.meaning).trim()

/**
 * Đáp án đúng + tối đa n−1 đáp án nhiễu, xáo trộn. Nhiễu lấy trong lượt trước, thiếu thì lấy cả sổ.
 * Bỏ các từ hiện giống hệt nhau (trùng chữ / trùng nghĩa) để không có hai lựa chọn y chang.
 */
export function pickOptions(answer: Word, session: readonly Word[], pool: readonly Word[], show: QuizShow, n = 4): Word[] {
  const seen = new Set([optionLabel(answer, show)])
  const others: Word[] = []
  for (const list of [shuffle(session), shuffle(pool)]) {
    for (const w of list) {
      if (others.length >= n - 1) break
      const label = optionLabel(w, show)
      if (!label || seen.has(label)) continue
      seen.add(label)
      others.push(w)
    }
  }
  return shuffle([answer, ...others])
}
