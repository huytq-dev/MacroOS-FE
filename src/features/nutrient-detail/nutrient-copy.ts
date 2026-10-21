import type { NutrientInfo } from './nutrient-detail.utils'
import type { GoalKind } from '@/features/nutrition/goal-progress'

/** Mô tả ngắn "About <Nutrient>" cho calo và macro (lời riêng của MacroOS). */
const ABOUT: Readonly<Record<string, string>> = {
  calories:
    'Calories are the energy you get from food and drink. Your body spends that energy all day on everything from keeping you warm to moving around. Eating more than you spend tends to add weight over time, and eating less tends to take it off, so this number sits at the heart of your plan.',
  protein:
    'Protein supplies the amino acids your body uses to build and repair muscle, skin, enzymes and many other tissues. Getting enough helps you keep muscle while you lose fat and supports recovery from training, and it tends to keep you feeling full for longer.',
  fat: 'Dietary fat gives you a dense source of energy and the raw material for hormones and cell membranes. It also helps your body absorb vitamins A, D, E and K. The type of fat matters as well as the amount, so it is worth watching the saturated and trans portions.',
  carbs:
    'Carbohydrates are your body’s main quick fuel, especially for your brain and for harder exercise. They come from grains, fruit, starchy vegetables, dairy and sugars. How many you need depends on how active you are and how you like to eat.',
}

/** Mô tả của một chất: có lời riêng cho calo / macro, các chất khác dùng một câu chung. */
export function aboutText({ nutrient }: NutrientInfo): string {
  const own = ABOUT[nutrient.key]
  if (own) return own
  return `${nutrient.name} is added up from the foods you log each day. Open a day to see your goal for it and what contributed. Detailed notes for this nutrient are coming soon.`
}

const MACRO_KEYS = new Set(['calories', 'protein', 'fat', 'carbs'])

/**
 * Một câu cho mục "About <chất>": chất này có LOẠI mục tiêu nào (theo `goalKind` của BE, lời riêng của MacroOS). Calo / macro có target
 * từ program của người dùng; các chất khác theo khuyến nghị chuẩn. Trần là giới hạn trên, không phải mốc để đạt tới. null = chưa biết loại.
 */
export function goalKindText(
  { nutrient }: NutrientInfo,
  kind: GoalKind | null | undefined
): string | null {
  const name = nutrient.name
  const source = MACRO_KEYS.has(nutrient.key)
    ? 'from your program'
    : 'from the standard daily recommendation'
  switch (kind) {
    case 'Range':
      return `${name} has a target ${source}, with a floor to stay above and a ceiling to stay below.`
    case 'Minimum':
      return `${name} has a target ${source} and a floor to stay above, but no upper limit.`
    case 'Target':
      return `${name} has a target ${source}, with no floor or ceiling.`
    case 'TargetWithCeiling':
      return `${name} has a target ${source} and an upper limit to stay below.`
    case 'Maximum':
      return `${name} only has an upper limit: it is something to keep under, not a number to reach.`
    case 'None':
      return `${name} has no goal, so its bar is left empty.`
    default:
      return null
  }
}

/** "About Nutrient Goals": phần mở đầu và ba mốc (lời riêng của MacroOS, không chép nguyên văn nơi khác). */
export const GOAL_COPY = {
  introduction:
    'A nutrient goal can include a target, a floor below it and a ceiling above it, but it does not need all three. One nutrient might only have a target, another only a ceiling. If you set your own goal for a nutrient, the descriptions below may not match it exactly.',
  floor:
    'The floor is a practical minimum to stay above. It is set near the level that covers the needs of almost everyone, so staying above it makes a shortfall unlikely.',
  target:
    'The target is the amount we suggest for your day. For calories and macros it comes from your program; for other nutrients it follows the standard daily recommendation for your profile. It is the mark the percentage is measured against.',
  ceiling:
    'The ceiling is an upper limit, not a goal to reach: the highest daily amount that is very unlikely to cause problems (the tolerable upper intake level). Going over it now and then is not a problem, but staying above it for a long time raises the chance of unwanted effects.',
} as const
