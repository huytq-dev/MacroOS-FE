import Link from 'next/link'
import { routePath } from '@/config/route-path'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals } from '../../types/food-log.types'

interface DayTotalsProps {
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
}

const number = new Intl.NumberFormat('vi-VN')

/**
 * Tổng ngày gọn: calo / mục tiêu, thanh tiến độ mảnh, P C F một hàng.
 * Trung tính (BR-18): vượt target không đổi sang đỏ, thanh chỉ dừng ở 100 %.
 */
export function DayTotals({ totals, target }: DayTotalsProps) {
  const goal = target?.caloriesTarget
  const remaining = goal === undefined ? null : Math.round(goal - totals.calories)
  const pct = goal ? Math.min(100, (totals.calories / goal) * 100) : 0

  return (
    <section aria-label="Tổng ngày" className="bg-card space-y-3 rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          {number.format(Math.round(totals.calories))}
          <span className="text-muted-foreground text-sm font-medium">
            {goal !== undefined ? ` / ${number.format(goal)} kcal` : ' kcal'}
          </span>
        </p>
        {remaining !== null && (
          <p className="text-sm font-semibold tabular-nums">
            {remaining >= 0
              ? `còn ${number.format(remaining)}`
              : `vượt ${number.format(-remaining)}`}
          </p>
        )}
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Calo trong ngày"
        aria-valuenow={Math.round(totals.calories)}
        aria-valuemin={0}
        aria-valuemax={goal ?? Math.max(1, Math.round(totals.calories))}
      >
        <div
          className="bg-mf-calories h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-muted-foreground flex justify-between text-sm tabular-nums">
        <span>
          Protein <b className="text-mf-protein">{Math.round(totals.protein)}</b>
        </span>
        <span>
          Carbs <b className="text-mf-carbs">{Math.round(totals.carbs)}</b>
        </span>
        <span>
          Fat <b className="text-mf-fat">{Math.round(totals.fat)}</b>
        </span>
      </p>
      {!target && (
        <p className="text-muted-foreground text-sm">
          Chưa có mục tiêu cho ngày này.{' '}
          <Link
            href={routePath.programNew}
            className="text-foreground font-semibold underline underline-offset-4"
          >
            Tạo program
          </Link>
        </p>
      )}
    </section>
  )
}
