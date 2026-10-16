'use client'

import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DayOfWeek } from '@/config/enums'
import { StepHeading } from './ChoiceStep'
import { OptionCard } from './OptionCard'
import { DISTRIBUTION_OPTIONS } from '../../types/onboarding-options.types'
import type { CalorieShiftMode } from '../../types/onboarding.types'

const DAYS: readonly { value: DayOfWeek; short: string; full: string }[] = [
  { value: 'Monday', short: 'T2', full: 'Thứ hai' },
  { value: 'Tuesday', short: 'T3', full: 'Thứ ba' },
  { value: 'Wednesday', short: 'T4', full: 'Thứ tư' },
  { value: 'Thursday', short: 'T5', full: 'Thứ năm' },
  { value: 'Friday', short: 'T6', full: 'Thứ sáu' },
  { value: 'Saturday', short: 'T7', full: 'Thứ bảy' },
  { value: 'Sunday', short: 'CN', full: 'Chủ nhật' },
]

interface DistributionStepProps {
  readonly mode: CalorieShiftMode
  readonly onModeChange: (mode: CalorieShiftMode) => void
  readonly days: readonly DayOfWeek[]
  readonly onDaysChange: (days: DayOfWeek[]) => void
  readonly percent: number
  readonly onPercentChange: (percent: number) => void
}

/** Chia kcal trong tuần: đều, hoặc dồn thêm vào các ngày chọn (tổng tuần giữ nguyên, các ngày còn lại giảm bù). */
export function DistributionStep({
  mode,
  onModeChange,
  days,
  onDaysChange,
  percent,
  onPercentChange,
}: DistributionStepProps) {
  const invalid = mode === 'Custom' && (days.length < 1 || days.length > 6)
  return (
    <div>
      <StepHeading title="Bạn muốn chia mục tiêu calo trong tuần thế nào?" />
      <div role="radiogroup" aria-label="Cách chia calo trong tuần" className="space-y-3">
        {DISTRIBUTION_OPTIONS.map((option, index) => (
          <OptionCard
            key={option.value}
            index={index}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={mode === option.value}
            onSelect={() => onModeChange(option.value)}
          >
            {option.value === 'Custom' && mode === 'Custom' && (
              <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:animation-duration-200 space-y-5 px-4 pt-1 pb-4">
                <div className="space-y-2">
                  <p className="text-base font-medium">Ngày ăn nhiều hơn</p>
                  <ToggleGroup
                    type="multiple"
                    value={[...days]}
                    onValueChange={(next) => onDaysChange(next as DayOfWeek[])}
                    aria-label="Ngày ăn nhiều hơn"
                    className="grid w-full grid-cols-7 gap-1.5"
                  >
                    {DAYS.map((day) => (
                      <ToggleGroupItem
                        key={day.value}
                        value={day.value}
                        aria-label={day.full}
                        className="border-border data-[state=on]:bg-foreground data-[state=on]:text-background h-11 min-w-0 rounded-xl border px-0 text-base"
                      >
                        {day.short}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {invalid && (
                    <p role="alert" className="text-destructive text-sm">
                      Chọn từ 1 đến 6 ngày.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-base font-medium">
                    Thêm <span className="tabular-nums">{percent}%</span> calo vào các ngày đó
                  </p>
                  <Slider
                    aria-label="Phần trăm calo thêm vào ngày chọn"
                    min={5}
                    max={30}
                    step={1}
                    value={[percent]}
                    onValueChange={([next]) => onPercentChange(next)}
                    className="py-2"
                  />
                </div>
              </div>
            )}
          </OptionCard>
        ))}
      </div>
    </div>
  )
}
