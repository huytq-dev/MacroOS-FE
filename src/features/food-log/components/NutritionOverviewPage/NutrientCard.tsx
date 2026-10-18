import { ChevronRight } from 'lucide-react'
import type { NutrientDef } from '@/features/dashboard/types/dashboard.types'
import { cn } from '@/lib/utils'
import {
  MACRO_BAR,
  displayName,
  formatAmount,
  type Contributor,
} from '../../nutrition-overview.utils'

/** Vạch mục tiêu nằm giữa thanh nên cả thanh = 200% mục tiêu; vùng tô nhạt là khoảng nên đạt (floor từ ~36%, ceiling tới ~83%). */
const TARGET_AT = 50
const FLOOR_ZONE_START = 36
const CEILING_ZONE_END = 83

interface NutrientBarProps {
  readonly kind: NutrientDef['kind']
  readonly value: number
  readonly target: number | null
  /** Lớp màu nền của thanh (vd. `bg-violet-500`). */
  readonly tone: string
}

/** Thanh tiến độ: nền xám, vùng nên đạt tô nhạt theo màu nhóm, phần đã ăn tô đặc từ trái, vạch trắng mảnh ở mục tiêu. */
export function NutrientBar({ kind, value, target, tone }: NutrientBarProps) {
  const filled = target && target > 0 ? Math.min(100, (value / target) * TARGET_AT) : 0
  const zone =
    kind === 'floor'
      ? { left: `${FLOOR_ZONE_START}%`, right: '0%' }
      : kind === 'ceiling'
        ? { left: '0%', right: `${100 - CEILING_ZONE_END}%` }
        : null
  return (
    <div aria-hidden="true" className="bg-foreground/10 relative h-6 overflow-hidden rounded-sm">
      {zone && <span className={cn('absolute inset-y-0 opacity-25', tone)} style={zone} />}
      <span
        className={cn(
          'absolute inset-y-0 left-0 transition-[width] duration-500 ease-out motion-reduce:transition-none',
          tone
        )}
        style={{ width: `${filled}%` }}
      />
      {target !== null && (
        <span
          className="bg-foreground/60 absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2"
          style={{ left: `${TARGET_AT}%` }}
        />
      )}
    </div>
  )
}

interface NutrientCardProps {
  readonly nutrient: NutrientDef
  readonly value: number
  readonly target: number | null
  readonly tone: string
  /** Món đóng góp (chỉ calo/macro ở tab Today): undefined = thẻ không có phần này, null = có nhưng đang thu lại, mảng = đang mở. */
  readonly contributors?: readonly Contributor[] | null
}

/**
 * Thẻ một chất (Nutrition Overview): tên bên trái, "đã ăn / mục tiêu đơn vị" ở giữa, phần trăm (hoặc "No Target") bên phải.
 * Chất có thanh thì vẽ thanh bên dưới; chất không có mục tiêu và không có thanh (Net, Starch…) chỉ hiện giá trị.
 * Contributors mở ra bằng hoạt ảnh trượt, liệt kê tối đa ba món hoặc "No contributors present".
 */
export function NutrientCard({ nutrient, value, target, tone, contributors }: NutrientCardProps) {
  const unit = nutrient.unit
  const showBar = nutrient.kind !== 'none'
  const percent = target !== null && target > 0 ? Math.round((value / target) * 100) : null
  const barTone = MACRO_BAR[nutrient.key] ?? tone
  const open = contributors !== undefined && contributors !== null
  return (
    <li className="bg-card rounded-xl px-4 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-base">
        <span className="min-w-0 truncate">{displayName(nutrient)}</span>
        <span className="text-center tabular-nums">
          {target !== null
            ? `${formatAmount(value, unit)} / ${formatAmount(target, unit)} ${unit}`
            : `${formatAmount(value, unit)} ${unit}`}
        </span>
        <span className="text-muted-foreground text-right tabular-nums">
          {percent !== null ? `${percent}%` : target === null ? 'No Target' : ''}
        </span>
      </div>
      {showBar && (
        <div className="mt-3">
          <NutrientBar kind={nutrient.kind} value={value} target={target} tone={barTone} />
        </div>
      )}
      {contributors !== undefined && (
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
              {open && contributors.length > 0 ? (
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
      )}
    </li>
  )
}
