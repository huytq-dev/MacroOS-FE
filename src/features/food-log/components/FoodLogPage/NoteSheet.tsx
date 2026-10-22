'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Check, Loader2, Palette } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatWeekdayMonthDay } from '@/lib/week'
import { cn } from '@/lib/utils'
import {
  DEFAULT_NOTE_COLOR,
  NOTE_COLORS,
  NOTE_NAME_MAX,
  NOTE_TEXT_MAX,
  noteColorOf,
} from '../../notes.config'
import type { FoodLogNote, NoteColor } from '../../types/food-log.types'

/** Ô textarea tự giãn theo nội dung (không thanh cuộn riêng; cả sheet cuộn). */
const grow = (element: HTMLTextAreaElement) => {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

interface NoteSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ghi chú đang sửa; null = thêm mới. */
  readonly note: FoodLogNote | null
  /** Ngày của ghi chú (yyyy-MM-dd), hiện dưới tiêu đề. */
  readonly date: string
  /** Giờ gợi ý cho ghi chú mới (HH:mm). */
  readonly defaultTime: string
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (values: {
    name: string
    text: string
    color: NoteColor
    notedAt: string | null
  }) => void
  readonly onDelete?: (note: FoodLogNote) => void
}

/**
 * Bảng "New Note" / "Edit Note" kiểu MacroFactor: tên (tuỳ chọn), nội dung (bắt buộc, tự giãn, tối đa 1000 ký tự), giờ, bảng bảy màu mở ra
 * ngay dưới nút 🎨 và nút ✓ lưu (xám mờ khi chưa có nội dung hoặc chưa đổi gì, trắng khi lưu được). Đóng bằng X / vuốt / Back khi đã gõ dở thì hỏi
 * bỏ thay đổi. Enter ở ô tên nhảy xuống nội dung. Mount mới mỗi lần mở nên state khởi tạo luôn từ ghi chú hiện tại.
 */
export function NoteSheet({
  open,
  onOpenChange,
  note,
  date,
  defaultTime,
  isPending,
  error,
  onSave,
  onDelete,
}: NoteSheetProps) {
  const initial = {
    name: note?.name ?? '',
    color: note?.color ?? DEFAULT_NOTE_COLOR,
    text: note?.text ?? '',
    time: note?.notedAt?.slice(0, 5) ?? defaultTime,
  }
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState<NoteColor>(initial.color)
  const [text, setText] = useState(initial.text)
  const [time, setTime] = useState(initial.time)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const body = useRef<HTMLTextAreaElement>(null)
  // Ghi chú đang sửa: giãn ô nội dung theo chữ có sẵn ngay khi mở
  useLayoutEffect(() => {
    if (body.current) grow(body.current)
  }, [])

  const dirty =
    name !== initial.name ||
    color !== initial.color ||
    text !== initial.text ||
    time !== initial.time
  // Nội dung bắt buộc (BE), tên tuỳ chọn
  const canSave = text.trim().length > 0 && !isPending && (note === null || dirty)

  const requestClose = (next: boolean) => {
    if (!next && dirty && !isPending) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(next)
  }

  const save = () => {
    if (!canSave) return
    onSave({
      name: name.trim(),
      text: text.trim(),
      color,
      notedAt: time ? `${time}:00` : null,
    })
  }

  const palette = (
    <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Note color: ${noteColorOf(color).label}`}
          className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 relative flex size-11 items-center justify-center rounded-full transition-[background-color,transform] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
        >
          <Palette aria-hidden="true" className="size-5" />
          <span
            aria-hidden="true"
            className={cn(
              'ring-secondary absolute right-1.5 bottom-1.5 size-2.5 rounded-full ring-2 transition-colors duration-200',
              noteColorOf(color).dot
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="w-auto p-3"
      >
        <div role="radiogroup" aria-label="Note color" className="flex gap-2">
          {NOTE_COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={color === item.value}
              aria-label={item.label}
              onClick={() => {
                setColor(item.value)
                setPaletteOpen(false)
              }}
              className={cn(
                'focus-visible:ring-ring/50 relative flex size-9 shrink-0 items-center justify-center rounded-full transition-[transform,box-shadow] duration-150 before:absolute before:-inset-1 before:content-[""] focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100',
                item.dot,
                color === item.value && 'ring-foreground ring-offset-popover ring-2 ring-offset-2'
              )}
            >
              <Check
                aria-hidden="true"
                className={cn(
                  'text-background size-4 transition-[opacity,transform] duration-200',
                  color === item.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                )}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )

  const saveButton = (
    <button
      type="button"
      aria-label="Save note"
      disabled={!canSave}
      aria-busy={isPending}
      onClick={save}
      className={cn(
        'focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
        canSave
          ? 'bg-foreground text-background'
          : 'bg-secondary text-muted-foreground/50 cursor-not-allowed'
      )}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      ) : (
        <Check aria-hidden="true" className="size-6" />
      )}
    </button>
  )

  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={requestClose}
        title={note ? 'Edit Note' : 'New Note'}
        showDone={false}
        tall
        headerAction={
          <div className="flex items-center gap-2">
            {palette}
            {saveButton}
          </div>
        }
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
          className="space-y-4 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="text-muted-foreground flex items-center gap-3 text-base">
            <span>{formatWeekdayMonthDay(date)}</span>
            <label className="bg-secondary active:bg-foreground/20 text-foreground focus-within:ring-ring/50 relative flex h-9 items-center rounded-full px-3 tabular-nums transition-colors focus-within:ring-1">
              {time || '--:--'}
              <input
                type="time"
                aria-label="Note time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="absolute inset-0 h-full w-full opacity-0"
              />
            </label>
          </div>
          <input
            autoFocus
            aria-label="Note name"
            placeholder="Note Name"
            maxLength={NOTE_NAME_MAX}
            autoComplete="off"
            enterKeyHint="next"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
              event.preventDefault()
              body.current?.focus()
            }}
            className="placeholder:text-muted-foreground w-full bg-transparent text-xl font-semibold outline-none"
          />
          <textarea
            ref={body}
            aria-label="Note"
            placeholder="Write your note…"
            maxLength={NOTE_TEXT_MAX}
            rows={4}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              grow(event.target)
            }}
            className="placeholder:text-muted-foreground min-h-32 w-full resize-none bg-transparent text-base leading-relaxed outline-none"
          />
          <FormErrorAlert title="Couldn't save note" message={error} />
          {note && onDelete && (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => onDelete(note)}
              className="text-destructive h-12 w-full rounded-full text-base"
            >
              Delete note
            </Button>
          )}
        </form>
      </SheetFrame>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your note has changes that haven't been saved."
        confirmLabel="Discard"
        pendingLabel="Discarding..."
        isPending={false}
        onConfirm={() => {
          setDiscardOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
