'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChoiceSheet, type Choice } from './ChoiceSheet'

interface PickerSelectProps<T extends string> {
  readonly options: readonly Choice<T>[]
  readonly value: T
  readonly onValueChange: (value: T) => void
  /** Tiêu đề bảng chọn ("Select Unit", "Copy To Meal"…). */
  readonly title: string
  /** Ghi đè kiểu ô bấm (vd. ô đơn vị gọn trong hàng bảng dinh dưỡng). */
  readonly className?: string
  readonly id?: string
  readonly 'aria-label'?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
}

/**
 * Ô chọn kiểu app thay cho dropdown (UI.md mục 25): chạm mở bảng trượt từ đáy kiểu MacroFactor (`ChoiceSheet`: ✕, tiêu đề,
 * danh sách radio), chọn là áp dụng và đóng. Không dùng `ui/select` hay `<select>` gốc.
 */
export function PickerSelect<T extends string>({
  options,
  value,
  onValueChange,
  title,
  className,
  ...aria
}: PickerSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        {...aria}
        onClick={() => setOpen(true)}
        className={cn(
          'bg-secondary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:border-input flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-transparent px-3.5 text-left text-base transition-colors outline-none focus-visible:ring-1 aria-invalid:ring-1 md:h-8 md:rounded-md md:bg-transparent md:px-2.5 md:text-xs',
          className
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </button>
      <ChoiceSheet
        open={open}
        onOpenChange={setOpen}
        title={title}
        choices={options}
        value={value}
        onSelect={(next) => onValueChange(next as T)}
      />
    </>
  )
}
