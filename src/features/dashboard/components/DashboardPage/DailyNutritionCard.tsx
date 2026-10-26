'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { NutritionMode } from './WeekMatrix'
import type { ShownTotals } from '@/features/food-log/types/food-log.types'
import { targetRatio } from '@/features/nutrition/goal-progress'
import { shownProgressOrUnknown } from '@/features/nutrition/remaining'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { useUnits } from '@/features/users/hooks/use-units'

interface ModeToggleProps<T extends string> {
  readonly value: T
  readonly onChange: (value: T) => void
  readonly options: readonly (readonly [T, string])[]
  readonly ariaLabel: string
}

/** Công tắc hai đoạn dạng viên thuốc (Đã ăn/Còn lại, Tiêu hao/Mục tiêu): đoạn đang chọn nền sáng. */
export function ModeToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: ModeToggleProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={ariaLabel}
      className="bg-secondary mx-auto gap-0 rounded-full p-1"
    >
      {options.map(([optionValue, label]) => (
        <ToggleGroupItem
          key={optionValue}
          value={optionValue}
          className="data-[state=on]:bg-foreground data-[state=on]:text-background focus-visible:ring-foreground/40 h-11 rounded-full px-4 text-sm shadow-none transition-colors focus-visible:ring-1 md:h-9"
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// Cung 270° (mở xuống dưới) như MacroFactor: từ góc dưới trái qua đỉnh tới góc dưới phải; tâm (80,80), r=72.
const ARC_PATH = 'M 29.1 130.9 A 72 72 0 1 1 130.9 130.9'
const CENTER_Y = '57%'

const MACROS = [
  {
    key: 'protein',
    label: 'Protein',
    bar: 'bg-mf-tile-protein',
    goal: (t: ProgramWeek) => t.proteinTarget,
  },
  { key: 'fat', label: 'Fat', bar: 'bg-mf-tile-fat', goal: (t: ProgramWeek) => t.fatTarget },
  {
    key: 'carbs',
    label: 'Carbs',
    bar: 'bg-mf-tile-carbs',
    goal: (t: ProgramWeek) => t.carbsTarget,
  },
] as const

interface DailyNutritionCardProps {
  /** Số hiệu lực của BE; null = chưa biết (hiện "—"), không phải 0. */
  readonly totals: ShownTotals
  /** null = chưa có program: chỉ hiện số đã ăn, ẩn vòng và thanh. */
  readonly target: ProgramWeek | null
  readonly mode: NutritionMode
  readonly onModeChange: (mode: NutritionMode) => void
}

/** Số + nhãn đặt ngang tâm vòng cung (hai bên vòng). */
function SideStat({ value, label }: { readonly value: number | null; readonly label: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 -translate-y-1/2 text-center" style={{ top: CENTER_Y }}>
        <dd className="text-xl font-medium tabular-nums">{value ?? '—'}</dd>
        <dt className="text-muted-foreground text-sm">{label}</dt>
      </div>
    </div>
  )
}

/** "Dinh dưỡng hôm nay": vòng cung kcal (đã ăn hoặc còn lại) ở giữa, hai số hai bên, ba thanh macro bên dưới. */
export function DailyNutritionCard({
  totals,
  target,
  mode,
  onModeChange,
}: DailyNutritionCardProps) {
  const { energy } = useUnits()
  // Đổi sang kcal / kJ của user TRƯỚC khi làm tròn (như ô Calories của mục Nutrition), rồi Remaining = Target − Consumed ngay ở đơn vị đang hiện
  // để ba số luôn cộng đúng (`shownProgress`: MỘT quy tắc chung với Weekly Nutrition, Food Log và ô nutrient); ở kcal không đổi gì
  const shown = (kcal: number) => Math.round(energy.convert(kcal))
  const { consumed, goal, remaining } = shownProgressOrUnknown(
    totals.calories,
    target?.caloriesTarget,
    shown
  )
  const consumedMode = mode === 'consumed'
  // 100% = target (`targetRatio` dùng chung); chế độ Remaining vẽ phần còn lại
  const arc =
    goal && consumed !== null
      ? targetRatio(consumedMode ? consumed : (remaining ?? 0), goal).progress
      : 0
  const big = consumedMode ? consumed : remaining
  const side = consumedMode ? remaining : consumed

  return (
    <div className="flex flex-1 flex-col justify-between gap-3">
      <h2 className="text-lg font-bold">Daily Nutrition</h2>
      <dl className="grid grid-cols-[1fr_minmax(0,45%)_1fr] gap-x-1" aria-live="polite">
        <SideStat value={side} label={consumedMode ? 'Remaining' : 'Consumed'} />
        <div className="relative aspect-[8/6]">
          <svg viewBox="0 0 160 140" aria-hidden="true" className="absolute inset-0 size-full">
            <path
              d={ARC_PATH}
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="stroke-muted-foreground/25"
            />
            {goal && arc > 0 && (
              <path
                d={ARC_PATH}
                pathLength="100"
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${arc * 100} 100`}
                className="stroke-mf-tile-calories transition-[stroke-dasharray] duration-500"
              />
            )}
          </svg>
          <div
            className="absolute inset-x-0 -translate-y-1/2 text-center"
            style={{ top: CENTER_Y }}
          >
            <dd className="text-3xl font-semibold tabular-nums">{big ?? '—'}</dd>
            <dt className="text-muted-foreground text-sm">
              {consumedMode ? 'Consumed' : 'Remaining'}
            </dt>
          </div>
        </div>
        <SideStat value={goal} label="Target" />
      </dl>

      <div className="grid grid-cols-3 gap-4">
        {MACROS.map((macro) => {
          const progress = shownProgressOrUnknown(
            totals[macro.key],
            target ? macro.goal(target) : null,
            Math.round
          )
          const value = progress.consumed
          const macroGoal = progress.goal
          const macroShown =
            consumedMode || progress.remaining === null ? value : progress.remaining
          const ratio =
            macroGoal === null || value === null ? 0 : targetRatio(value, macroGoal).progress
          const fill =
            value === null ? 0 : consumedMode ? ratio : macroGoal === null ? 0 : 1 - ratio
          return (
            <div key={macro.key} className="space-y-1 text-center">
              <p className="text-muted-foreground text-sm">{macro.label}</p>
              <div className="bg-muted-foreground/25 h-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'motion-safe:animate-bar-grow h-full rounded-full transition-[width] duration-500',
                    macro.bar
                  )}
                  style={{ width: `${fill * 100}%` }}
                />
              </div>
              <p className="text-sm tabular-nums">
                {macroShown ?? '—'} / {macroGoal ?? '—'}g
              </p>
            </div>
          )
        })}
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
