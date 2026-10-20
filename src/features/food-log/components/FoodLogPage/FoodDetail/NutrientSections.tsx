import { Skeleton } from '@/components/ui/skeleton'
import type { FoodDetail } from '@/features/foods/types/food.types'
import { NutrientCard } from '../../NutritionOverviewPage'
import { SECTION_GROUPS, nutrientPer100g } from './food-detail.utils'

/** Chất chưa có mục tiêu thì thanh tô theo tỉ lệ so với tổng của nhóm (Sugars / Carbs, Saturated / Fat). */
const REFERENCE_KEY: Readonly<Record<string, string>> = {
  sugars: 'carbs',
  sugarsAdded: 'carbs',
  saturated: 'fat',
  transFat: 'fat',
}

interface NutrientSectionsProps {
  readonly food: FoodDetail
  /** Khối lượng đang chọn (g): giá trị mỗi chất = lượng trên 100 g × gram / 100, đổi số lượng là cập nhật ngay. */
  readonly grams: number
  /** Mục tiêu theo khoá danh mục; chất thiếu hoặc null = "No Target" (hàng không có thanh). */
  readonly targets: Readonly<Record<string, number | null>>
  readonly isLoading: boolean
}

/**
 * Sáu nhóm chất (Carb / Fat / Protein Breakdown, Vitamins, Minerals, Other) vẽ từ danh mục dinh dưỡng bằng `NutrientCard` của
 * trang Nutrition Overview, nên không bao giờ thiếu hàng. Chất chưa có dữ liệu hiện "—" (không phải 0, thanh rỗng); chất không có
 * mục tiêu hiện "No Target" và bỏ thanh. Lúc chờ mục tiêu từ BE thì mỗi nhóm hiện skeleton.
 */
export function NutrientSections({ food, grams, targets, isLoading }: NutrientSectionsProps) {
  return (
    <div className="flex flex-col gap-8">
      {SECTION_GROUPS.map((group) => (
        <section key={group.key} aria-labelledby={`detail-${group.key}`} className="space-y-3">
          <h2 id={`detail-${group.key}`} className="text-xl font-bold">
            {group.title}
          </h2>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : (
            <ul className="space-y-3">
              {group.nutrients.map((nutrient) => {
                const per100g = nutrientPer100g(food, nutrient.key)
                const target = targets[nutrient.key] ?? null
                const referenceKey = REFERENCE_KEY[nutrient.key]
                const referencePer100g = referenceKey ? nutrientPer100g(food, referenceKey) : null
                return (
                  <NutrientCard
                    key={nutrient.key}
                    nutrient={nutrient}
                    value={per100g === null ? null : (per100g * grams) / 100}
                    target={target}
                    reference={referencePer100g === null ? null : (referencePer100g * grams) / 100}
                    tone={group.tone}
                  />
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
