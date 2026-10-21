import Link from 'next/link'
import type { NutrientInfo } from '../nutrient-detail.utils'
import type { NutrientDayResponse } from '../types/nutrient-detail.types'
import { NutrientCard } from '@/features/food-log/components/NutritionOverviewPage/NutrientCard'
import { routePath } from '@/config/route-path'

const TOP = 3

/**
 * Thẻ "<Nutrient> Today" của trang chi tiết: tái dùng `NutrientCard` (tên, "lượng / mục tiêu đơn vị", %, thanh có vạch target, Top 3
 * Contributors). Chạm cả thẻ mở trang tóm tắt của chất (Today / Past Week / Past Month, mục tiêu, mọi món đóng góp, phân bố theo giờ).
 */
export function NutrientTodayCard({
  info,
  day,
}: {
  readonly info: NutrientInfo
  readonly day: NutrientDayResponse | undefined
}) {
  const { nutrient, tone } = info
  return (
    <Link
      href={routePath.dashboardNutrientSummary(nutrient.key)}
      aria-label={`${nutrient.name} summary`}
      className="focus-visible:ring-ring/50 block rounded-xl transition-transform focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-[0.99]"
    >
      <ul>
        <NutrientCard
          nutrient={nutrient}
          value={day?.amount ?? null}
          goal={day}
          tone={tone}
          contributors={(day?.contributors ?? [])
            .slice(0, TOP)
            .map((item) => ({ name: item.name, value: item.amount }))}
        />
      </ul>
    </Link>
  )
}
