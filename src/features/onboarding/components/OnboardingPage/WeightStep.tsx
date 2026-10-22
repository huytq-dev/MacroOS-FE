'use client'

import type { UnitSystem } from '@/config/enums'
import { roundTo, weightMeasure } from '@/lib/units'
import { StepHeading } from './ChoiceStep'
import { UnitToggle } from './OptionCard'
import { RulerSlider } from './RulerSlider'

const MIN_KG = 30
const MAX_KG = 300
const LB = weightMeasure('lb')

interface WeightStepProps {
  readonly weightKg: number
  readonly unit: UnitSystem
  readonly onChange: (weightKg: number) => void
  readonly onUnitChange: (unit: UnitSystem) => void
}

/**
 * Cân nặng hiện tại bằng thước kéo; hiển thị kg hoặc lb, lưu kg (làm lần cân đầu tiên và trend khởi điểm). Số lb trên thước đổi sang kg
 * ĐÚNG (hằng số chung `LB_PER_KG`), không làm tròn 0.1 kg trước khi lưu; chỉ khi gửi BE mới làm tròn 2 chữ số.
 */
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
            min={Math.ceil(LB.convert(MIN_KG))}
            max={Math.floor(LB.convert(MAX_KG))}
            value={roundTo(LB.convert(weightKg), 1)}
            onChange={(lb) => onChange(LB.revert(lb))}
          />
        ) : (
          <RulerSlider
            ariaLabel="Weight (kg)"
            unit="kg"
            min={MIN_KG}
            max={MAX_KG}
            value={roundTo(weightKg, 1)}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  )
}
