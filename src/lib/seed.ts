// Dữ liệu mẫu: chủ đề "Số đếm 1–10", "Gia đình" và các bài đọc tiếng Anh.
// id cố định + updatedAt = 1 → đồng bộ nhiều máy không bị nhân đôi, và mọi chỉnh sửa thật đều thắng.
// Sổ cũ cũng được bổ sung các bản ghi mẫu còn thiếu (xem init() trong store.ts).

import SEED_READINGS from './seed-readings.json'
import type { Rec } from './types'

type Row = [hanzi: string, pinyin: string, meaning: string, example: string, examplePinyin: string, exampleMeaning: string, note?: string]

const NUMBERS: Row[] = [
  ['一', 'yī', 'một', '我有一个哥哥。', 'Wǒ yǒu yí gè gēge.', 'Tôi có một người anh trai.'],
  ['二', 'èr', 'hai', '二月很冷。', 'Èr yuè hěn lěng.', 'Tháng hai rất lạnh.'],
  ['三', 'sān', 'ba', '我有三本书。', 'Wǒ yǒu sān běn shū.', 'Tôi có ba quyển sách.'],
  ['四', 'sì', 'bốn', '一年有四个季节。', 'Yì nián yǒu sì gè jìjié.', 'Một năm có bốn mùa.'],
  ['五', 'wǔ', 'năm', '我五点下班。', 'Wǒ wǔ diǎn xiàbān.', 'Tôi tan làm lúc năm giờ.'],
  ['六', 'liù', 'sáu', '他六岁了。', 'Tā liù suì le.', 'Cậu ấy sáu tuổi rồi.'],
  ['七', 'qī', 'bảy', '一个星期有七天。', 'Yí gè xīngqī yǒu qī tiān.', 'Một tuần có bảy ngày.'],
  ['八', 'bā', 'tám', '我们八点上课。', 'Wǒmen bā diǎn shàngkè.', 'Chúng tôi vào học lúc tám giờ.'],
  ['九', 'jiǔ', 'chín', '这里有九个人。', 'Zhèlǐ yǒu jiǔ gè rén.', 'Ở đây có chín người.'],
  ['十', 'shí', 'mười', '我十月去北京。', 'Wǒ shí yuè qù Běijīng.', 'Tháng mười tôi đi Bắc Kinh.'],
]

