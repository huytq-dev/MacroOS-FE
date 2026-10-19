import { StepHeading } from '@/features/onboarding/components/OnboardingPage'
import { DAY_OF_WEEK } from '@/config/enums'
import type { ManualDay } from '@/stores/program-wizard.store'
import { macroKcalOf, WEEK_DAYS } from '../../utils/day-macros'
import { WeekMacroChart } from '../ProgramPage/WeekMacroChart'
import { NumberField } from './NumberField'

interface ManualTargetsStepProps {
  /** `same`: một bộ dùng chung (days có 1 phần tử); `different`: bảy bộ. */
  readonly mode: 'same' | 'different'
  readonly days: readonly ManualDay[]
  readonly selected: number
  readonly onSelect: (index: number) => void
  readonly onChange: (index: number, patch: Partial<ManualDay>) => void
  readonly kcalMin: number
  readonly kcalMax: number
}

/** Lệch giữa calo nhập và calo từ macro (4P+4C+9F) quá ngưỡng này (tỉ lệ) thì cảnh báo. */
const MISMATCH_RATIO = 0.15

/** Lỗi của một ngày nhập tay: calo ngoài khoảng, hoặc gram âm. */
export const manualDayError = (day: ManualDay, kcalMin: number, kcalMax: number) => {
  if (!(day.kcal >= kcalMin && day.kcal <= kcalMax))
    return `Enter between ${Math.round(kcalMin)} and ${Math.round(kcalMax)} kcal`
  if (day.proteinG < 0 || day.carbsG < 0 || day.fatG < 0) return 'Macros cannot be negative'
  return null
}

/**
 * Nhập tay mục tiêu (Manual): biểu đồ bảy ngày (chọn ngày khi mỗi ngày một bộ) và bốn ô calo / protein / carb / fat. Chặn calo
 * ngoài khoảng BE cho phép; cảnh báo (không chặn) khi calo từ macro lệch xa calo đã nhập.
 */
export function ManualTargetsStep({
  mode,
  days,
  selected,
  onSelect,
  onChange,
  kcalMin,
  kcalMax,
}: ManualTargetsStepProps) {
  const different = mode === 'different'
  const index = different ? selected : 0
  const day = days[index] ?? days[0]
  const chartDays = WEEK_DAYS.map((_, position) => {
    const item = different ? (days[position] ?? days[0]) : days[0]
    return { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG }
  })
  const kcalError = manualDayError(day, kcalMin, kcalMax)
  const macroKcal = macroKcalOf(day)
  const mismatch = day.kcal > 0 && Math.abs(macroKcal - day.kcal) / day.kcal > MISMATCH_RATIO

  return (
    <div>
      <StepHeading
        title={different ? 'Set your daily targets' : 'Set your targets'}
        subtitle={
          different
            ? 'Pick a day and enter its Calorie and macro targets.'
            : 'These targets apply to every day of the week.'
        }
      />
      <div className="space-y-5">
        <WeekMacroChart
          days={chartDays}
          selected={different ? selected : undefined}
          onSelect={different ? onSelect : undefined}
          chartClassName="h-48"
        />
        <div
          key={index}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 space-y-3"
        >
          {different && <h2 className="text-xl font-bold">{DAY_OF_WEEK[WEEK_DAYS[index]]}</h2>}
          <NumberField
            label="Calories"
            value={day.kcal}
            unit="kcal"
            error={kcalError ?? undefined}
            onChange={(kcal) => onChange(index, { kcal })}
          />
          <NumberField
            label="Protein"
            value={day.proteinG}
            unit="g"
            onChange={(proteinG) => onChange(index, { proteinG })}
          />
          <NumberField
            label="Carbs"
            value={day.carbsG}
            unit="g"
            onChange={(carbsG) => onChange(index, { carbsG })}
          />
          <NumberField
            label="Fat"
            value={day.fatG}
            unit="g"
            onChange={(fatG) => onChange(index, { fatG })}
          />
          <p
            className={
              mismatch
                ? 'rounded-xl bg-[var(--mf-warning-bg)] px-4 py-3 text-base text-black/80'
                : 'text-muted-foreground px-1 text-sm'
            }
            aria-live="polite"
          >
            {mismatch
              ? `Your macros add up to ${Math.round(macroKcal)} kcal, which is far from your ${Math.round(day.kcal)} kcal target.`
              : `Macros add up to ${Math.round(macroKcal)} kcal (4 × protein + 4 × carbs + 9 × fat).`}
          </p>
        </div>
      </div>
    </div>
  )
}
