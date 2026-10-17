'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { ChoiceOption, OptionIcon } from '../../types/onboarding-options.types'

interface OptionCardProps {
  readonly label: string
  readonly description?: string
  readonly icon?: OptionIcon
  readonly selected: boolean
  readonly onSelect: () => void
  readonly index?: number
  readonly children?: React.ReactNode
}

/** Thẻ chọn một đáp án (radio): viền sáng khi chọn, chấm radio bật có chuyển động; vùng chạm ≥ 64px. */
export function OptionCard({
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  index = 0,
  children,
}: OptionCardProps) {
  return (
    <div
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 [animation-fill-mode:backwards]"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div
        className={cn(
          'rounded-2xl border-2 transition-colors duration-200',
          selected ? 'border-foreground bg-foreground/5' : 'border-border'
        )}
      >
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={onSelect}
          className="focus-visible:ring-ring/50 flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-transform focus-visible:ring-1 focus-visible:outline-none motion-safe:active:scale-[0.99]"
        >
          {Icon && <Icon aria-hidden="true" className="size-6 shrink-0" />}
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-snug font-medium">{label}</span>
            {description && (
              <span className="text-muted-foreground block text-sm leading-snug">
                {description}
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
              selected ? 'border-foreground bg-foreground' : 'border-muted-foreground/60'
            )}
          >
            <span
              className={cn(
                'bg-background size-2 rounded-full transition-transform duration-200',
                selected ? 'scale-100' : 'scale-0'
              )}
            />
          </span>
        </button>
        {children}
      </div>
    </div>
  )
}

interface OptionListProps<T extends string> {
  readonly options: readonly ChoiceOption<T>[]
  readonly value: T | null
  readonly onChange: (value: T) => void
  readonly ariaLabel: string
}

export function OptionList<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="space-y-3">
      {options.map((option, index) => (
        <OptionCard
          key={option.value}
          index={index}
          label={option.label}
          description={option.description}
          icon={option.icon}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  )
}

interface UnitToggleProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: readonly { readonly value: string; readonly label: string }[]
  readonly ariaLabel: string
}

/** Công tắc hai/ba đoạn dạng viên thuốc (kg/lb, cm/ft-in); không cho bỏ chọn khi bấm lại. */
export function UnitToggle({ value, onChange, options, ariaLabel }: UnitToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next)}
      aria-label={ariaLabel}
      className="bg-secondary mx-auto gap-0 rounded-full p-1"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="data-[state=on]:bg-foreground data-[state=on]:text-background h-10 rounded-full px-5 text-base transition-colors"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
