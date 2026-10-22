import { StepHeading } from '@/features/onboarding/components/OnboardingPage'
import { DAY_OF_WEEK } from '@/config/enums'
import { KCAL_PER_GRAM } from '@/features/nutrition/atwater'
import { useUnits } from '@/features/users/hooks/use-units'
import type { EnergyUnit, Measure } from '@/lib/units'
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

/** Lệch giữa calo nhập và calo từ macro (gram × hệ số Atwater) quá ngưỡng này (tỉ lệ) thì cảnh báo. */
const MISMATCH_RATIO = 0.15

/** Lỗi của một ngày nhập tay: calo ngoài khoảng (khoảng nêu theo kcal / kJ của user; so sánh luôn theo kcal), hoặc gram âm. */
export const manualDayError = (
  day: ManualDay,
  kcalMin: number,
  kcalMax: number,
  energy: Measure<EnergyUnit>
) => {
  if (!(day.kcal >= kcalMin && day.kcal <= kcalMax))
    return `Enter between ${Math.round(energy.convert(kcalMin))} and ${Math.round(energy.convert(kcalMax))} ${energy.unit}`
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
  const { energy } = useUnits()
  const different = mode === 'different'
  const index = different ? selected : 0
  const day = days[index] ?? days[0]
  const chartDays = WEEK_DAYS.map((_, position) => {
    const item = different ? (days[position] ?? days[0]) : days[0]
    return { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG }
  })
  const kcalError = manualDayError(day, kcalMin, kcalMax, energy)
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
            value={energy.convert(day.kcal)}
            unit={energy.unit}
            error={kcalError ?? undefined}
            onChange={(shown) => onChange(index, { kcal: energy.revert(shown) })}
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
              ? `Your macros add up to ${energy.text(macroKcal)}, which is far from your ${energy.text(day.kcal)} target.`
              : `Macros add up to ${energy.text(macroKcal)} (${energy.format(KCAL_PER_GRAM.protein)} × protein + ${energy.format(KCAL_PER_GRAM.carbs)} × carbs + ${energy.format(KCAL_PER_GRAM.fat)} × fat).`}
          </p>
        </div>
      </div>
    </div>
  )
}
