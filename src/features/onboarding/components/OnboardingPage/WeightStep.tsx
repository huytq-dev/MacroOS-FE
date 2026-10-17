'use client'

import type { UnitSystem } from '@/config/enums'
import { StepHeading } from './ChoiceStep'
import { UnitToggle } from './OptionCard'
import { RulerSlider } from './RulerSlider'

export const LB_PER_KG = 2.20462

const MIN_KG = 30
const MAX_KG = 300

interface WeightStepProps {
  readonly weightKg: number
  readonly unit: UnitSystem
  readonly onChange: (weightKg: number) => void
  readonly onUnitChange: (unit: UnitSystem) => void
}

/** Cân nặng hiện tại bằng thước kéo; hiển thị kg hoặc lb, lưu kg (làm lần cân đầu tiên và trend khởi điểm). */
export function WeightStep({ weightKg, unit, onChange, onUnitChange }: WeightStepProps) {
  const imperial = unit === 'Imperial'
  return (
    <div>
      <StepHeading title="What is your weight?" />
      <UnitToggle
        ariaLabel="Weight unit"
        value={unit}
        onChange={(next) => onUnitChange(next as UnitSystem)}
        options={[
          { value: 'Imperial', label: 'Pounds' },
          { value: 'Metric', label: 'Kilograms' },
        ]}
      />
      <div className="mt-24">
        {imperial ? (
          <RulerSlider
            ariaLabel="Weight (lb)"
            unit="lb"
            min={Math.round(MIN_KG * LB_PER_KG)}
            max={Math.round(MAX_KG * LB_PER_KG)}
            value={Math.round(weightKg * LB_PER_KG * 10) / 10}
            onChange={(lb) => onChange(Math.round((lb / LB_PER_KG) * 10) / 10)}
          />
        ) : (
          <RulerSlider
            ariaLabel="Weight (kg)"
            unit="kg"
            min={MIN_KG}
            max={MAX_KG}
            value={weightKg}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  )
}
