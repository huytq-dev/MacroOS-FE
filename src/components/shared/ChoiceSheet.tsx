'use client'

import { useEffect, useRef } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { cn } from '@/lib/utils'

export interface Choice<T extends string = string> {
  readonly value: T
  readonly label: string
  readonly description?: string
}

/** Thời gian giữ bảng sau khi chọn trước khi trượt xuống, đủ để nhìn thấy lựa chọn mới. */
const CLOSE_DELAY_MS = 180

interface ChoiceSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  /** Phụ đề mờ dưới tiêu đề bảng. */
  readonly subtitle?: string
  /** Hình minh hoạ phía trên danh sách (vd. dải tuần của Calendar Week Banner). */
  readonly preview?: React.ReactNode
  readonly choices: readonly Choice[]
  readonly value: string
  /** Chọn xong thì đóng ngay (bảng chọn một, không có nút Done). */
  readonly onSelect: (value: string) => void
}

/** Bảng trượt từ đáy với danh sách chọn một (vòng tròn radio bên phải), chọn là áp dụng và đóng. */
export function ChoiceSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  preview,
  choices,
  value,
  onSelect,
}: ChoiceSheetProps) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    []
  )
  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={subtitle}
      showDone={false}
    >
      {preview}
      <div role="radiogroup" aria-label={title} className="pb-6">
        {choices.map((choice, index) => {
          const selected = choice.value === value
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onSelect(choice.value)
                // Chờ một nhịp để thấy vòng radio đổi sang lựa chọn mới rồi mới trượt xuống.
                if (closeTimer.current) clearTimeout(closeTimer.current)
                closeTimer.current = setTimeout(() => onOpenChange(false), CLOSE_DELAY_MS)
              }}
              className={cn(
                'focus-visible:ring-ring/50 mx-4 flex min-h-16 w-[calc(100%-2rem)] items-center justify-between gap-3 py-3 text-left focus-visible:ring-1 focus-visible:outline-none',
                index > 0 && 'border-border border-t'
              )}
            >
              <span>
                <span className="block text-base">{choice.label}</span>
                {choice.description && (
                  <span className="text-muted-foreground block text-sm">{choice.description}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-white bg-white' : 'border-zinc-600'
                )}
              >
                {selected && <span className="size-2 rounded-full bg-black" />}
              </span>
            </button>
          )
        })}
      </div>
    </SheetFrame>
  )
}
