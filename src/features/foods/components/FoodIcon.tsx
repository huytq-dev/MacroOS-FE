import { cn } from '@/lib/utils'
import { normalizeSearchText } from '@/components/shared/searchable-options'
import type { FoodCategory } from '@/config/enums'

// Chưa có ảnh món (imageUrl): dùng biểu tượng theo món (kiểu MacroFactor), thiếu thì theo nhóm.
// Thứ tự quan trọng: cụm dài/cụ thể đứng trước ("khoai tay chien" trước "khoai tay").
const NAME_EMOJI: readonly (readonly [string, string])[] = [
  ['khoai tay chien', '🍟'],
  ['khoai tay', '🥔'],
  ['khoai lang', '🍠'],
  ['banh mi sandwich', '🍞'],
  ['banh mi', '🥖'],
  ['pho mai', '🧀'],
  ['banh pho', '🍜'],
  ['pho', '🍜'],
  ['bun', '🍜'],
  ['com tam', '🍛'],
  ['com', '🍚'],
  ['xoi', '🍙'],
  ['yen mach', '🥣'],
  ['goi cuon', '🥟'],
  ['trung', '🥚'],
  ['uc ga', '🍗'],
  ['dui ga', '🍗'],
  ['thit bo', '🥩'],
  ['thit heo', '🍖'],
  ['ca hoi', '🍣'],
  ['ca ngu', '🐟'],
  ['tom', '🦐'],
  ['dau hu', '🍢'],
  ['sua chua', '🍦'],
  ['sua', '🥛'],
  ['whey', '💪'],
  ['bap cai', '🥬'],
  ['rau muong', '🥬'],
  ['cai bo xoi', '🥬'],
  ['bap', '🌽'],
  ['ca chua', '🍅'],
  ['ca rot', '🥕'],
  ['dua leo', '🥒'],
  ['bong cai', '🥦'],
  ['chuoi', '🍌'],
  ['tao', '🍎'],
  ['cam', '🍊'],
  ['xoai', '🥭'],
  ['dua hau', '🍉'],
  ['bo dau phong', '🥜'],
  ['bo', '🥑'],
  ['dua', '🍍'],
  ['dau an', '🫒'],
  ['hanh nhan', '🥜'],
  ['hat dieu', '🥜'],
  ['ca phe', '☕'],
  ['tra sua', '🧋'],
  ['nuoc cam', '🧃'],
  ['nuoc ngot', '🥤'],
  ['socola', '🍫'],
  ['snack', '🍿'],
  ['pizza', '🍕'],
  ['hamburger', '🍔'],
]

const CATEGORY_EMOJI: Record<FoodCategory, string> = {
  Grains: '🍚',
  Vegetables: '🥦',
  Fruits: '🍎',
  Dairy: '🥛',
  Protein: '🍗',
  Fats: '🥜',
  Beverages: '🥤',
  Snacks: '🍫',
  FastFood: '🍔',
  Supplements: '💪',
  Other: '🍽️',
}

const emojiFor = (name: string, category: FoodCategory): string => {
  const text = ` ${normalizeSearchText(name)} `
  const found = NAME_EMOJI.find(
    ([keyword]) => text.includes(` ${keyword} `) || text.includes(` ${keyword}`)
  )
  return found?.[1] ?? CATEGORY_EMOJI[category] ?? CATEGORY_EMOJI.Other
}

interface FoodIconProps {
  readonly name: string
  readonly category: FoodCategory
  readonly className?: string
}

export function FoodIcon({ name, category, className }: FoodIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-12 shrink-0 items-center justify-center text-4xl leading-none',
        className
      )}
    >
      {emojiFor(name, category)}
    </span>
  )
}
