'use client'

import { cn } from '@/lib/utils'

interface SlidingSwitchProps<T extends string> {
  readonly options: readonly {
    value: T
    label: React.ReactNode
    /** Bắt buộc khi `label` chỉ là biểu tượng. */
    ariaLabel?: string
  }[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly label: string
  readonly className?: string
  /** pill = viên thuốc nhỏ (mặc định); block = thanh phân đoạn rộng bằng khung, bo vuông, cao 44px (trang Create Food). */
  readonly variant?: 'pill' | 'block'
}

/** Công tắc phân đoạn: ô trắng chữ đen trượt 300ms (Snap | Describe, Plate | Day, Recipes | Foods | ♥). */
export function SlidingSwitch<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  variant = 'pill',
}: SlidingSwitchProps<T>) {
  const block = variant === 'block'
  const index = options.findIndex((option) => option.value === value)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={cn(
        'relative grid p-0.5',
        block ? 'w-full rounded-xl p-1' : 'w-fit rounded-full',
        className
      )}
    >
      <span
        aria-hidden="true"
        style={{
          width: `calc((100% - ${block ? '0.5rem' : '0.25rem'}) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
        className={cn(
          'bg-foreground absolute transition-transform duration-300 ease-out motion-reduce:transition-none',
          block ? 'inset-y-1 left-1 rounded-lg' : 'inset-y-0.5 left-0.5 rounded-full'
        )}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.ariaLabel}
          onClick={() => onChange(option.value)}
          className={cn(
            'focus-visible:ring-ring/50 relative z-10 flex items-center justify-center px-4 text-center transition-[color,transform] duration-300 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
            block ? 'h-11 rounded-lg text-base' : 'h-9 min-w-20 rounded-full text-sm',
            option.value === value ? 'text-background font-medium' : 'text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
