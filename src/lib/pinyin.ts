// Hệ thống pinyin: âm đầu, vần, quy tắc ghép chữ, dấu thanh + âm thanh thu sẵn.
//
// Âm thanh: audio-cmn (https://github.com/hugolpz/audio-cmn, CC BY-SA — âm tiết: Chen Wang, từ HSK: Yue Tan),
// tự host trong public/audio (scripts/fetch-pinyin-audio.mjs); service worker cache lại khi đã nghe (cache `audio-…`).

import { speak } from './chinese'

export type Tone = 1 | 2 | 3 | 4
export const TONES: readonly Tone[] = [1, 2, 3, 4]

export interface Initial {
  /** '' = không có âm đầu. */
  id: string
  group: string
  tip: string
}

export interface Final {
  /** Dạng gốc trong bảng vần (iou, uei, uen, ü…), chưa áp quy tắc viết. */
  id: string
  row: 'a' | 'i' | 'u' | 'ü'
  tip: string
}

// Mẹo so với tiếng Việt chỉ là gần đúng – nghe file thu âm là chuẩn.
export const INITIALS: readonly Initial[] = [
  { id: 'b', group: 'Môi', tip: 'Không bật hơi, không rung dây thanh – nằm giữa "b" và "p" tiếng Việt.' },
  { id: 'p', group: 'Môi', tip: 'Như b nhưng bật hơi mạnh (để tờ giấy trước miệng sẽ thấy rung).' },
  { id: 'm', group: 'Môi', tip: 'Như "m" tiếng Việt.' },
  { id: 'f', group: 'Môi', tip: 'Như "ph" tiếng Việt.' },
  { id: 'd', group: 'Đầu lưỡi', tip: 'Không bật hơi – gần "t" tiếng Việt.' },
  { id: 't', group: 'Đầu lưỡi', tip: 'Bật hơi – gần "th" tiếng Việt.' },
  { id: 'n', group: 'Đầu lưỡi', tip: 'Như "n" tiếng Việt.' },
  { id: 'l', group: 'Đầu lưỡi', tip: 'Như "l" tiếng Việt.' },
  { id: 'g', group: 'Cuống lưỡi', tip: 'Không bật hơi – gần "c/k" tiếng Việt.' },
  { id: 'k', group: 'Cuống lưỡi', tip: '"k" bật hơi mạnh (khác "kh" tiếng Việt: k tắc rồi bật hơi, không cọ xát).' },
  { id: 'h', group: 'Cuống lưỡi', tip: 'Hơi cọ ở cuống lưỡi – nằm giữa "h" và "kh" tiếng Việt.' },
  { id: 'j', group: 'Mặt lưỡi', tip: 'Không bật hơi, mặt lưỡi áp lợi trên – gần "ch" tiếng Việt (chi).' },
  { id: 'q', group: 'Mặt lưỡi', tip: 'Như j nhưng bật hơi mạnh.' },
  { id: 'x', group: 'Mặt lưỡi', tip: 'Gần "x" tiếng Việt, mặt lưỡi nâng cao, môi dẹt.' },
  { id: 'zh', group: 'Uốn lưỡi', tip: 'Cong đầu lưỡi lên vòm, không bật hơi – gần "tr" tiếng Việt đọc cong lưỡi.' },
  { id: 'ch', group: 'Uốn lưỡi', tip: 'Như zh nhưng bật hơi mạnh.' },
  { id: 'sh', group: 'Uốn lưỡi', tip: 'Cong lưỡi – gần "s" tiếng Việt đọc cong lưỡi.' },
  { id: 'r', group: 'Uốn lưỡi', tip: 'Cong lưỡi như sh nhưng rung dây thanh; không rung đầu lưỡi như "r" tiếng Việt.' },
  { id: 'z', group: 'Đầu lưỡi trước', tip: 'Đầu lưỡi chạm sau răng trên, không bật hơi – như "ts" nhẹ.' },
  { id: 'c', group: 'Đầu lưỡi trước', tip: 'Như z nhưng bật hơi mạnh ("ts" + hơi).' },
  { id: 's', group: 'Đầu lưỡi trước', tip: 'Gần "x" tiếng Việt (đầu lưỡi sau răng trên).' },
  { id: '', group: 'Không âm đầu', tip: 'Vần đứng một mình; i / u / ü đứng đầu thì viết thành y / w / yu.' },
]

