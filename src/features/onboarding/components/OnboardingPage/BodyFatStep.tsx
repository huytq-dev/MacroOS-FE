'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepHeading } from './ChoiceStep'
import { BODY_FAT_BANDS } from '../../types/onboarding-options.types'
import type { BodyFatBand } from '../../types/onboarding.types'

/** Thân người đơn giản tự vẽ (không dùng ảnh của MacroFactor): eo rộng dần theo mức mỡ, mức thấp có đường cơ bụng. */
function Torso({ level }: { readonly level: number }) {
  const waist = 11 + level * 1.9
  const hip = 12 + level * 1.6
  const right = (half: number) => 40 + half
  const left = (half: number) => 40 - half
  const outline = `M${left(22)} 8 Q40 2 ${right(22)} 8 L${right(waist)} 52 Q${right(hip + 2)} 72 ${right(hip)} 94 L${left(hip)} 94 Q${left(hip + 2)} 72 ${left(waist)} 52 Z`
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" className="h-full w-full">
      <path d={outline} className="fill-muted-foreground/45" />
      <path
        d={`M${left(34)} 14 L${left(22)} 8 L${left(26)} 56 Z M${right(34)} 14 L${right(22)} 8 L${right(26)} 56 Z`}
        className="fill-muted-foreground/30"
      />
      {level < 3 && (
        <path
          d="M40 40 V84 M32 52 H48 M32 64 H48 M33 76 H47"
          className="stroke-background/50"
          strokeWidth="1.2"
          fill="none"
        />
      )}
      <path d="M26 6 Q40 14 54 6 L52 20 Q40 24 28 20 Z" className="fill-foreground/80" />
    </svg>
  )
}

interface BodyFatStepProps {
  readonly value: BodyFatBand | null
  readonly onChange: (band: BodyFatBand) => void
}

/** Chọn khoảng % mỡ bằng mắt (lưới 3×3, mỗi thẻ có thân người + nhãn khoảng); chọn rồi thẻ sáng viền kèm dấu tích. */
export function BodyFatStep({ value, onChange }: BodyFatStepProps) {
  return (
    <div>
      <StepHeading
        title="Tỉ lệ mỡ cơ thể của bạn?"
        subtitle="Ước lượng bằng mắt, không cần quá chính xác"
      />
      <div role="radiogroup" aria-label="Tỉ lệ mỡ cơ thể" className="grid grid-cols-3 gap-3">
        {BODY_FAT_BANDS.map((band, index) => {
          const selected = band.value === value
          return (
            <button
              key={band.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Tỉ lệ mỡ ${band.label}`}
              onClick={() => onChange(band.value)}
              className={cn(
                'focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-300 relative flex aspect-[3/4] flex-col items-center rounded-2xl border-2 px-2 pt-2 pb-6 transition-[border-color,background-color,transform] duration-200 [animation-fill-mode:backwards] focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-[0.97]',
                selected ? 'border-foreground bg-foreground/5' : 'border-border'
              )}
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <Torso level={index} />
              <span
                className={cn(
                  'absolute -bottom-3 flex items-center gap-1 rounded-lg border-2 px-2 py-0.5 text-sm font-medium tabular-nums transition-colors',
                  selected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card'
                )}
              >
                {selected && <Check aria-hidden="true" className="size-3.5" />}
                {band.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
