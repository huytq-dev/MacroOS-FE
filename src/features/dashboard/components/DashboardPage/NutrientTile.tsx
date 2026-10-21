import { MetricTile } from './MetricTile'
import { nutrientValue } from '../../dashboard.utils'
import type { NutrientDisplay } from '../../dashboard-layout'
import { NUTRIENT_GROUPS } from '../../nutrient-catalog'
import type { NutrientValue } from '../../types/dashboard.types'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalPercent, goalRemaining, hasGoal } from '@/features/nutrition/goal-progress'
import { UNKNOWN_AMOUNT, formatAmount, nutrientTone } from '@/features/nutrition/nutrient-display'
import { routePath } from '@/config/route-path'

const NUTRIENTS = new Map(
  NUTRIENT_GROUPS.flatMap((group) =>
    group.nutrients.map((nutrient) => [nutrient.key, { nutrient, groupTone: group.tone }])
  )
)

interface NutrientTileProps {
  readonly tileKey: string
  readonly values: Readonly<Record<string, NutrientValue>>
  /** Cách hiện số (Percent / Consumed / Remaining); mặc định Consumed như trang Nutrition. */
  readonly display?: NutrientDisplay
}

/**
 * Ô một nutrient (Dashboard và trang Nutrition): số theo cách người dùng chọn, thanh mục tiêu DUY NHẤT (`NutrientGoalBar`: floor → ceiling,
 * phần đã ăn, vạch target) và chạm mở trang chi tiết. Chất chưa có dữ liệu hôm nay hiện "---" (không phải 0); chất không có mục tiêu
 * chỉ hiện số. Phần trăm và "còn lại" đọc cùng một mốc chính với thanh.
 */
export function NutrientTile({ tileKey, values, display = 'consumed' }: NutrientTileProps) {
  const entry = NUTRIENTS.get(tileKey)
  if (!entry) return null
  const { nutrient, groupTone } = entry
  const { value, known = true, ...goal } = nutrientValue(values, tileKey)
  const percent = goalPercent(goal, value)
  const remaining = goalRemaining(goal, value)
  const shown = !known
    ? { text: UNKNOWN_AMOUNT, unit: nutrient.unit }
    : display === 'percent' && percent !== null
      ? { text: String(percent), unit: '%' }
      : display === 'remaining' && remaining !== null
        ? { text: formatAmount(remaining, nutrient.unit), unit: nutrient.unit }
        : { text: formatAmount(value, nutrient.unit), unit: nutrient.unit }
  return (
    <MetricTile
      title={nutrient.name}
      subtitle={nutrient.period ?? 'Today'}
      href={routePath.dashboardNutrient(tileKey)}
      visual={
        hasGoal(goal) ? (
          <NutrientGoalBar
            goal={goal}
            consumed={known ? value : null}
            tone={nutrientTone(tileKey, groupTone)}
            layout="tile"
            unit={nutrient.unit}
          />
        ) : undefined
      }
      value={shown.text}
      unit={shown.unit}
    />
  )
}