export const FINALS: readonly Final[] = [
  { id: 'a', row: 'a', tip: 'Như "a".' },
  { id: 'o', row: 'a', tip: 'Gần "ô" lướt sang "ua" (bo ≈ "bua").' },
  { id: 'e', row: 'a', tip: 'Gần "ưa" / "ơ" – miệng hơi mở, môi không tròn.' },
  { id: 'er', row: 'a', tip: '"ơ" rồi cong lưỡi.' },
  { id: 'ai', row: 'a', tip: 'Như "ai".' },
  { id: 'ei', row: 'a', tip: 'Như "ây".' },
  { id: 'ao', row: 'a', tip: 'Như "ao".' },
  { id: 'ou', row: 'a', tip: 'Như "âu".' },
  { id: 'an', row: 'a', tip: 'Như "an".' },
  { id: 'en', row: 'a', tip: 'Như "ân".' },
  { id: 'ang', row: 'a', tip: 'Như "ang".' },
  { id: 'eng', row: 'a', tip: 'Như "âng".' },
  { id: 'ong', row: 'a', tip: 'Gần "ung".' },
  { id: 'i', row: 'i', tip: 'Như "i". Sau z c s zh ch sh r đọc gần "ư".' },
  { id: 'ia', row: 'i', tip: 'Như "ia" (ya).' },
  { id: 'ie', row: 'i', tip: 'Như "iê".' },
  { id: 'iao', row: 'i', tip: 'Như "iao".' },
  { id: 'iou', row: 'i', tip: 'Gần "iêu"; có âm đầu thì viết iu (liu).' },
  { id: 'ian', row: 'i', tip: 'Đọc "iên", không phải "ian".' },
  { id: 'in', row: 'i', tip: 'Như "in".' },
  { id: 'iang', row: 'i', tip: 'Như "iang".' },
  { id: 'ing', row: 'i', tip: 'Như "inh".' },
  { id: 'iong', row: 'i', tip: 'Gần "iung".' },
  { id: 'u', row: 'u', tip: 'Như "u".' },
  { id: 'ua', row: 'u', tip: 'Như "oa".' },
  { id: 'uo', row: 'u', tip: 'Như "uô".' },
  { id: 'uai', row: 'u', tip: 'Như "oai".' },
  { id: 'uei', row: 'u', tip: 'Gần "uây"; có âm đầu thì viết ui (gui).' },
  { id: 'uan', row: 'u', tip: 'Như "oan".' },
  { id: 'uen', row: 'u', tip: 'Gần "uân"; có âm đầu thì viết un (lun).' },
  { id: 'uang', row: 'u', tip: 'Như "oang".' },
  { id: 'ueng', row: 'u', tip: 'Gần "uâng"; chỉ có weng.' },
  { id: 'ü', row: 'ü', tip: 'Tròn môi như "u" nhưng lưỡi đọc "i" (gần "uy"). Sau j q x y viết u.' },
  { id: 'üe', row: 'ü', tip: 'Gần "uyê".' },
  { id: 'üan', row: 'ü', tip: 'Gần "uyên".' },
  { id: 'ün', row: 'ü', tip: 'Gần "uyn".' },
]

// Không âm đầu: vần hàng i / u / ü viết lại với y / w.
const ZERO: Record<string, string> = {
  i: 'yi', ia: 'ya', ie: 'ye', iao: 'yao', iou: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', uei: 'wei', uan: 'wan', uen: 'wen', uang: 'wang', ueng: 'weng',
  ü: 'yu', üe: 'yue', üan: 'yuan', ün: 'yun',
}
const SHORT: Record<string, string> = { iou: 'iu', uei: 'ui', uen: 'un' }

/** Chữ viết pinyin (không dấu) của âm đầu + vần, vd. ('j','üan') → 'juan', ('','iou') → 'you', ('l','ü') → 'lü'. */
export function spell(initial: string, final: string) {
  if (!initial) return ZERO[final] ?? final
  const f = SHORT[final] ?? final
  return initial + (/^[jqx]$/.test(initial) ? f.replace('ü', 'u') : f)
}