const FAMILY: Row[] = [
  ['家', 'jiā', 'nhà, gia đình', '我家有五口人。', 'Wǒ jiā yǒu wǔ kǒu rén.', 'Nhà tôi có năm người.', 'Đếm người trong nhà dùng lượng từ 口 (miệng ăn), không dùng 个.'],
  ['爸爸', 'bàba', 'bố', '我爸爸是医生。', 'Wǒ bàba shì yīshēng.', 'Bố tôi là bác sĩ.', 'Chữ thứ hai đọc thanh nhẹ.'],
  ['妈妈', 'māma', 'mẹ', '妈妈做的菜很好吃。', 'Māma zuò de cài hěn hǎochī.', 'Món mẹ nấu rất ngon.', 'Chữ thứ hai đọc thanh nhẹ.'],
  ['父母', 'fùmǔ', 'bố mẹ', '我和父母住在一起。', 'Wǒ hé fùmǔ zhù zài yìqǐ.', 'Tôi sống cùng bố mẹ.', 'Trang trọng hơn 爸爸妈妈; Hán Việt: phụ mẫu.'],
  ['哥哥', 'gēge', 'anh trai', '我哥哥比我大三岁。', 'Wǒ gēge bǐ wǒ dà sān suì.', 'Anh trai tôi lớn hơn tôi ba tuổi.'],
  ['姐姐', 'jiějie', 'chị gái', '姐姐在上海工作。', 'Jiějie zài Shànghǎi gōngzuò.', 'Chị gái tôi làm việc ở Thượng Hải.'],
  ['弟弟', 'dìdi', 'em trai', '弟弟今年十岁。', 'Dìdi jīnnián shí suì.', 'Em trai năm nay mười tuổi.'],
  ['妹妹', 'mèimei', 'em gái', '我妹妹很喜欢唱歌。', 'Wǒ mèimei hěn xǐhuan chàng gē.', 'Em gái tôi rất thích hát.'],
  ['爷爷', 'yéye', 'ông nội', '爷爷每天早上去公园。', 'Yéye měitiān zǎoshang qù gōngyuán.', 'Sáng nào ông nội cũng ra công viên.', 'Bên nội (bên bố).'],
  ['奶奶', 'nǎinai', 'bà nội', '奶奶住在农村。', 'Nǎinai zhù zài nóngcūn.', 'Bà nội sống ở nông thôn.', 'Bên nội (bên bố).'],
  ['外公', 'wàigōng', 'ông ngoại', '外公喜欢下棋。', 'Wàigōng xǐhuan xià qí.', 'Ông ngoại thích chơi cờ.', '外 = ngoài → bên ngoại (bên mẹ). Miền Bắc TQ hay gọi 姥爷 lǎoye.'],
  ['外婆', 'wàipó', 'bà ngoại', '我常常给外婆打电话。', 'Wǒ chángcháng gěi wàipó dǎ diànhuà.', 'Tôi thường gọi điện cho bà ngoại.', '外 = ngoài → bên ngoại (bên mẹ). Miền Bắc TQ hay gọi 姥姥 lǎolao.'],
  ['丈夫', 'zhàngfu', 'chồng', '她丈夫是老师。', 'Tā zhàngfu shì lǎoshī.', 'Chồng cô ấy là giáo viên.', 'Văn nói hay dùng 老公 lǎogōng.'],
  ['妻子', 'qīzi', 'vợ', '我妻子喜欢看书。', 'Wǒ qīzi xǐhuan kàn shū.', 'Vợ tôi thích đọc sách.', 'Văn nói hay dùng 老婆 lǎopo.'],
  ['孩子', 'háizi', 'con, trẻ con', '你有几个孩子？', 'Nǐ yǒu jǐ gè háizi?', 'Bạn có mấy đứa con?'],
  ['儿子', 'érzi', 'con trai', '他儿子上大学了。', 'Tā érzi shàng dàxué le.', 'Con trai anh ấy vào đại học rồi.'],
  ['女儿', 'nǚ’ér', 'con gái', '我女儿刚满一岁。', 'Wǒ nǚ’ér gāng mǎn yí suì.', 'Con gái tôi vừa tròn một tuổi.', 'Dấu ’ ngăn âm tiết: nǚ’ér, không đọc liền thành nǚer.'],
]

const TOPICS: { id: string; prefix: string; name: string; emoji: string; rows: Row[] }[] = [
  { id: 'seed-numbers', prefix: 'seed-num-', name: 'Số đếm 1–10', emoji: '🔢', rows: NUMBERS },
  { id: 'seed-family', prefix: 'seed-family-', name: 'Gia đình', emoji: '👪', rows: FAMILY },
]

// Bài đọc tiếng Anh dùng chung (module tiếng Anh). Nội dung ở seed-readings.json.
// Thứ tự trong file = thứ tự hiện (bài đầu file lên đầu danh sách); bài người dùng tự thêm (createdAt = Date.now()) luôn nằm trên.
const READINGS = SEED_READINGS.map((r, i) => ({
  id: r.id,
  kind: 'reading' as const,
  lang: 'en' as const,
  title: r.title,
  text: r.text,
  createdAt: SEED_READINGS.length - i,
  updatedAt: 1,
}))

/**
 * Bản ghi mẫu đã bỏ khỏi seed. Sổ nào còn bản chưa sửa (updatedAt <= 1) thì xóa đi (xem init() trong store.ts);
 * bản người dùng đã sửa thì giữ nguyên.
 */
export const RETIRED_SEED_IDS = ['seed-reading-1']

export function seedRecords(): Rec[] {
  return [...TOPICS.flatMap((t, ti) => [
    { id: t.id, kind: 'topic' as const, name: t.name, emoji: t.emoji, createdAt: ti + 1, updatedAt: 1 },
    ...t.rows.map(([hanzi, pinyin, meaning, example, examplePinyin, exampleMeaning, note], i) => ({
      id: `${t.prefix}${i + 1}`,
      kind: 'word' as const,
      hanzi,
      pinyin,
      meaning,
      example,
      examplePinyin,
      exampleMeaning,
      ...(note ? { note } : {}),
      topicIds: [t.id],
      createdAt: ti * 1000 + i + 1,
      updatedAt: 1,
    })),
  ]),
    ...READINGS,
  ]
}
