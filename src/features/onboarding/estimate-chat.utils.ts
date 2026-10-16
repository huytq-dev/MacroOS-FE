import type { TdeeEstimate } from './types/onboarding.types'

export interface ChatReply {
  readonly label: string
  readonly next: string
}

export interface ChatNode {
  readonly bot: readonly string[]
  readonly card?: boolean
  readonly replies: readonly ChatReply[]
}

export type ChatItem =
  | { readonly kind: 'bot'; readonly text: string }
  | { readonly kind: 'user'; readonly text: string }
  | { readonly kind: 'card' }

const methodText = (estimate: TdeeEstimate) =>
  estimate.method === 'KatchMcArdle'
    ? `Từ cân nặng và tỉ lệ mỡ bạn chọn, MacroOS tính khối lượng nạc rồi dùng công thức Katch-McArdle (BMR ≈ ${estimate.bmrKcal} kcal), nhân với mức vận động của bạn.`
    : `Từ giới tính, tuổi, chiều cao và cân nặng, MacroOS dùng công thức Mifflin-St Jeor (BMR ≈ ${estimate.bmrKcal} kcal), nhân với mức vận động của bạn.`

/** Kịch bản trò chuyện giải thích TDEE: mỗi nút là một lượt bot kèm các câu trả lời gợi ý dẫn tới nút kế. */
export const buildChatNodes = (tdee: number, estimate: TdeeEstimate): Record<string, ChatNode> => ({
  start: {
    bot: [
      'Dựa trên câu trả lời của bạn, đây là ước tính lượng calo bạn đốt mỗi ngày, hay lượng bạn cần ăn để giữ cân.',
      'Còn gọi là mức tiêu hao năng lượng (expenditure).',
    ],
    card: true,
    replies: [
      { label: 'Đã hiểu', next: 'understood' },
      { label: 'Bạn tính thế nào?', next: 'how' },
    ],
  },
  understood: {
    bot: ['Hiểu rõ mức tiêu hao là chìa khóa để quản lý cân nặng.'],
    replies: [
      { label: `Vậy ${tdee} kcal có đúng không?`, next: 'right' },
      { label: 'Là sao?', next: 'why' },
    ],
  },
  how: {
    bot: [
      methodText(estimate),
      'Công thức thường lệch 100–200 kcal, nên MacroOS sẽ tinh chỉnh theo dữ liệu thật của bạn.',
    ],
    replies: [{ label: 'Đã hiểu', next: 'understood' }],
  },
  why: {
    bot: ['Mức tiêu hao quyết định bạn nên ăn bao nhiêu để giảm, giữ hay tăng cân.'],
    replies: [{ label: 'Đã hiểu', next: 'right' }],
  },
  right: {
    bot: [
      'Đó là điểm khởi đầu tốt.',
      'Thuật toán sẽ cá nhân hoá theo trao đổi chất của bạn khi bạn ghi món ăn và cân nặng trong app.',
    ],
    replies: [
      { label: 'Đã hiểu', next: 'end' },
      { label: 'Thuật toán hoạt động ra sao?', next: 'algo' },
    ],
  },
  algo: {
    bot: [
      'Mỗi tuần MacroOS so xu hướng cân nặng với lượng ăn thực tế để suy ngược mức tiêu hao, rồi chỉnh mục tiêu kcal cho bạn.',
    ],
    replies: [{ label: 'Đã hiểu', next: 'end' }],
  },
  end: { bot: ['Xong phần cơ bản! Giờ mình đặt mục tiêu nhé.'], replies: [] },
})

/** Trải đường đi (các nút đã qua + câu trả lời đã chọn) thành danh sách bong bóng theo thứ tự hiển thị. */
export function buildChatItems(
  nodes: Record<string, ChatNode>,
  path: readonly string[],
  replies: readonly string[]
): ChatItem[] {
  return path.flatMap((id, index): ChatItem[] => {
    const node = nodes[id]
    const bots = node.bot.map((text): ChatItem => ({ kind: 'bot', text }))
    const withCard = node.card ? [bots[0], { kind: 'card' } as ChatItem, ...bots.slice(1)] : bots
    const reply = replies[index]
    return reply ? [...withCard, { kind: 'user', text: reply }] : withCard
  })
}
