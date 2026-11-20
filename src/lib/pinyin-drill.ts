// Luyện nghe pinyin: sinh câu hỏi nghe âm tiết → chọn thanh / âm đầu / vần trong các nhóm dễ nhầm.

import { shuffle } from './flashcard'
import { INITIALS, syllablesOf, TONES, toneMark, type Tone } from './pinyin'

export type DrillKind = 'tone' | 'initial' | 'final'
export type DrillMode = DrillKind | 'mix'

export interface DrillOption {
  syllable: string
  tone: Tone
  label: string
}

export interface Question {
  id: string
  kind: DrillKind
  syllable: string
  tone: Tone
  options: DrillOption[]
}

// Nhóm âm đầu / vần người Việt hay nghe nhầm.
export const INITIAL_SETS = [
  ['b', 'p'], ['d', 't'], ['g', 'k'], ['j', 'q', 'x'], ['zh', 'ch', 'sh'], ['z', 'c', 's'],
  ['zh', 'z', 'j'], ['ch', 'c', 'q'], ['sh', 's', 'x'], ['n', 'l'], ['f', 'h'], ['r', 'l'],
]
export const FINAL_SETS = [
  ['an', 'ang'], ['en', 'eng'], ['in', 'ing'], ['ian', 'iang'], ['uan', 'uang'], ['u', 'ü'],
  ['ie', 'üe'], ['ou', 'uo'], ['ai', 'ei'], ['ong', 'eng'],
]

const cellsOf = new Map(INITIALS.map((i) => [i.id, syllablesOf(i.id)]))
/** Chữ viết của âm đầu + vần nếu ghép được, không thì undefined. */
const cell = (initial: string, final: string) => cellsOf.get(initial)?.find((c) => c.final.id === final)?.syllable

const ALL = [...new Set([...cellsOf.values()].flatMap((cells) => cells.map((c) => c.syllable)))]

const groupsOf = (lists: (string | undefined)[][]) =>
  lists.map((l) => [...new Set(l.filter((s): s is string => Boolean(s)))]).filter((l) => l.length >= 2)

const FINAL_IDS = [...new Set([...cellsOf.values()].flatMap((cells) => cells.map((c) => c.final.id)))]

// Mỗi nhóm = các âm tiết chỉ khác nhau ở âm đầu (cùng vần) hoặc ở vần (cùng âm đầu).
const INITIAL_GROUPS = groupsOf(INITIAL_SETS.flatMap((set) => FINAL_IDS.map((f) => set.map((i) => cell(i, f)))))
const FINAL_GROUPS = groupsOf(FINAL_SETS.flatMap((set) => INITIALS.map((i) => set.map((f) => cell(i.id, f)))))

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]
const option = (syllable: string, tone: Tone): DrillOption => ({ syllable, tone, label: toneMark(syllable, tone) })

function makeOne(kind: DrillKind): Omit<Question, 'id'> {
  const tone = pick(TONES)
  if (kind === 'tone') {
    const syllable = pick(ALL)
    // Giữ thứ tự thanh 1→4 để phím 1–4 trùng số thanh.
    return { kind, syllable, tone, options: TONES.map((t) => option(syllable, t)) }
  }
  const group = pick(kind === 'initial' ? INITIAL_GROUPS : FINAL_GROUPS)
  return { kind, syllable: pick(group), tone, options: shuffle(group.map((s) => option(s, tone))) }
}

export function makeQuestions(mode: DrillMode, n: number): Question[] {
  const kinds: DrillKind[] = ['tone', 'initial', 'final']
  const seen = new Set<string>()
  const out: Question[] = []
  for (let tries = 0; out.length < n && tries < n * 50; tries++) {
    const q = makeOne(mode === 'mix' ? pick(kinds) : mode)
    const key = q.syllable + q.tone
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...q, id: `q${out.length}` })
  }
  return out
}

export const isAnswer = (q: Question, o: DrillOption) => o.syllable === q.syllable && o.tone === q.tone
