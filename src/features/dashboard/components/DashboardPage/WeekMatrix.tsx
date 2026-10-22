'use client'

import { Flame } from 'lucide-react'
import { ModeToggle } from './DailyNutritionCard'
import { weekSummary } from '../../dashboard.utils'
import { weekBarProgress } from '@/features/nutrition/goal-progress'
import { useUnits } from '@/features/users/hooks/use-units'
import { formatDate } from '@/lib/date'
import { dayLetterOfDate, dayOfWeekOf } from '@/lib/week'
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
// Mỗi hàng chỉ số cao bằng nhau ở lưới và cột tổng bên phải để các số thẳng hàng với cột của nó.
const ROW = 'h-12'
// Thanh đổi chiều cao 400ms ease-out khi đổi Consumed ↔ Remaining (mép trên trượt trong ô, nắp đi theo)
const BAR_MOTION =
  'transition-[height,opacity] duration-[400ms] ease-out motion-reduce:transition-none'
// Sàn hiển thị (px) của phần màu khi đã có dữ liệu: 8% của ô chỉ cao ~2px nên nếu không có sàn thì chỉ thấy nắp trắng và người dùng tưởng chưa ăn gì. Chỉ là sàn nhìn thấy được, KHÔNG phải thang đo — chiều cao thật vẫn là consumed / target.
const MIN_FILL_PX = 10

interface WeekMatrixProps {
  readonly mode: NutritionMode
  readonly onModeChange: (mode: NutritionMode) => void
  /** Bảy ngày theo thứ tự cột, bắt đầu từ ngày đầu tuần của user; nhãn cột lấy từ chính ngày đó. */
  readonly days: readonly WeekDay[]
  /** Ngày đang xem; null = cả tuần (chạm lại ngày đang chọn). */
  readonly selected: string | null
  readonly onSelect: (logDate: string | null) => void
  /** Hôm nay (yyyy-MM-dd): ngày sau đó có thanh xám mờ, nhãn hôm nay sáng hơn. */
  readonly today: string | null
}

const consumedOf = (totals: MacroTotals, key: Row['key']) => totals[key]

/** Lưới 7 ngày × 4 chỉ số (kiểu "Nutrition & Targets"): cột thanh dọc theo % target, chạm cột để xem số của ngày đó. */
export function WeekMatrix({
  mode,
  onModeChange,
  days,
  selected,
  onSelect,
  today,
}: WeekMatrixProps) {
  const current = days.find((day) => day.logDate === selected)
  const { energy } = useUnits()
  // Calo hiện theo kcal / kJ của user (BE luôn kcal); macro là gram
  const shown = (row: Row, value: number) =>
    Math.round(row.key === 'calories' ? energy.convert(value) : value)

  const progressOf = (day: WeekDay, row: Row) =>
    weekBarProgress(consumedOf(day.totals, row.key), day.target ? row.goal(day.target) : 0, mode)

  // Cả tuần: cộng đã ăn của 7 ngày so với tổng target các ngày đã có target; số còn lại tính bằng quy tắc chung (`weekSummary` → `shownProgress`)
  const summary = (row: Row) =>
    weekSummary(current ? [current] : days, row.key, row.goal, mode, (value) => shown(row, value))

  return (
    <div className="flex flex-1 flex-col justify-between gap-3">
      <div className="flex gap-4">
        <div className="flex flex-1">
          {days.map((day) => {
            const active = day.logDate === selected
            const isToday = day.logDate === today
            const future = today !== null && day.logDate > today
            return (
              <button
                key={day.logDate}
                type="button"
                aria-pressed={active}
                aria-label={`${dayOfWeekOf(day.logDate)} ${formatDate(day.logDate)}: ${energy.text(day.totals.calories)}`}
                onClick={() => onSelect(active ? null : day.logDate)}
                className={cn(
                  'focus-visible:ring-ring/50 flex min-w-0 flex-1 flex-col rounded-xl border-[1.5px] transition-colors focus-visible:ring-1 focus-visible:outline-none',
                  active ? 'border-foreground' : 'border-transparent'
                )}
              >
                {ROWS.map((row, rowIndex) => {
                  const { progress, over } = progressOf(day, row)
                  // Ô rỗng (dấu gạch) khi ngày tương lai, không có target hoặc thanh = 0: chưa ăn ở Consumed, ăn ≥ target ở Remaining
                  const empty = future || progress <= 0
                  return (
                    <span
                      key={row.key}
                      aria-hidden="true"
                      className={cn(
                        'flex w-full items-center justify-center',
                        ROW,
                        rowIndex < ROWS.length - 1 && 'border-foreground/10 border-b'
                      )}
                    >
                      {/* Ô cao gần đủ hàng (≈ 70% bề rộng cột): dấu gạch ở ĐỈNH ô khi rỗng, thanh dày bo tròn đầy từ đáy lên có nắp trắng ở đỉnh phần màu; hai lớp luôn có mặt để đổi rỗng ↔ có thanh là mờ dần / lớn dần chứ không nhảy */}
                      <span className="bg-foreground/10 relative block h-10 w-[70%] rounded-[3px]">
                        <span
                          className={cn(
                            'bg-foreground/30 absolute top-2 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded-full',
                            BAR_MOTION,
                            empty ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="absolute inset-y-1.5 left-1/2 w-[30%] -translate-x-1/2">
                          <span
                            className={cn(
                              'absolute inset-x-0 bottom-0 rounded-full',
                              BAR_MOTION,
                              row.fill,
                              empty ? 'opacity-0' : 'opacity-100'
                            )}
                            style={{
                              height: empty ? 0 : `max(${MIN_FILL_PX}px, ${progress * 100}%)`,
                            }}
                          >
                            {/* Nắp trắng ở đỉnh phần màu; vượt target (Consumed) thì nắp dày hơn và có vòng sáng */}
                            <span
                              className={cn(
                                'bg-foreground absolute inset-x-0 top-0 rounded-full',
                                over ? 'h-1.5 shadow-[0_0_0_1.5px_var(--foreground)]' : 'h-1'
                              )}
                            />
                          </span>
                        </span>
                      </span>
                    </span>
                  )
                })}
                <span
                  className={cn(
                    'py-2 text-center text-sm',
                    active || isToday ? 'text-foreground' : 'text-muted-foreground',
                    active && 'font-bold'
                  )}
                >
                  {dayLetterOfDate(day.logDate)}
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
                <dt className="sr-only">{row.key === 'calories' ? energy.unit : row.label}</dt>
                <dd className="flex items-center gap-1 text-lg leading-none tabular-nums">
                  {value}
                  {row.key === 'calories' ? (
                    <Flame aria-hidden="true" className="size-4" />
                  ) : (
                    <span className="text-sm">{row.label}</span>
                  )}
                </dd>
                <dd className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                  {goal !== null ? `of ${goal}` : 'of —'}
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
