import { Skeleton } from '@/components/ui/skeleton'
import type { FoodDetail } from '@/features/foods/types/food.types'
import type { NutrientGoal } from '@/features/nutrition/goal-progress'
import { NutrientCard } from '../../NutritionOverviewPage'
import { SECTION_GROUPS, nutrientPer100g } from './food-detail.utils'

interface NutrientSectionsProps {
  readonly food: FoodDetail
  /** Khối lượng đang chọn (g): giá trị mỗi chất = lượng trên 100 g × gram / 100, đổi số lượng là cập nhật ngay. */
  readonly grams: number
  /** Mục tiêu theo khoá danh mục (floor / target / ceiling từ BE); chất thiếu = "No Target" (hàng không có thanh). */
  readonly goals: Readonly<Record<string, NutrientGoal>>
  readonly isLoading: boolean
}

/**
 * Sáu nhóm chất (Carb / Fat / Protein Breakdown, Vitamins, Minerals, Other) vẽ từ danh mục dinh dưỡng bằng `NutrientCard` của
 * trang Nutrition Overview, nên không bao giờ thiếu hàng. Chất chưa có dữ liệu hiện "---" (không phải 0, thanh rỗng); chất không có
 * mục tiêu hiện "No Target" và bỏ thanh. Lúc chờ mục tiêu từ BE thì mỗi nhóm hiện skeleton.
 */
export function NutrientSections({ food, grams, goals, isLoading }: NutrientSectionsProps) {
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
                return (
                  <NutrientCard
                    key={nutrient.key}
                    nutrient={nutrient}
                    value={per100g === null ? null : (per100g * grams) / 100}
                    goal={goals[nutrient.key]}
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
