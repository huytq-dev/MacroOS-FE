import { MetricTile } from './MetricTile'
import { nutrientValue } from '../../dashboard.utils'
import type { NutrientDisplay } from '../../dashboard-layout'
import { NUTRIENT_GROUPS } from '../../nutrient-catalog'
import type { NutrientValue } from '../../types/dashboard.types'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalPercent, goalStatus, hasGoal, primaryGoal } from '@/features/nutrition/goal-progress'
import {
  UNKNOWN_AMOUNT,
  displayAmount,
  formatAmount,
  nutrientTone,
  roundAmount,
} from '@/features/nutrition/nutrient-display'
import { shownProgress } from '@/features/nutrition/remaining'
import { useUnits } from '@/features/users/hooks/use-units'
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
  /** Nguồn số liệu của ô chưa về: khung xám thay vì "---" / 0 (không đọc như "chưa có dữ liệu"). */
  readonly loading?: boolean
}

/**
 * Ô một nutrient (Dashboard và trang Nutrition): số theo cách người dùng chọn, thanh mục tiêu DUY NHẤT (`NutrientGoalBar`: floor → ceiling,
 * phần đã ăn, vạch target) và chạm mở trang chi tiết. Chất chưa có dữ liệu hôm nay hiện "---" (không phải 0); chất không có mục tiêu
 * chỉ hiện số. Phần trăm và "còn lại" đọc cùng một mốc chính với thanh.
 */
export function NutrientTile({
  tileKey,
  values,
  display = 'consumed',
  loading = false,
}: NutrientTileProps) {
  const { energy } = useUnits()
  const entry = NUTRIENTS.get(tileKey)
  if (!entry) return null
  const { nutrient, groupTone } = entry
  const { value, known = true, ...goal } = nutrientValue(values, tileKey)
  const percent = goalPercent(goal, value)
  // Vượt TRẦN (giới hạn thật) là cảnh báo và đổi màu số phần trăm; vượt target chỉ là thông tin ("112%") nên giữ màu thường
  const overCeiling = known && goalStatus(goal, value) === 'overCeiling'
  // Calo hiện theo kcal / kJ của user (thanh và % vẫn tính trên số kcal của BE)
  const amount = (kcalOrGrams: number) => {
    const shownAmount = displayAmount(kcalOrGrams, nutrient.unit, energy)
    return { text: formatAmount(shownAmount.value, shownAmount.unit), unit: shownAmount.unit }
  }
  const shownUnit = displayAmount(0, nutrient.unit, energy).unit
  // "Còn lại" theo MỘT quy tắc chung (`shownProgress`): làm tròn đã ăn và mục tiêu chính ở đơn vị đang hiện TRƯỚC rồi mới trừ, khớp Daily / Weekly Nutrition
  const remaining = known
    ? shownProgress(value, primaryGoal(goal), (kcalOrGrams) => {
        const converted = displayAmount(kcalOrGrams, nutrient.unit, energy)
        return roundAmount(converted.value, converted.unit)
      }).remaining
    : null
  const shown = !known
    ? { text: UNKNOWN_AMOUNT, unit: shownUnit }
    : display === 'percent' && percent !== null
      ? { text: String(percent), unit: '%' }
      : display === 'remaining' && remaining !== null
        ? { text: formatAmount(remaining, shownUnit), unit: shownUnit }
        : amount(value)
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
      loading={loading}
      warning={overCeiling && display === 'percent' && percent !== null}
    />
  )
}
