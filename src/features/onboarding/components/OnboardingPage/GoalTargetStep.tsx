'use client'

import { TriangleAlert } from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatDateVi } from '@/lib/date'
import { StepHeading } from './ChoiceStep'
import { RulerSlider } from './RulerSlider'
import type { ProgramPreview } from '../../types/onboarding.types'

const MIN_RATE = 0.1
const MAX_RATE = 1
const STANDARD_RANGE = [0.35, 0.65] as const

const zoneOf = (rate: number) =>
  rate < STANDARD_RANGE[0]
    ? { label: 'Chậm hơn', standard: false }
    : rate <= STANDARD_RANGE[1]
      ? { label: 'Tiêu chuẩn (khuyến nghị)', standard: true }
      : { label: 'Nhanh hơn', standard: false }

interface GoalTargetStepProps {
  readonly goalType: 'WeightLoss' | 'WeightGain'
  readonly currentWeightKg: number
  readonly targetWeightKg: number
  readonly onTargetChange: (weightKg: number) => void
  readonly ratePercent: number
  readonly onRateChange: (percent: number) => void
  readonly preview: ProgramPreview | undefined
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
}: GoalTargetStepProps) {
  const losing = goalType === 'WeightLoss'
  const wrongWay = losing ? targetWeightKg >= currentWeightKg : targetWeightKg <= currentWeightKg
  const zone = zoneOf(ratePercent)
  const sign = losing ? '−' : '+'
  const perWeekKg = (currentWeightKg * ratePercent) / 100

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3" aria-live="polite">
        <div className="bg-mf-pastel-green text-mf-pastel-green-text rounded-2xl p-4">
          {preview ? (
            <p className="text-xl font-bold tabular-nums">{preview.averageCalories} kcal</p>
          ) : (
            <Skeleton className="h-7 w-24" />
          )}
          <p className="text-sm">ngân sách hằng ngày ban đầu</p>
        </div>
        <div className="bg-secondary rounded-2xl p-4">
          {preview ? (
            <p className="text-xl font-bold tabular-nums">
              {preview.projectedEndDate ? formatDateVi(preview.projectedEndDate) : '—'}
            </p>
          ) : (
            <Skeleton className="h-7 w-28" />
          )}
          <p className="text-muted-foreground text-sm">ngày dự kiến hoàn thành</p>
        </div>
      </div>

      <section aria-labelledby="target-heading">
        <StepHeading title="Cân nặng mục tiêu của bạn?" />
        <h2 id="target-heading" className="sr-only">
          Cân nặng mục tiêu
        </h2>
        <div className="mt-14">
          <RulerSlider
            ariaLabel="Cân nặng mục tiêu (kg)"
            unit="kg"
            min={30}
            max={300}
            value={targetWeightKg}
            highlightFrom={currentWeightKg}
            onChange={onTargetChange}
          />
        </div>
        {wrongWay && (
          <p
            role="alert"
            className="bg-destructive/15 text-destructive mt-4 flex items-center gap-3 rounded-2xl p-4 text-base"
          >
            <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
            {losing
              ? 'Cân mục tiêu cần thấp hơn cân hiện tại'
              : 'Cân mục tiêu cần cao hơn cân hiện tại'}
          </p>
        )}
      </section>

      <section aria-labelledby="rate-heading" className="space-y-5">
        <StepHeading title="Tốc độ mục tiêu của bạn?" />
        <h2 id="rate-heading" className="sr-only">
          Tốc độ thay đổi cân nặng
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
          aria-label="Tốc độ (% cân nặng mỗi tuần)"
          min={MIN_RATE}
          max={MAX_RATE}
          step={0.01}
          value={[ratePercent]}
          onValueChange={([next]) => onRateChange(Math.round(next * 100) / 100)}
          className="py-3"
        />
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-3 text-base tabular-nums">
          <span className="text-muted-foreground">Mỗi tuần</span>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {sign}
            {perWeekKg.toFixed(1)} <span className="text-muted-foreground">kg</span>
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
                  aria-label="Phần trăm cân nặng mỗi tuần"
                  value={ratePercent}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (next >= MIN_RATE && next <= 1.5) onRateChange(next)
                  }}
                  className="pr-14"
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                  % CN
                </span>
              </div>
            )}
          </FormField>
          <span className="text-muted-foreground">Mỗi tháng</span>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {sign}
            {(perWeekKg * 4).toFixed(1)} <span className="text-muted-foreground">kg</span>
          </p>
          <p className="border-border rounded-xl border px-3 py-2.5">
            {(ratePercent * 4).toFixed(2)} <span className="text-muted-foreground">% CN</span>
          </p>
        </div>
      </section>
    </div>
  )
}
