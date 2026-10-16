import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals } from '../../types/food-log.types'

interface DayTotalsProps {
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
}

interface Row {
  label: string
  value: number
  target?: number
  unit: string
  barClass: string
}

/** Trung tính (BR-18): vượt target không đổi sang đỏ, thanh chỉ dừng ở 100 %. */
export function DayTotals({ totals, target }: DayTotalsProps) {
  const rows: Row[] = [
    {
      label: 'Protein',
      value: totals.protein,
      target: target?.proteinTarget,
      unit: 'g',
      barClass: 'bg-mf-protein',
    },
    {
      label: 'Carbs',
      value: totals.carbs,
      target: target?.carbsTarget,
      unit: 'g',
      barClass: 'bg-mf-carbs',
    },
    {
      label: 'Fat',
      value: totals.fat,
      target: target?.fatTarget,
      unit: 'g',
      barClass: 'bg-mf-fat',
    },
  ]
  const kcalTarget = target?.caloriesTarget
  const remaining = kcalTarget === undefined ? null : Math.round(kcalTarget - totals.calories)
  const pct = (value: number, goal?: number) => (goal ? Math.min(100, (value / goal) * 100) : 0)

  return (
    <Card className="gap-3 rounded-2xl p-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold tabular-nums">
            {Math.round(totals.calories)}
            <span className="text-muted-foreground text-base font-normal">
              {kcalTarget !== undefined ? ` / ${kcalTarget} kcal` : ' kcal'}
            </span>
          </p>
          {remaining !== null && (
            <p className="text-muted-foreground text-sm tabular-nums">
              {remaining >= 0 ? `còn ${remaining}` : `vượt ${-remaining}`}
            </p>
          )}
        </div>
        <div
          className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Calories"
          aria-valuenow={Math.round(totals.calories)}
          aria-valuemin={0}
          aria-valuemax={kcalTarget ?? Math.max(1, Math.round(totals.calories))}
        >
          <div
            className="bg-mf-calories h-full rounded-full transition-[width]"
            style={{ width: `${pct(totals.calories, kcalTarget)}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">
                {Math.round(row.value)}
                {row.target !== undefined && (
                  <span className="text-muted-foreground">/{Math.round(row.target)}</span>
                )}{' '}
                {row.unit}
              </span>
            </div>
            <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full transition-[width]', row.barClass)}
                style={{ width: `${pct(row.value, row.target)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {!target && (
        <p className="text-muted-foreground text-xs">
          Chưa có target cho ngày này.{' '}
          <Link href={routePath.programNew} className="text-primary underline">
            Tạo program
          </Link>
        </p>
      )}
    </Card>
  )
}
