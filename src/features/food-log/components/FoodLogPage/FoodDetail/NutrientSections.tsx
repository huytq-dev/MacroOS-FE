import { Skeleton } from '@/components/ui/skeleton'
import type { FoodDetail } from '@/features/foods/types/food.types'
import { NutrientCard } from '../../NutritionOverviewPage'
import { SECTION_GROUPS, nutrientPer100g } from './food-detail.utils'

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
 * trang Nutrition Overview, nên không bao giờ thiếu hàng. Chất chưa có dữ liệu hiện 0 (thanh rỗng); chất không có mục tiêu thì
 * bỏ thanh. Lúc chờ mục tiêu từ BE thì mỗi nhóm hiện skeleton.
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
                return (
                  <NutrientCard
                    key={nutrient.key}
                    nutrient={target === null ? { ...nutrient, kind: 'none' } : nutrient}
                    value={per100g === null ? 0 : (per100g * grams) / 100}
                    target={target}
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
