'use client'

import { useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { FoodLogNote } from '../../types/food-log.types'

const MAX_LENGTH = 1000

interface NoteSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ghi chú đang sửa; null = thêm mới. */
  readonly note: FoodLogNote | null
  /** Giờ gợi ý cho ghi chú mới (HH:mm). */
  readonly defaultTime: string
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (values: { text: string; notedAt: string | null }) => void
  readonly onDelete?: (note: FoodLogNote) => void
}

/**
 * Bảng thêm/sửa ghi chú của ngày: nội dung (tối đa 1000 ký tự) và giờ gắn với ghi chú. Sửa thì có thêm nút xoá.
 * Mount mới mỗi lần mở (parent chỉ render khi mở) nên state khởi tạo luôn từ ghi chú hiện tại.
 */
export function NoteSheet({
  open,
  onOpenChange,
  note,
  defaultTime,
  isPending,
  error,
  onSave,
  onDelete,
}: NoteSheetProps) {
  const [text, setText] = useState(note?.text ?? '')
  const [time, setTime] = useState(note?.notedAt?.slice(0, 5) ?? defaultTime)
  const canSave = text.trim().length > 0 && !isPending

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={note ? 'Edit Note' : 'Add Note'}
      showDone={false}
    >
      <form
        className="space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSave) onSave({ text: text.trim(), notedAt: time ? `${time}:00` : null })
        }}
      >
        <Textarea
          autoFocus
          aria-label="Note"
          placeholder="Write a note for this day"
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-32"
        />
        <label className="flex items-center justify-between gap-3 text-base">
          <span className="text-muted-foreground">Time</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="bg-secondary focus-visible:ring-ring/50 h-11 rounded-xl px-4 text-base focus-visible:ring-1 focus-visible:outline-none"
          />
        </label>
        <FormErrorAlert title="Couldn't save note" message={error} />
        <div className="flex gap-3">
          {note && onDelete && (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => onDelete(note)}
              className="h-12 flex-1 rounded-full text-base"
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={!canSave} className="h-12 flex-1 rounded-full text-base">
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </SheetFrame>
  )
}
