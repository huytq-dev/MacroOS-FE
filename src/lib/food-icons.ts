/**
 * Bộ icon món ăn (300 icon, CC BY 4.0 từ foodiconpack.com, đã tô màu): file tĩnh ở `public/food-icons/<phiên bản>/`. BE chỉ lưu
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

/** Các tab của bảng "Choose Icon" theo MacroFactor (sau tab All). */
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
  'Other',
] as const
export type FoodIconTab = (typeof FOOD_ICON_TABS)[number]

// Bộ icon có 9 nhóm gốc, chưa có bánh nướng và đồ ngọt: gom các nguyên liệu làm bánh / đồ ngọt về hai tab đó, còn lại vào Other.
const BAKED_KEYS = new Set([
  'flour',
  'bread_flour',
  'whole_wheat_flour',
  'almond_flour',
  'cornmeal',
  'lasagna_sheet',
])
const SWEET_KEYS = new Set([
  'sugar',
  'brown_sugar',
  'honey',
  'maple_syrup',
  'chocolate_chips',
  'cocoa_powder',
])
const SOURCE_TAB: Readonly<Record<string, FoodIconTab>> = {
  Vegetables: 'Vegetables',
  Fruit: 'Fruit',
  Meats: 'Meats',
  Seafood: 'Seafood',
  'Nuts and Seeds': 'Nuts and Seeds',
  'Dairy and Eggs': 'Dairy and Eggs',
  Drinks: 'Drinks',
}

/** Tab của một icon trong bảng chọn icon. */
export const foodIconTab = (icon: FoodIconDef): FoodIconTab =>
  BAKED_KEYS.has(icon.key)
    ? 'Baked Goods'
    : SWEET_KEYS.has(icon.key)
      ? 'Sweets'
      : (SOURCE_TAB[icon.category] ?? 'Other')
