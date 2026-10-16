import Link from 'next/link'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals } from '@/features/food-log/types/food-log.types'

interface TodaySummaryProps {
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
}

interface MacroRow {
  readonly label: string
  readonly value: number
  readonly goal?: number
  readonly textClass: string
  readonly barClass: string
}

const pct = (value: number, goal?: number) => (goal ? Math.min(100, (value / goal) * 100) : 0)
const number = new Intl.NumberFormat('vi-VN')

/**
 * Tóm tắt hôm nay kiểu MacroFactor: số calo lớn làm tâm điểm, thanh tiến độ, ba macro mang màu riêng.
 * Trung tính (BR-18): vượt target không đổi sang đỏ, thanh chỉ dừng ở 100 %.
 */
export function TodaySummary({ totals, target }: TodaySummaryProps) {
  const kcalGoal = target?.caloriesTarget
  const remaining = kcalGoal === undefined ? null : Math.round(kcalGoal - totals.calories)
  const macros: MacroRow[] = [
    {
      label: 'Protein',
      value: totals.protein,
      goal: target?.proteinTarget,
      textClass: 'text-mf-protein',
      barClass: 'bg-mf-protein',
    },
    {
      label: 'Carbs',
      value: totals.carbs,
      goal: target?.carbsTarget,
      textClass: 'text-mf-carbs',
      barClass: 'bg-mf-carbs',
    },
    {
      label: 'Fat',
      value: totals.fat,
      goal: target?.fatTarget,
      textClass: 'text-mf-fat',
      barClass: 'bg-mf-fat',
    },
  ]

  return (
    <section aria-label="Tóm tắt hôm nay" className="bg-card space-y-5 rounded-2xl p-5">
      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-[44px] leading-none font-bold tracking-tight tabular-nums">
            {number.format(Math.round(totals.calories))}
            <span className="text-muted-foreground ml-1.5 text-base font-medium tracking-normal">
              kcal
            </span>
          </p>
          {remaining !== null && (
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">
                {remaining >= 0
                  ? `còn ${number.format(remaining)}`
                  : `vượt ${number.format(-remaining)}`}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                mục tiêu {number.format(kcalGoal ?? 0)}
              </p>
            </div>
          )}
        </div>
        <div
          className="bg-muted mt-4 h-2.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Calo hôm nay"
          aria-valuenow={Math.round(totals.calories)}
          aria-valuemin={0}
          aria-valuemax={kcalGoal ?? Math.max(1, Math.round(totals.calories))}
        >
          <div
            className="bg-mf-calories h-full rounded-full transition-[width] duration-300"
            style={{ width: `${pct(totals.calories, kcalGoal)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {macros.map((macro) => (
          <div key={macro.label}>
            <p className="text-muted-foreground text-xs">{macro.label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">
              <span className={macro.textClass}>{Math.round(macro.value)}</span>
              {macro.goal !== undefined && (
                <span className="text-muted-foreground text-xs font-normal">
                  {' '}
                  / {Math.round(macro.goal)} g
                </span>
              )}
            </p>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-300',
                  macro.barClass
                )}
                style={{ width: `${pct(macro.value, macro.goal)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {!target && (
        <p className="text-muted-foreground text-sm">
          Chưa có mục tiêu cho hôm nay.{' '}
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
