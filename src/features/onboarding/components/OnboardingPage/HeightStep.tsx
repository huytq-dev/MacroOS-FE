'use client'

import { useMemo } from 'react'
import type { UnitSystem } from '@/config/enums'
import { StepHeading } from './ChoiceStep'
import { UnitToggle } from './OptionCard'
import { WheelPicker } from './WheelPicker'

const CM_PER_INCH = 2.54
const MIN_CM = 100
const MAX_CM = 250

const METRIC_ITEMS = Array.from({ length: MAX_CM - MIN_CM + 1 }, (_, index) => ({
  value: MIN_CM + index,
  label: `${MIN_CM + index} cm`,
}))

const MIN_INCH = Math.ceil(MIN_CM / CM_PER_INCH)
const MAX_INCH = Math.floor(MAX_CM / CM_PER_INCH)
const IMPERIAL_ITEMS = Array.from({ length: MAX_INCH - MIN_INCH + 1 }, (_, index) => {
  const inches = MIN_INCH + index
  return { value: inches, label: `${Math.floor(inches / 12)} ft ${inches % 12} in` }
})

interface HeightStepProps {
  readonly heightCm: number
  readonly unit: UnitSystem
  readonly onChange: (heightCm: number) => void
  readonly onUnitChange: (unit: UnitSystem) => void
}

/** Chiều cao bằng bánh xe; đổi đơn vị cm ↔ ft/in giữ nguyên chiều cao (lưu BE luôn là cm). */
export function HeightStep({ heightCm, unit, onChange, onUnitChange }: HeightStepProps) {
  const inches = Math.min(MAX_INCH, Math.max(MIN_INCH, Math.round(heightCm / CM_PER_INCH)))
  const items = useMemo(() => (unit === 'Metric' ? METRIC_ITEMS : IMPERIAL_ITEMS), [unit])

  return (
    <div>
      <StepHeading title="Chiều cao của bạn?" />
      <UnitToggle
        ariaLabel="Đơn vị chiều cao"
        value={unit}
        onChange={(next) => onUnitChange(next as UnitSystem)}
        options={[
          { value: 'Imperial', label: 'Feet và inch' },
          { value: 'Metric', label: 'Centimet' },
        ]}
      />
      <div className="mt-6">
        {unit === 'Metric' ? (
          <WheelPicker
            items={METRIC_ITEMS}
            value={Math.round(heightCm)}
            onChange={onChange}
            ariaLabel="Chiều cao (cm)"
          />
        ) : (
          <WheelPicker
            items={items}
            value={inches}
            onChange={(next) => onChange(Math.round(next * CM_PER_INCH))}
            ariaLabel="Chiều cao (feet và inch)"
          />
        )}
      </div>
    </div>
  )
}
