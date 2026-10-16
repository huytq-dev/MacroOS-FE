'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PickerSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string
  readonly doneLabel?: string
  readonly children: React.ReactNode
}

/** Bảng trượt lên từ đáy (điện thoại) / hộp thoại giữa (desktop) để sửa một giá trị; nút Xong đóng bảng. */
export function PickerSheet({
  open,
  onOpenChange,
  title,
  description,
  doneLabel = 'Xong',
  children,
}: PickerSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-sans text-lg font-bold">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        {children}
        <Button
          className="h-12 w-full text-base md:h-10 md:text-sm"
          onClick={() => onOpenChange(false)}
        >
          {doneLabel}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export interface PickerOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
}

interface OptionListProps<T extends string> {
  readonly options: readonly PickerOption<T>[]
  readonly value: T
  readonly onValueChange: (value: T) => void
  readonly 'aria-label': string
}

/** Danh sách chọn một: dòng đang chọn nền xám đậm chữ, có dấu chọn; chạm cả dòng để chọn. */
export function OptionList<T extends string>({
  options,
  value,
  onValueChange,
  ...aria
}: OptionListProps<T>) {
  return (
    <div role="radiogroup" className="space-y-1" {...aria}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'focus-visible:ring-ring/50 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none md:min-h-10 md:text-sm',
              selected ? 'bg-secondary font-semibold' : 'active:bg-muted'
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="text-muted-foreground block text-xs font-normal">
                  {option.description}
                </span>
              )}
            </span>
            {selected && <Check aria-hidden="true" className="size-5 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
