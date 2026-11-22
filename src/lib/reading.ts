// Tách bài đọc thành đoạn → câu để đọc lần lượt và tô sáng.

export interface Sentence {
  /** Thứ tự câu trong cả bài. */
  index: number
  /** Đoạn văn chứa câu. */
  para: number
  text: string
}

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'sentence' }) : null

function sentencesOf(paragraph: string): string[] {
  const parts = segmenter
    ? Array.from(segmenter.segment(paragraph), (s) => s.segment)
    : (paragraph.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)\s*/g) ?? [paragraph])
  const out: string[] = []
  for (const raw of parts) {
    const s = raw.replace(/\s+/g, ' ').trim()
    if (!s) continue
    const prev = out[out.length - 1]
    // Gộp lại khi bị cắt sai: sau từ viết tắt ("Dr. Smith"), hoặc câu sau bắt đầu bằng chữ thường
    // ("Are you ready?" she asked.).
    if (prev && (ABBREV.test(prev) || /^["“'‘(]?[a-z]/.test(s))) out[out.length - 1] = `${prev} ${s}`
    else out.push(s)
  }
  return out
}

const ABBREV = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Mt|vs|etc|e\.g|i\.e|No|Fig|approx|Inc|Ltd|Co)\.$/i

export function splitReading(text: string): Sentence[] {
  const out: Sentence[] = []
  const paragraphs = text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  paragraphs.forEach((p, para) => {
    for (const s of sentencesOf(p)) out.push({ index: out.length, para, text: s })
  })
  return out
}

export function wordCount(text: string) {
  return text.match(/[A-Za-z0-9’']+/g)?.length ?? 0
}

/** Tiêu đề mặc định: câu đầu tiên, cắt ngắn. */
export function defaultTitle(text: string) {
  const first = splitReading(text)[0]?.text ?? ''
  return first.length > 60 ? `${first.slice(0, 57).trimEnd()}…` : first
}

/** Câu đang đọc dở của từng bài, lưu theo máy. */
const POS_KEY = (id: string) => `fluency:reading-pos:${id}`

export function loadPosition(id: string) {
  try {
    return Number(localStorage.getItem(POS_KEY(id))) || 0
  } catch {
    return 0
  }
}

export function savePosition(id: string, index: number) {
  try {
    localStorage.setItem(POS_KEY(id), String(index))
  } catch {}
}
