'use client'

import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { roundTo, type EnergyUnit, type Measure, type WeightUnit } from '@/lib/units'
import { StepHeading } from './ChoiceStep'
import { RulerSlider } from './RulerSlider'
import { BadgeAlert } from './SolidIcons'
import type { GoalPreview } from '../../types/onboarding.types'

/** Khoảng cân mục tiêu của thước (kg; lb là khoảng này đổi đúng, làm tròn vào trong). */
const MIN_WEIGHT_KG = 30
const MAX_WEIGHT_KG = 300
const MIN_RATE = 0.1
const MAX_RATE = 1
const STANDARD_RANGE = [0.35, 0.65] as const

const zoneOf = (rate: number) =>
  rate < STANDARD_RANGE[0]
    ? { label: 'Slower', standard: false }
    : rate <= STANDARD_RANGE[1]
      ? { label: 'Standard (Recommended)', standard: true }
      : { label: 'Faster', standard: false }

interface GoalTargetStepProps {
  /** Edit Goal truyền `goalType` của BE preview: 'Maintenance' (đích ≈ cân hiện tại) không có hướng sai và không có tốc độ để chỉnh. */
  readonly goalType: 'WeightLoss' | 'WeightGain' | 'Maintenance'
  readonly currentWeightKg: number
  readonly targetWeightKg: number
  readonly onTargetChange: (weightKg: number) => void
  readonly ratePercent: number
  readonly onRateChange: (percent: number) => void
  readonly preview: GoalPreview | undefined
  /** Đơn vị cân nặng và năng lượng hiển thị / nhập (onboarding: theo lựa chọn ở màn cân nặng; Edit Goal: theo hồ sơ). Các số trong props luôn là kg / kcal. */
  readonly weight: Measure<WeightUnit>
  readonly energy: Measure<EnergyUnit>
  /** Program Manual: không có ngân sách kcal tự động nên ẩn ô "initial daily budget" (chỉ còn ngày dự kiến). */
  readonly manual?: boolean
}

/** Màn đặt cân mục tiêu + tốc độ: thẻ trên cùng cập nhật trực tiếp ngân sách kcal và ngày dự kiến (từ API xem trước). */
export function GoalTargetStep({
  goalType,
  currentWeightKg,
  targetWeightKg,
  onTargetChange,
  ratePercent,
  onRateChange,
  preview,
  weight,
  energy,
  manual = false,
}: GoalTargetStepProps) {
  const losing = goalType === 'WeightLoss'
  const maintaining = goalType === 'Maintenance'
  const wrongWay =
    !maintaining && (losing ? targetWeightKg >= currentWeightKg : targetWeightKg <= currentWeightKg)
  const zone = zoneOf(ratePercent)
  const sign = maintaining ? '' : losing ? '−' : '+'
  const perWeekKg = (currentWeightKg * ratePercent) / 100

  return (
    <div className="space-y-8">
      <div className={cn('grid gap-3', manual ? 'grid-cols-1' : 'grid-cols-2')} aria-live="polite">
        {!manual && (
          <div className="bg-mf-pastel-green text-mf-pastel-green-text rounded-2xl p-4">
            {preview ? (
              <p className="text-xl font-bold tabular-nums">
                {preview.budgetKcal === null ? '—' : energy.text(preview.budgetKcal)}
              </p>
            ) : (
              <Skeleton className="h-7 w-24" />
            )}
            <p className="text-sm">initial daily budget</p>
          </div>
        )}
        <div className="bg-secondary rounded-2xl p-4">
          {preview ? (
            <p className="text-xl font-bold tabular-nums">
              {preview.projectedEndDate ? formatDate(preview.projectedEndDate) : '—'}
            </p>
          ) : (
            <Skeleton className="h-7 w-28" />
          )}
          <p className="text-muted-foreground text-sm">projected end date</p>
        </div>
      </div>

      <section aria-labelledby="target-heading">
        <StepHeading title="What is your target weight?" />
        <h2 id="target-heading" className="sr-only">
          Goal weight
        </h2>
        <div className="mt-14">
          <RulerSlider
            ariaLabel={`Goal weight (${weight.unit})`}
            unit={weight.unit}
            min={Math.ceil(weight.convert(MIN_WEIGHT_KG))}
            max={Math.floor(weight.convert(MAX_WEIGHT_KG))}
            value={roundTo(weight.convert(targetWeightKg), 1)}
            highlightFrom={weight.convert(currentWeightKg)}
            onChange={(shown) => onTargetChange(weight.revert(shown))}
          />
        </div>
        {wrongWay && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-3 rounded-2xl bg-red-950 p-4 text-base text-red-50"
          >
            <BadgeAlert className="size-5 shrink-0" />
            {losing
              ? 'Your goal weight must be lower than your current weight'
              : 'Your goal weight must be higher than your current weight'}
          </p>
        )}
      </section>

      <section aria-labelledby="rate-heading" className="space-y-5">
        <StepHeading title="What is your target goal rate?" />
        <h2 id="rate-heading" className="sr-only">
          Rate of weight change
        </h2>
        <p
          className={cn(
            'mx-auto w-fit rounded-xl px-4 py-2 text-base font-semibold transition-colors',
            zone.standard ? 'bg-mf-pastel-green text-mf-pastel-green-text' : 'bg-secondary'
          )}
        >
          {zone.label}
        </p>
        <Slider
          aria-label="Rate (% of body weight per week)"
          min={MIN_RATE}
          max={MAX_RATE}
          step={0.01}
          value={[ratePercent]}
          onValueChange={([next]) => onRateChange(Math.round(next * 100) / 100)}
          disabled={maintaining}
          className="py-3"
        />
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-3 text-base tabular-nums">
          <span className="text-muted-foreground">Per week</span>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {sign}
            {weight.format(perWeekKg)} <span className="text-muted-foreground">{weight.unit}</span>
          </p>
          <FormField label="">
            {(field) => (
              <div className="relative">
                <Input
                  {...field}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={MIN_RATE}
                  max={1.5}
                  aria-label="Percent of body weight per week"
                  disabled={maintaining}
                  value={ratePercent}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (next >= MIN_RATE && next <= 1.5) onRateChange(next)
                  }}
                  className="pr-14"
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                  % BW
                </span>
              </div>
            )}
          </FormField>
          <span className="text-muted-foreground">Per month</span>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {sign}
            {weight.format(perWeekKg * 4)}{' '}
            <span className="text-muted-foreground">{weight.unit}</span>
          </p>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {(ratePercent * 4).toFixed(2)} <span className="text-muted-foreground">% BW</span>
          </p>
        </div>
      </section>
    </div>
  )
}
