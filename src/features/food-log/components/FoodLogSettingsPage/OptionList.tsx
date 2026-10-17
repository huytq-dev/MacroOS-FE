import { cn } from '@/lib/utils'
import type { SettingChoice } from '../../food-log-settings'

interface OptionListProps {
  readonly label: string
  readonly options: readonly SettingChoice<string>[]
  readonly value: string
  readonly onChange: (value: string) => void
}

/** Danh sách chọn một nằm thẳng trên trang (không qua bảng trượt): tên + mô tả bên trái, vòng radio bên phải. */
export function OptionList({ label, options, value, onChange }: OptionListProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="active:bg-muted focus-visible:ring-ring/50 flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <span>
              <span className="block text-base">{option.label}</span>
              {option.description && (
                <span className="text-muted-foreground block text-sm">{option.description}</span>
              )}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-white bg-white' : 'border-zinc-600'
              )}
            >
              {selected && <span className="size-2 rounded-full bg-black" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
