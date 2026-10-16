'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDateVi } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { MacroTotals, WeekDay } from '@/features/food-log/types/food-log.types'
import type { ProgramWeek } from '@/features/program/types/program.types'

type Mode = 'consumed' | 'remaining'

interface Row {
  readonly key: 'calories' | 'protein' | 'fat' | 'carbs'
  readonly label: string
  readonly fill: string
  readonly goal: (target: ProgramWeek) => number
}

// Thứ tự như MacroFactor: kcal, P, F, C.
const ROWS: readonly Row[] = [
  { key: 'calories', label: 'kcal', fill: 'bg-mf-calories', goal: (t) => t.caloriesTarget },
  { key: 'protein', label: 'P', fill: 'bg-mf-protein', goal: (t) => t.proteinTarget },
  { key: 'fat', label: 'F', fill: 'bg-mf-fat', goal: (t) => t.fatTarget },
  { key: 'carbs', label: 'C', fill: 'bg-mf-carbs', goal: (t) => t.carbsTarget },
]
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const CELL = 'h-11'

interface WeekMatrixProps {
  readonly days: readonly WeekDay[]
  /** Ngày đang xem; null = cả tuần (chạm lại ngày đang chọn). */
  readonly selected: string | null
  readonly onSelect: (logDate: string | null) => void
  readonly onPreviousWeek: () => void
  /** Không cho đi quá tuần hiện tại. */
  readonly onNextWeek?: () => void
}

const consumedOf = (totals: MacroTotals, key: Row['key']) => totals[key]

/** Lưới 7 ngày × 4 chỉ số (kiểu "Nutrition & Targets"): cột thanh dọc theo % target, chạm cột để xem số của ngày đó. */
export function WeekMatrix({
  days,
  selected,
  onSelect,
  onPreviousWeek,
  onNextWeek,
}: WeekMatrixProps) {
  const [mode, setMode] = useState<Mode>('consumed')
  const current = days.find((day) => day.logDate === selected)
  const first = days[0]
  const last = days[days.length - 1]

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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          icon={ChevronLeft}
          label="Tuần trước"
          className="size-11 md:size-8"
          onClick={onPreviousWeek}
        />
        <p
          className="text-center text-base font-semibold tabular-nums md:text-sm"
          aria-live="polite"
        >
          {current
            ? `${WEEKDAY_LABELS[days.indexOf(current)]}, ${formatDateVi(current.logDate).slice(0, 5)}`
            : 'Cả tuần'}
          <span className="text-muted-foreground block text-sm font-normal md:text-xs">
            {formatDateVi(first.logDate).slice(0, 5)} – {formatDateVi(last.logDate).slice(0, 5)}
          </span>
        </p>
        <IconButton
          icon={ChevronRight}
          label="Tuần sau"
          className="size-11 md:size-8"
          disabled={!onNextWeek}
          onClick={onNextWeek}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 gap-1">
          {days.map((day, index) => {
            const active = day.logDate === selected
            return (
              <button
                key={day.logDate}
                type="button"
                aria-pressed={active}
                aria-label={`${WEEKDAY_LABELS[index]} ${formatDateVi(day.logDate)}: ${Math.round(day.totals.calories)} kcal`}
                onClick={() => onSelect(active ? null : day.logDate)}
                className={cn(
                  'focus-visible:ring-ring/50 flex min-w-0 flex-1 flex-col gap-2 rounded-xl border-2 px-0.5 py-1.5 transition-colors focus-visible:ring-1 focus-visible:outline-none',
                  active ? 'border-foreground' : 'border-transparent'
                )}
              >
                {ROWS.map((row) => (
                  <span
                    key={row.key}
                    aria-hidden="true"
                    className={cn('bg-muted/70 relative block w-full rounded-md', CELL)}
                  >
                    <span
                      className={cn(
                        'absolute bottom-1 left-1/2 w-2.5 -translate-x-1/2 rounded-full transition-[height] duration-300',
                        row.fill
                      )}
                      style={{ height: `calc((100% - 0.5rem) * ${percent(day, row) / 100})` }}
                    />
                    <span className="bg-foreground/40 absolute top-1 left-1/2 h-0.5 w-2.5 -translate-x-1/2 rounded-full" />
                  </span>
                ))}
                <span
                  className={cn(
                    'text-center text-sm',
                    active ? 'text-foreground font-bold' : 'text-muted-foreground'
                  )}
                >
                  {WEEKDAY_LABELS[index]}
                </span>
              </button>
            )
          })}
        </div>

        <dl className="flex w-[4.5rem] shrink-0 flex-col gap-2 py-1.5 pl-1" aria-live="polite">
          {ROWS.map((row) => {
            const { value, goal } = summary(row)
            return (
              <div key={row.key} className={cn('flex flex-col justify-center', CELL)}>
                <dt className="sr-only">{row.label}</dt>
                <dd className="text-base leading-tight font-semibold tabular-nums">
                  {value}
                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    {row.label}
                  </span>
                </dd>
                <dd className="text-muted-foreground text-xs tabular-nums">
                  {goal !== null ? `/ ${Math.round(goal)}` : '/ —'}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(next) => next && setMode(next as Mode)}
        aria-label="Kiểu hiển thị"
        className="mx-auto gap-1"
      >
        {(
          [
            ['consumed', 'Đã ăn'],
            ['remaining', 'Còn lại'],
          ] as const
        ).map(([value, label]) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="data-[state=on]:bg-foreground data-[state=on]:text-background h-10 rounded-full px-5 text-base md:h-8 md:text-sm"
          >
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
