'use client'

import { useId, useState } from 'react'
import { Slider } from '@/components/ui/slider'

interface RangeFieldProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly unit: string
  readonly onChange: (value: number) => void
  /** Nhãn hai đầu thanh trượt (vd. "3.9 C/kg" – "0.9 F/kg"). */
  readonly endLabels?: readonly [string, string]
  readonly hint?: string
}

const decimalsOf = (step: number) => (step >= 1 ? 0 : (String(step).split('.')[1]?.length ?? 0))

/**
 * Ô chỉnh số kiểu MacroFactor: nhãn, ô nhập số bên phải, thanh trượt bên dưới, nhãn hai đầu và gợi ý khoảng cho phép. Kéo thanh hoặc
 * gõ số đều gọi `onChange` ngay (đã kẹp trong [min, max]) để biểu đồ đổi theo; khi đang gõ thì ô giữ đúng chữ user gõ.
 */
export function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  endLabels,
  hint,
}: RangeFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const decimals = decimalsOf(step)
  const clamped = Math.min(Math.max(value, min), max)

  return (
    <div className="bg-secondary space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-number`} className="text-lg font-medium">
          {label}
        </label>
        <div className="bg-background focus-within:ring-ring/50 flex h-11 w-32 items-center gap-2 rounded-lg px-3 transition-shadow focus-within:ring-1">
          <input
            id={`${id}-number`}
            type="number"
            inputMode="decimal"
            step={step}
            value={draft ?? clamped.toFixed(decimals)}
            onChange={(event) => {
              setDraft(event.target.value)
              const next = Number(event.target.value)
              if (event.target.value.trim() !== '' && Number.isFinite(next))
                onChange(Math.min(Math.max(next, min), max))
            }}
            onBlur={() => setDraft(null)}
            className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums outline-none"
          />
          <span className="text-muted-foreground text-base">{unit}</span>
        </div>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[clamped]}
        onValueChange={([next]) => {
          setDraft(null)
          onChange(next)
        }}
        className="py-3"
      />
      {endLabels && (
        <div
          className="text-muted-foreground flex justify-between text-sm tabular-nums"
          aria-live="polite"
        >
          <span>{endLabels[0]}</span>
          <span>{endLabels[1]}</span>
        </div>
      )}
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
    </div>
  )
}
