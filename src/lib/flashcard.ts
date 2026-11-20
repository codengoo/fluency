// Hàng đợi một lượt flashcard: thẻ "Chưa nhớ" xuống cuối hàng, hết hàng là xong lượt.

export interface Deck {
  /** id các từ còn phải học, phần tử đầu là thẻ đang hiện. */
  queue: string[]
  total: number
  /** id các từ đã từng bấm "Chưa nhớ" trong lượt này. */
  missed: string[]
}

export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function startDeck(ids: readonly string[]): Deck {
  return { queue: shuffle(ids), total: ids.length, missed: [] }
}

export function answer(deck: Deck, remembered: boolean): Deck {
  const [head, ...rest] = deck.queue
  if (head === undefined) return deck
  if (remembered) return { ...deck, queue: rest }
  return {
    ...deck,
    queue: [...rest, head],
    missed: deck.missed.includes(head) ? deck.missed : [...deck.missed, head],
  }
}

export const isDone = (deck: Deck) => deck.queue.length === 0
