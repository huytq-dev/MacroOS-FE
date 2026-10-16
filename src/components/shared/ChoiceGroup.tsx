'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export interface ChoiceOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
}

interface ChoiceGroupProps<T extends string> {
  readonly options: readonly ChoiceOption<T>[]
  readonly value: T
  readonly onValueChange: (value: T) => void
  readonly 'aria-label': string
  readonly columns?: 1 | 2
  readonly className?: string
}

/** Chọn một trong vài lựa chọn dạng thẻ (UI.md mục 7: `ToggleGroup type="single"`); bấm lại ô đang chọn không bỏ chọn. */
export function ChoiceGroup<T extends string>({
  options,
  value,
  onValueChange,
  columns = 1,
  className,
  ...aria
}: ChoiceGroupProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
      spacing={2}
      className={cn('grid w-full', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)}
      {...aria}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          variant="outline"
          className="data-[state=on]:border-primary data-[state=on]:bg-secondary h-auto min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-xl px-3.5 py-2.5 text-left whitespace-normal"
        >
          <span className="text-sm font-medium">{option.label}</span>
          {option.description && (
            <span className="text-muted-foreground text-[11px] font-normal">
              {option.description}
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
