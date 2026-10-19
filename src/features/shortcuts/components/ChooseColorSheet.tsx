'use client'

import { Check, Trash2 } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { cn } from '@/lib/utils'
import { SHORTCUT_COLORS } from '../shortcuts.config'
import type { ShortcutColor } from '../types/shortcuts.types'

interface ChooseColorSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Màu đang dùng của shortcut (null = không màu). */
  readonly value: ShortcutColor | null
  readonly onSelect: (color: ShortcutColor | null) => void
}

/** Sheet "Choose Color": bảy màu (đỏ, cam, vàng, lục, xanh ngọc, xanh dương, tím) và nút thùng rác để bỏ màu; chọn là áp dụng và đóng. */
export function ChooseColorSheet({ open, onOpenChange, value, onSelect }: ChooseColorSheetProps) {
  const choose = (color: ShortcutColor | null) => {
    onSelect(color)
    onOpenChange(false)
  }
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Choose Color" showDone={false}>
      <div
        role="radiogroup"
        aria-label="Color"
        className="flex flex-wrap justify-center gap-4 px-4 py-6"
      >
        {SHORTCUT_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={value === color.value}
            aria-label={color.label}
            onClick={() => choose(color.value)}
            className={cn(
              'focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100',
              color.className
            )}
          >
            <Check
              aria-hidden="true"
              className={cn(
                'size-6 transition-[opacity,transform] duration-200',
                value === color.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              )}
            />
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          aria-label="No color"
          onClick={() => choose(null)}
          className="bg-secondary focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <Trash2 aria-hidden="true" className="size-6" />
        </button>
      </div>
    </SheetFrame>
  )
}
