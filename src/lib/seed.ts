// Dữ liệu mẫu cho sổ mới: chủ đề "Số đếm 1–10".
// id cố định + updatedAt = 1 → đồng bộ nhiều máy không bị nhân đôi, và mọi chỉnh sửa thật đều thắng.

import type { Rec } from './types'

const TOPIC_ID = 'seed-numbers'

const NUMBERS: [string, string, string, string, string, string][] = [
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

export function seedRecords(): Rec[] {
  return [
    { id: TOPIC_ID, kind: 'topic', name: 'Số đếm 1–10', emoji: '🔢', createdAt: 1, updatedAt: 1 },
    ...NUMBERS.map(([hanzi, pinyin, meaning, example, examplePinyin, exampleMeaning], i) => ({
      id: `seed-num-${i + 1}`,
      kind: 'word' as const,
      hanzi,
      pinyin,
      meaning,
      example,
      examplePinyin,
      exampleMeaning,
      topicIds: [TOPIC_ID],
      createdAt: i + 1,
      updatedAt: 1,
    })),
  ]
}