// Âm tiết có file thu trong public/audio/syllables (bỏ âm tiết hiếm / phương ngữ: cei, fe, fiao, kei, rua, tei, yai…).
// ü viết v như tên file (lv, nve).
const RECORDED = new Set(
  (
    'a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu ca cai can cang cao ce cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo ' +
    'da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo e ei en eng er fa fan fang fei fen feng fo fou fu ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ' +
    'ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo ' +
    'la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lv lve ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu ' +
    'na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nun nuo nv nve o ou pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu ' +
    'qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun ran rang rao re ren reng ri rong rou ru ruan rui run ruo sa sai san sang sao se sen seng sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo ' +
    'ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo wa wai wan wang wei wen weng wo wu xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun ya yan yang yao ye yi yin ying yong you yu yuan yue yun ' +
    'za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo'
  ).split(' '),
)

const fileKey = (syllable: string) => syllable.replace('ü', 'v')

/** Âm tiết (chữ viết, ü giữ nguyên) có trong bảng / có file thu âm không. */
export const isSyllable = (syllable: string) => RECORDED.has(fileKey(syllable))

/** Ô của bảng âm: mỗi vần ghép được với âm đầu này. */
export function syllablesOf(initial: string) {
  // j q x chỉ ghép với vần ü (viết u): ju là jü, không phải j + u.
  const jqx = /^[jqx]$/.test(initial)
  return FINALS.filter((f) => !(jqx && f.row === 'u'))
    .map((f) => ({ final: f, syllable: spell(initial, f.id) }))
    .filter((c) => isSyllable(c.syllable))
}

const MARKS: Record<string, string> = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' }

/** Đặt dấu thanh: ưu tiên a/e, rồi o trong "ou", còn lại nguyên âm cuối (liù, guì). */
export function toneMark(syllable: string, tone: Tone) {
  let i = syllable.search(/[ae]/)
  if (i < 0) i = syllable.indexOf('ou')
  if (i < 0) i = Math.max(...['i', 'o', 'u', 'ü'].map((v) => syllable.lastIndexOf(v)))
  if (i < 0) return syllable
  return syllable.slice(0, i) + MARKS[syllable[i]][tone - 1] + syllable.slice(i + 1)
}

// ───────────── Âm thanh ─────────────

export const syllableUrl = (syllable: string, tone: Tone) => `/audio/syllables/${fileKey(syllable)}${tone}.mp3`

/** File thu của từ ví dụ (chỉ các từ trong bài Thanh điệu, xem scripts/fetch-pinyin-audio.mjs). */
export const wordUrl = (word: string) => `/audio/words/${encodeURIComponent(word)}.mp3`

export class AudioError extends Error {
  constructor() {
    super('Không tải được âm thanh (mất mạng?)')
  }
}

const blobs = new Map<string, Promise<string>>()

function load(url: string) {
  let p = blobs.get(url)
  if (!p) {
    p = fetch(url)
      .then((res) => {
        // File không có thì Worker trả index.html (SPA) với 200 → kiểm tra cả loại nội dung.
        if (!res.ok || !res.headers.get('content-type')?.startsWith('audio/')) throw new AudioError()
        return res.blob()
      })
      .then((b) => URL.createObjectURL(b), () => Promise.reject(new AudioError()))
    // Lỗi thì không nhớ, để lần sau (có mạng lại) thử tiếp.
    p.catch(() => blobs.delete(url))
    blobs.set(url, p)
  }
  return p
}

let current: HTMLAudioElement | null = null
let token = 0

/** Phát một file; bấm liên tục thì chỉ lần bấm cuối được phát. */
export async function playUrl(url: string) {
  const mine = ++token
  const src = await load(url)
  if (mine !== token) return
  current?.pause()
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  current = new Audio(src)
  await current.play()
}

export const playSyllable = (syllable: string, tone: Tone) => playUrl(syllableUrl(syllable, tone))

/** Phát từ bằng file thu HSK; không có file / mất mạng thì đọc bằng giọng máy. */
export async function playWord(word: string) {
  try {
    await playUrl(wordUrl(word))
  } catch {
    token++
    current?.pause()
    speak(word)
  }
}
