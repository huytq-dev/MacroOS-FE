'use client'

import { Flame } from 'lucide-react'
import { ModeToggle } from './DailyNutritionCard'
import { formatDateVi } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { MacroTotals, WeekDay } from '@/features/food-log/types/food-log.types'
import type { ProgramWeek } from '@/features/program/types/program.types'

export type NutritionMode = 'consumed' | 'remaining'

interface Row {
  readonly key: 'calories' | 'protein' | 'fat' | 'carbs'
  readonly label: string
  readonly fill: string
  readonly goal: (target: ProgramWeek) => number
}

// Thứ tự như MacroFactor: kcal, P, F, C.
const ROWS: readonly Row[] = [
  { key: 'calories', label: 'kcal', fill: 'bg-mf-tile-calories', goal: (t) => t.caloriesTarget },
  { key: 'protein', label: 'P', fill: 'bg-mf-tile-protein', goal: (t) => t.proteinTarget },
  { key: 'fat', label: 'F', fill: 'bg-mf-tile-fat', goal: (t) => t.fatTarget },
  { key: 'carbs', label: 'C', fill: 'bg-mf-tile-carbs', goal: (t) => t.carbsTarget },
]
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
// Mỗi hàng chỉ số cao bằng nhau ở lưới và cột tổng bên phải để các số thẳng hàng với cột của nó.
const ROW = 'h-11'

interface WeekMatrixProps {
  readonly mode: NutritionMode
  readonly onModeChange: (mode: NutritionMode) => void
  readonly days: readonly WeekDay[]
  /** Ngày đang xem; null = cả tuần (chạm lại ngày đang chọn). */
  readonly selected: string | null
  readonly onSelect: (logDate: string | null) => void
}

const consumedOf = (totals: MacroTotals, key: Row['key']) => totals[key]

/** Lưới 7 ngày × 4 chỉ số (kiểu "Nutrition & Targets"): cột thanh dọc theo % target, chạm cột để xem số của ngày đó. */
export function WeekMatrix({ mode, onModeChange, days, selected, onSelect }: WeekMatrixProps) {
  const current = days.find((day) => day.logDate === selected)

  // Không có target: thanh so với ngày ăn nhiều nhất tuần của chính chỉ số đó.
  const percent = (day: WeekDay, row: Row): number => {
    const value = consumedOf(day.totals, row.key)
    const goal = day.target ? row.goal(day.target) : 0
    const base = goal || Math.max(...days.map((item) => consumedOf(item.totals, row.key)), 0)
    if (base <= 0) return 0
    const used = Math.min(100, (value / base) * 100)
    return mode === 'consumed' || !goal ? used : 100 - used
  }

  // Cả tuần: cộng đã ăn của 7 ngày so với tổng target các ngày đã có target.
  const summary = (row: Row) => {
    const scope = current ? [current] : days
    const value = scope.reduce((sum, day) => sum + consumedOf(day.totals, row.key), 0)
    const goals = scope
      .filter((day) => day.target)
      .map((day) => row.goal(day.target as ProgramWeek))
    const goal = goals.length > 0 ? goals.reduce((sum, item) => sum + item, 0) : null
    return {
      value: Math.round(mode === 'remaining' && goal !== null ? Math.max(0, goal - value) : value),
      goal,
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-3">
      <div className="flex gap-4">
        <div className="flex flex-1">
          {days.map((day, index) => {
            const active = day.logDate === selected
            return (
              <button
                key={day.logDate}
                type="button"
                aria-pressed={active}
                aria-label={`${WEEKDAY_NAMES[index]} ${formatDateVi(day.logDate)}: ${Math.round(day.totals.calories)} kcal`}
                onClick={() => onSelect(active ? null : day.logDate)}
                className={cn(
                  'focus-visible:ring-foreground/40 flex min-w-0 flex-1 flex-col rounded-md border-[1.5px] transition-colors focus-visible:ring-1 focus-visible:outline-none',
                  active ? 'border-foreground' : 'border-transparent'
                )}
              >
                {ROWS.map((row, rowIndex) => (
                  <span
                    key={row.key}
                    aria-hidden="true"
                    className={cn(
                      'flex w-full items-center justify-center',
                      ROW,
                      rowIndex < ROWS.length - 1 && 'border-foreground/10 border-b'
                    )}
                  >
                    <span className="bg-foreground/10 relative block h-7 w-4 rounded-[3px]">
                      <span
                        className={cn(
                          'absolute bottom-1 left-1/2 w-2 -translate-x-1/2 rounded-full transition-[height] duration-300',
                          row.fill
                        )}
                        style={{ height: `calc((100% - 0.5rem) * ${percent(day, row) / 100})` }}
                      />
                      <span className="bg-foreground/40 absolute top-1 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded-full" />
                    </span>
                  </span>
                ))}
                <span
                  className={cn(
                    'py-2 text-center text-sm',
                    active ? 'text-foreground font-bold' : 'text-muted-foreground'
                  )}
                >
                  {WEEKDAY_LABELS[index]}
                </span>
              </button>
            )
          })}
        </div>

        <dl className="w-[4.5rem] shrink-0" aria-live="polite">
          {ROWS.map((row) => {
            const { value, goal } = summary(row)
            return (
              <div key={row.key} className={cn('flex flex-col justify-center', ROW)}>
                <dt className="sr-only">{row.label}</dt>
                <dd className="flex items-center gap-1 text-lg leading-none tabular-nums">
                  {value}
                  {row.key === 'calories' ? (
                    <Flame aria-hidden="true" className="size-4" />
                  ) : (
                    <span className="text-sm">{row.label}</span>
                  )}
                </dd>
                <dd className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                  {goal !== null ? `of ${Math.round(goal)}` : 'of —'}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <ModeToggle
        value={mode}
        onChange={onModeChange}
        ariaLabel="Display mode"
        options={[
          ['consumed', 'Consumed'],
          ['remaining', 'Remaining'],
        ]}
      />
    </div>
  )
}
