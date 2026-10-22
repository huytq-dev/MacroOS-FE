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
  estimate.method === 'Cunningham'
    ? `From your weight and ${estimate.bodyFatPercent === null ? 'the body fat level you chose' : `about ${estimate.bodyFatPercent}% body fat`}, MacroOS works out your lean mass and applies the Cunningham equation (BMR ≈ ${estimate.bmrKcal} kcal), then multiplies it by your activity level.`
    : `From your sex, age, height and weight, MacroOS uses the Mifflin-St Jeor formula (BMR ≈ ${estimate.bmrKcal} kcal), then multiplies it by your activity level.`

/** Kịch bản trò chuyện giải thích TDEE: mỗi nút là một lượt bot kèm các câu trả lời gợi ý dẫn tới nút kế. */
export const buildChatNodes = (tdee: number, estimate: TdeeEstimate): Record<string, ChatNode> => ({
  start: {
    bot: [
      'Based on your answers, this is an estimate of the calories you burn each day, or the amount you need to eat to maintain your weight.',
      'It is also called your energy expenditure.',
    ],
    card: true,
    replies: [
      { label: 'Got it', next: 'understood' },
      { label: 'How do you calculate it?', next: 'how' },
    ],
  },
  understood: {
    bot: ['Understanding your expenditure is the key to managing your weight.'],
    replies: [
      { label: `So is ${tdee} kcal right?`, next: 'right' },
      { label: 'What do you mean?', next: 'why' },
    ],
  },
  how: {
    bot: [
      methodText(estimate),
      'Formulas are often off by 100–200 kcal, so MacroOS will fine-tune it using your real data.',
    ],
    replies: [{ label: 'Got it', next: 'understood' }],
  },
  why: {
    bot: ['Your expenditure decides how much you should eat to lose, maintain or gain weight.'],
    replies: [{ label: 'Got it', next: 'right' }],
  },
  right: {
    bot: [
      'That is a good starting point.',
      'The algorithm will personalise it to your metabolism as you log food and weight in the app.',
    ],
    replies: [
      { label: 'Got it', next: 'end' },
      { label: 'How does the algorithm work?', next: 'algo' },
    ],
  },
  algo: {
    bot: [
      'Each week MacroOS compares your weight trend with what you actually ate to work out your expenditure, then adjusts your kcal target.',
    ],
    replies: [{ label: 'Got it', next: 'end' }],
  },
  end: { bot: ['Basics done! Now let us set your goal.'], replies: [] },
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

/** Thời gian bot "đang gõ" tỉ lệ độ dài câu (0,7–1,8 giây); thẻ kcal hiện nhanh hơn. */
export const typingDuration = (item: ChatItem) =>
  item.kind === 'bot' ? Math.min(1800, Math.max(700, 450 + item.text.length * 16)) : 600

/** Nghỉ trước khi hiện "đang gõ": lâu hơn sau câu trả lời của người dùng, như người thật đọc xong mới gõ. */
export const pauseBefore = (items: readonly ChatItem[], index: number) =>
  index === 0 ? 400 : items[index - 1].kind === 'user' ? 800 : 500
