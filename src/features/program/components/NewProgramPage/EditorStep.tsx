import { Lock, LockOpen, RotateCcw } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { StepHeading } from '@/features/onboarding/components/OnboardingPage'
import { Skeleton } from '@/components/ui/skeleton'
import { DAY_OF_WEEK } from '@/config/enums'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'
import { macrosOf, maxProteinPerKg, type DayParams, type EditableDay } from '../../utils/day-macros'
import { WeekMacroChart } from '../ProgramPage/WeekMacroChart'
import { NumberField } from './NumberField'
import { RangeField } from './RangeField'

interface EditorStepProps {
  /** Bảy ngày đang chỉnh; null = đang lấy số đề xuất từ BE. */
  readonly days: readonly EditableDay[] | null
  readonly weightKg: number
  readonly kcalMax: number
  readonly proteinPerKgMax: number
  readonly selected: number
  readonly onSelect: (index: number) => void
  readonly onChange: (index: number, patch: Partial<DayParams & { locked: boolean }>) => void
  readonly onResetAll: () => void
  readonly error: string | null
  readonly onRetry: () => void
}

const CHIP =
  'bg-secondary active:bg-muted focus-visible:ring-ring/50 inline-flex h-11 items-center gap-2 rounded-full px-4 text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100'

/**
 * Editor mục tiêu theo ngày (Collaborative): biểu đồ bảy ngày, pill chọn ngày, rồi calo / protein (g/kg) / tỉ lệ carb:fat của ngày
 * đang chọn. Gram macro tính tại chỗ từ ba thông số nên kéo thanh trượt là các khối P/F/C và viên calo đổi chiều cao mượt ngay,
 * không gọi BE. Sửa ngày nào chỉ đổi ngày đó; Reset All Days đưa bảy ngày (trừ ngày khoá) về số BE đề xuất.
 */
export function EditorStep({
  days,
  weightKg,
  kcalMax,
  proteinPerKgMax,
  selected,
  onSelect,
  onChange,
  onResetAll,
  error,
  onRetry,
}: EditorStepProps) {
  // Ô calo nhập / hiện theo kcal hoặc kJ của user; trạng thái và BE vẫn là kcal
  const { energy } = useUnits()
  const day = days?.[selected]
  const chartDays = days?.map((item) => ({
    kcal: item.kcal,
    ...macrosOf(item, weightKg),
    locked: item.locked,
  }))
  const macros = day ? macrosOf(day, weightKg) : null
  const proteinMax = day
    ? Math.floor(maxProteinPerKg(day.kcal, weightKg, proteinPerKgMax) * 10) / 10
    : 0

  return (
    <div>
      <StepHeading
        title="Daily targets"
        subtitle="Pick a day and adjust it. Changes only apply to the day you're editing."
      />
      {error ? (
        <div className="space-y-3">
          <FormErrorAlert title="Couldn't load your targets" message={error} />
          <button type="button" onClick={onRetry} className={CHIP}>
            <RotateCcw aria-hidden="true" className="size-5" />
            Try again
          </button>
        </div>
      ) : !days || !chartDays || !day || !macros ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          <WeekMacroChart
            days={chartDays}
            selected={selected}
            onSelect={onSelect}
            chartClassName="h-56"
          />

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" aria-live="polite">
              {DAY_OF_WEEK[day.dayOfWeek]}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onResetAll} className={CHIP}>
                <RotateCcw aria-hidden="true" className="size-5" />
                Reset All Days
              </button>
              <button
                type="button"
                aria-pressed={day.locked}
                aria-label={day.locked ? 'Unlock this day' : 'Lock this day'}
                onClick={() => onChange(selected, { locked: !day.locked })}
                className={cn(
                  CHIP,
                  'size-11 justify-center px-0',
                  day.locked && 'bg-foreground text-background'
                )}
              >
                {day.locked ? (
                  <Lock aria-hidden="true" className="size-5" />
                ) : (
                  <LockOpen aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div
            key={selected}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 space-y-3"
          >
            <NumberField
              label="Calorie targets"
              value={energy.convert(day.kcal)}
              unit={energy.unit}
              hint={`Set between 0 and ${Math.round(energy.convert(kcalMax))} ${energy.unit}`}
              onChange={(shown) => {
                const next = Math.min(Math.max(energy.revert(shown), 0), kcalMax)
                onChange(selected, {
                  kcal: next,
                  proteinPerKg: Math.min(
                    day.proteinPerKg,
                    maxProteinPerKg(next, weightKg, proteinPerKgMax)
                  ),
                })
              }}
            />
            <RangeField
              label="Protein"
              value={Math.min(day.proteinPerKg, proteinMax)}
              min={0}
              max={proteinMax}
              step={0.1}
              unit="g/kg"
              hint={`Set between 0.0 and ${proteinMax.toFixed(1)} g per kilogram of body weight`}
              onChange={(proteinPerKg) => onChange(selected, { proteinPerKg })}
            />
            <RangeField
              label="Carb to Fat Ratio"
              value={Math.round(day.carbPct * 100)}
              min={0}
              max={100}
              step={1}
              unit="%"
              endLabels={[
                `${(macros.carbsG / weightKg).toFixed(1)} C/kg`,
                `${(macros.fatG / weightKg).toFixed(1)} F/kg`,
              ]}
              hint="Set carbs as a portion of the remaining calories"
              onChange={(percent) => onChange(selected, { carbPct: percent / 100 })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
