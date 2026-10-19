/**
 * Bộ icon món ăn (529 icon: 300 gốc CC BY 4.0 từ foodiconpack.com đã tô màu + 229 icon bổ sung, một phần dựng từ Noto Emoji Apache 2.0; xem `public/food-icons/v1/ATTRIBUTION_AND_LICENSE.txt`): file tĩnh ở `public/food-icons/<phiên bản>/`. BE chỉ lưu
 * khoá (`iconKey`, snake_case như `apple`); FE ghép URL. Đổi bộ icon thì tăng `FOOD_ICON_VERSION` để bỏ cache cũ (file được cache
 * immutable một năm, xem next.config.ts).
 */
export const FOOD_ICON_VERSION = 'v1'

/** 128 px cho danh sách và lưới chọn (hiện ≤ 56 px, đủ nét màn 2x); 256 px cho chỗ hiện lớn. */
export type FoodIconSize = 128 | 256

export const foodIconUrl = (iconKey: string, size: FoodIconSize = 128) =>
  `/food-icons/${FOOD_ICON_VERSION}/${size}/${iconKey}.webp`

export const FOOD_ICON_CATALOG_URL = `/food-icons/${FOOD_ICON_VERSION}/icons.json`

export interface FoodIconDef {
  readonly key: string
  readonly name: string
  readonly category: string
}

/** Các tab của bảng "Choose Icon" (sau tab All): chín tab của MacroFactor rồi các nhóm riêng của bộ icon mở rộng. */
export const FOOD_ICON_TABS = [
  'Baked Goods',
  'Meats',
  'Vegetables',
  'Seafood',
  'Fruit',
  'Nuts and Seeds',
  'Dairy and Eggs',
  'Drinks',
  'Sweets',
  'Meals',
  'Snacks',
  'Grains and Legumes',
  'Pantry',
  'Supplements',
  'Other',
] as const
export type FoodIconTab = (typeof FOOD_ICON_TABS)[number]

// Nhóm `category` của icons.json → tab. Nhóm "Extra Foods" gom lẫn nhiều loại nên chia theo khoá ở EXTRA_TAB.
const CATEGORY_TAB: Readonly<Record<string, FoodIconTab>> = {
  'Baked Goods': 'Baked Goods',
  Meats: 'Meats',
  Vegetables: 'Vegetables',
  Seafood: 'Seafood',
  Fruit: 'Fruit',
  'Nuts and Seeds': 'Nuts and Seeds',
  'Dairy and Eggs': 'Dairy and Eggs',
  Drinks: 'Drinks',
  Sweets: 'Sweets',
  'Prepared Meals - Western': 'Meals',
  'Prepared Meals - Asian': 'Meals',
  Snacks: 'Snacks',
  'Grains and Legumes': 'Grains and Legumes',
  'Herbs and Pantry': 'Pantry',
  'Pantry & Other': 'Pantry',
  Supplements: 'Supplements',
}

const keysTo = (tab: FoodIconTab, keys: string) =>
  Object.fromEntries(keys.split(' ').map((key) => [key, tab]))

const EXTRA_TAB: Readonly<Record<string, FoodIconTab>> = {
  ...keysTo(
    'Baked Goods',
    'cinnamon_roll garlic_bread brioche focaccia rye_bread cornbread pretzel_bun breadsticks'
  ),
  ...keysTo('Sweets', 'fruit_tart creme_brulee chocolate_truffle ice_cream_sandwich fruit_gelato'),
  ...keysTo(
    'Drinks',
    'americano herbal_tea mango_smoothie strawberry_smoothie iced_matcha fruit_tea'
  ),
  ...keysTo(
    'Meals',
    'pad_thai bibimbap chicken_rice grilled_fish fried_noodles teriyaki_chicken mapo_tofu rice_bowl sushi_bowl'
  ),
  ...keysTo('Snacks', 'mixed_nuts cheese_crackers roasted_chickpeas dried_mango'),
  ...keysTo('Supplements', 'magnesium_capsules vitamin_c pre_workout shaker_cup'),
  ...keysTo('Pantry', 'ketchup_bottle mustard_bottle'),
}

// Đồ đựng (bowl, cup, jar...) nằm trong "Pantry & Other" nhưng không phải thực phẩm: gom vào Other.
const OTHER_KEYS = new Set(['bowl', 'cup', 'jar', 'bottle', 'takeout_box'])

/** Tab của một icon trong bảng chọn icon. */
export const foodIconTab = (icon: FoodIconDef): FoodIconTab =>
  OTHER_KEYS.has(icon.key)
    ? 'Other'
    : (EXTRA_TAB[icon.key] ?? CATEGORY_TAB[icon.category] ?? 'Other')
