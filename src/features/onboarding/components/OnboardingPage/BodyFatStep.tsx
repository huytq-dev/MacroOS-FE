'use client'

import { Minus, Plus } from 'lucide-react'
import { StepHeading } from './ChoiceStep'
import { weightMeasure } from '@/lib/units'
import { Slider } from '@/components/ui/slider'
import type { UnitSystem } from '@/config/enums'
import { cn } from '@/lib/utils'
import { BODY_FAT_BANDS } from '../../types/onboarding-options.types'
import type { BodyFatBand } from '../../types/onboarding.types'

const MAX_LEVEL = BODY_FAT_BANDS.length - 1
const DEFAULT_LEVEL = 2
const THUMB_PX = 28

interface BodyFatStepProps {
  /** null = chưa chọn: bước này bỏ qua được, BE sẽ ước tính TDEE bằng công thức không cần tỉ lệ mỡ. */
  readonly value: BodyFatBand | null
  readonly onChange: (band: BodyFatBand) => void
  readonly weightKg: number
  readonly unit: UnitSystem
}

const stepButton =
  'bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40'

/**
 * Chọn % mỡ bằng thanh trượt chín mức (kèm nút −/+ 44px, mô tả ngắn và số kg mỡ/nạc
 * tính từ cân nặng đã nhập); chưa chạm vào thanh trượt thì coi như chưa chọn và nút ở đáy thành "Bỏ qua".
 */
export function BodyFatStep({ value, onChange, weightKg, unit }: BodyFatStepProps) {
  const found = BODY_FAT_BANDS.findIndex((band) => band.value === value)
  const level = found >= 0 ? found : DEFAULT_LEVEL
  const band = BODY_FAT_BANDS[level]
  const chosen = value !== null

  const select = (next: number) => {
    const target = BODY_FAT_BANDS[Math.min(MAX_LEVEL, Math.max(0, next))]
    if (!chosen || target.value !== band.value) onChange(target.value)
  }
  const mass = (kg: number) => weightMeasure(unit === 'Imperial' ? 'lb' : 'kg').text(kg, 0)
  const fatKg = (weightKg * band.midPercent) / 100

  return (
    <div>
      <StepHeading
        title="What is your body fat percentage?"
        subtitle="Drag the slider to the level closest to you"
      />
      <div className="mt-5 min-h-[4.5rem]" aria-live="polite">
        <p className="text-3xl font-semibold tabular-nums">
          {chosen ? band.label : 'Not selected'}
        </p>
        <p className="text-muted-foreground text-base leading-snug">
          {chosen ? band.description : 'Drag the slider, or skip if you are not sure.'}
        </p>
      </div>

      {chosen && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 mt-3 space-y-1.5">
          <div
            role="img"
            aria-label={`About ${mass(fatKg)} fat and ${mass(weightKg - fatKg)} lean`}
            className="bg-secondary h-2.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-foreground h-full rounded-full transition-[width] duration-300"
              style={{ width: `${band.midPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-base tabular-nums">
            At {mass(weightKg)}: about {mass(fatKg)} fat, {mass(weightKg - fatKg)} lean
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease one level"
          disabled={chosen && level === 0}
          onClick={() => select(chosen ? level - 1 : DEFAULT_LEVEL)}
          className={stepButton}
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <div className="relative flex-1 pb-3">
          <Slider
            aria-label="Body fat percentage"
            min={0}
            max={MAX_LEVEL}
            step={1}
            value={[level]}
            onValueChange={([next]) => select(next)}
            onValueCommit={([next]) => select(next)}
            className="min-h-11 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-track]]:h-2"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5">
            {BODY_FAT_BANDS.map((tick, index) => (
              <span
                key={tick.value}
                className={cn(
                  'absolute size-1.5 -translate-x-1/2 rounded-full transition-colors duration-200',
                  chosen && index <= level ? 'bg-foreground' : 'bg-border'
                )}
                style={{
                  left: `calc(${THUMB_PX / 2}px + (100% - ${THUMB_PX}px) * ${index / MAX_LEVEL})`,
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Increase one level"
          disabled={chosen && level === MAX_LEVEL}
          onClick={() => select(chosen ? level + 1 : DEFAULT_LEVEL)}
          className={stepButton}
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="text-muted-foreground mx-14 flex justify-between text-sm">
        <span>{BODY_FAT_BANDS[0].label}</span>
        <span>{BODY_FAT_BANDS[MAX_LEVEL].label}</span>
      </div>
    </div>
  )
}
