'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OptionList, PickerSheet, type PickerOption } from './PickerSheet'

interface PickerSelectProps<T extends string> {
  readonly options: readonly PickerOption<T>[]
  readonly value: T
  readonly onValueChange: (value: T) => void
  readonly title: string
  readonly id?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
}

/** Ô chọn kiểu app (UI.md mục 25): chạm mở bảng trượt từ đáy, chọn xong tự đóng. */
export function PickerSelect<T extends string>({
  options,
  value,
  onValueChange,
  title,
  ...aria
}: PickerSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <>
      <button
        type="button"
        {...aria}
        onClick={() => setOpen(true)}
        className={cn(
          'bg-secondary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:border-input flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-transparent px-3.5 text-left text-base transition-colors outline-none focus-visible:ring-1 aria-invalid:ring-1 md:h-8 md:rounded-md md:bg-transparent md:px-2.5 md:text-xs'
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </button>
      <PickerSheet open={open} onOpenChange={setOpen} title={title}>
        <OptionList
          aria-label={title}
          options={options}
          value={value}
          onValueChange={(next) => {
            onValueChange(next)
            setOpen(false)
          }}
        />
      </PickerSheet>
    </>
  )
}
