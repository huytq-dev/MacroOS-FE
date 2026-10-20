'use client'

import { useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export const STEP_MAX = 300

interface StepSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Số thứ tự hiện trên tiêu đề ("Step 2"). */
  readonly number: number
  /** Nội dung đang sửa; rỗng = bước mới. */
  readonly initial: string
  readonly onSave: (text: string) => void
}

/**
 * Bảng "Step N" của Create Recipe (như MacroFactor): Description 0/300 và nút trắng Save. Mount mới mỗi lần mở (key ở cha) nên ô
 * luôn bắt đầu từ `initial`; Save chỉ bật khi có chữ.
 */
export function StepSheet({ open, onOpenChange, number, initial, onSave }: StepSheetProps) {
  const [text, setText] = useState(initial)
  const valid = text.trim().length > 0
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title={`Step ${number}`} showDone={false}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          onSave(text.trim())
          onOpenChange(false)
        }}
        className="space-y-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="recipe-step" className="text-lg">
              Description
            </label>
            <span className="text-muted-foreground text-base tabular-nums">
              {text.length}/{STEP_MAX}
            </span>
          </div>
          <Textarea
            id="recipe-step"
            autoFocus
            maxLength={STEP_MAX}
            rows={3}
            placeholder="Describe step"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="bg-secondary min-h-24 rounded-lg border-0 px-4 py-3 text-base shadow-none focus-visible:ring-1"
          />
        </div>
        <Button
          type="submit"
          disabled={!valid}
          className="h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
        >
          Save
        </Button>
      </form>
    </SheetFrame>
  )
}
