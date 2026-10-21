import { ChevronRight } from 'lucide-react'
import type { NutrientDef } from '@/features/dashboard/types/dashboard.types'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import {
  goalPercent,
  hasGoal,
  primaryGoal,
  type NutrientGoal,
} from '@/features/nutrition/goal-progress'
import { UNKNOWN_AMOUNT, formatAmount, nutrientTone } from '@/features/nutrition/nutrient-display'
import { cn } from '@/lib/utils'
import { displayName, type Contributor } from '../../nutrition-overview.utils'

interface NutrientCardProps {
  readonly nutrient: NutrientDef
  /** null = chưa có dữ liệu chất này: hiện "---" thay vì 0 (0 nghĩa là biết bằng 0) và thanh rỗng. */
  readonly value: number | null
  /** floor / target / ceiling hiệu lực; không có mốc nào thì hàng chỉ hiện số kèm "No Target" và không có thanh. */
  readonly goal: Partial<NutrientGoal> | null | undefined
  /** Lớp nền màu nhóm của chất (calo / macro tự dùng màu riêng, xem `nutrientTone`). */
  readonly tone: string
  /** Món đóng góp (chỉ calo/macro ở tab Today): undefined = thẻ không có phần này, null = có nhưng đang thu lại, mảng = đang mở. */
  readonly contributors?: readonly Contributor[] | null
  /** `row` (mặc định): hàng tên / số / % + thanh mảnh (chi tiết món, plate). `tile`: thẻ 2 cột thanh dày của Nutrition Overview. */
  readonly layout?: 'row' | 'tile'
  /** Kỳ hiện dưới tên ở thẻ `tile` ("Today", "1 Week"…). */
  readonly period?: string
  /** Thẻ `tile` chiếm cả hai cột (Calories). */
  readonly wide?: boolean
}

/**
 * Thẻ một chất (Nutrition Overview, chi tiết món, plate, recipe, trang chi tiết nutrient): tên bên trái, "đã ăn / mục tiêu đơn vị" ở giữa,
 * phần trăm (hoặc "No Target") bên phải. Thanh là `NutrientGoalBar` — cùng một thanh với Dashboard; chất không có mục tiêu chỉ hiện giá trị.
 * Contributors mở ra bằng hoạt ảnh trượt, liệt kê tối đa ba món hoặc "No contributors present".
 */
export function NutrientCard({
  nutrient,
  value,
  goal,
  tone,
  contributors,
  layout = 'row',
  period,
  wide = false,
}: NutrientCardProps) {
  const unit = nutrient.unit
  const known = value !== null
  const reference = primaryGoal(goal)
  const percent = goalPercent(goal, value)
  const barTone = nutrientTone(nutrient.key, tone)
  const bar = hasGoal(goal) && (
    <NutrientGoalBar
      goal={goal}
      consumed={value}
      tone={barTone}
      layout={layout === 'tile' ? 'tile' : 'row'}
    />
  )
  const open = contributors !== undefined && contributors !== null
  const contributorList = contributors !== undefined && (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden" inert={!open}>
        <div className="border-foreground/10 mt-3 border-t pt-3">
          <p className="flex items-center justify-between text-base font-semibold">
            Top 3 Contributors
            <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
          </p>
          {/* Không phụ thuộc `open`: khi đang co lại danh sách vẫn còn đó, không nháy sang "No contributors" */}
          {contributors?.length ? (
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              {contributors.map((item) => (
                <li key={item.name} className="flex justify-between gap-3">
                  <span className="truncate">{item.name}</span>
                  <span className="tabular-nums">
                    {formatAmount(item.value, unit)} {unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">No contributors present</p>
          )}
        </div>
      </div>
    </div>
  )

  // Thẻ của Nutrition Overview như MacroFactor: tên + kỳ, thanh dày (chất không có mục tiêu chừa chỗ trống), vạch kẻ, số lớn + mũi tên
  if (layout === 'tile')
    return (
      <li className={cn('bg-card flex flex-col rounded-xl px-4 pt-4 pb-3', wide && 'col-span-2')}>
        <p className="truncate text-xl leading-tight">{displayName(nutrient)}</p>
        <p className="text-muted-foreground text-base">{period}</p>
        <div className="mt-3 mb-3 flex h-6 items-center">
          <div className="w-full">{bar}</div>
        </div>
        <div className="border-foreground/10 mt-auto flex items-center justify-between border-t pt-3">
          <span className="tabular-nums">
            <span className="text-2xl">{known ? formatAmount(value, unit) : UNKNOWN_AMOUNT}</span>{' '}
            <span className="text-muted-foreground text-lg">{unit}</span>
          </span>
          <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
        </div>
        {contributorList}
      </li>
    )

  return (
    <li className="bg-card rounded-xl px-4 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-base">
        <span className="min-w-0 truncate">{displayName(nutrient)}</span>
        <span className="text-center tabular-nums">
          {known ? formatAmount(value, unit) : UNKNOWN_AMOUNT}
          {reference !== null && ` / ${formatAmount(reference, unit)}`} {unit}
        </span>
        <span className="text-muted-foreground text-right tabular-nums">
          {percent !== null ? `${percent}%` : reference === null ? 'No Target' : ''}
        </span>
      </div>
      {bar && <div className="mt-3">{bar}</div>}
      {contributorList}
    </li>
  )
}
