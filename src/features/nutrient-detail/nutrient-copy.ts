import type { NutrientInfo } from './nutrient-detail.utils'

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

/** "About Nutrient Goals": phần mở đầu và ba mốc (lời riêng của MacroOS, không chép nguyên văn nơi khác). */
export const GOAL_COPY = {
  introduction:
    'A nutrient goal can include a target, a floor below it and a ceiling above it, but it does not need all three. One nutrient might only have a target, another only a ceiling. If you set your own goal for a nutrient, the descriptions below may not match it exactly.',
  floor:
    'The floor is the lowest daily amount worth aiming for. It is set near the level that covers the needs of most people, so staying above it makes a shortfall unlikely.',
  target:
    'The target is the amount we suggest for your day. For calories and macros it comes from your strategy; for other nutrients it follows the standard daily recommendation for your profile.',
  ceiling:
    'The ceiling is the highest daily amount worth allowing. Going over it now and then is not a problem, but staying above it for a long time raises the chance of unwanted effects.',
} as const
