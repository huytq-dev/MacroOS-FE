'use client'

import { useRef, useState } from 'react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { hour12Label, type SettingChoice } from '../../food-log-settings'

interface ChoiceSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  /** Phụ đề mờ dưới tiêu đề bảng. */
  readonly subtitle?: string
  /** Hình minh hoạ phía trên danh sách (vd. dải tuần của Calendar Week Banner). */
  readonly preview?: React.ReactNode
  readonly choices: readonly SettingChoice<string>[]
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
                onOpenChange(false)
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

const LAST_HOUR = 23

interface HourRangeSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly value: { first: number; last: number }
  readonly onSave: (range: { first: number; last: number }) => void
}

type Handle = 'first' | 'last'

/** Quả bóng nhãn giờ ("7 AM") nằm trên tay cầm, có cuống nối xuống tay cầm. */
function HandleBubble({ hour }: { readonly hour: number }) {
  return (
    <span className="bg-foreground text-background absolute bottom-full left-1/2 mb-6 -translate-x-1/2 rounded-full px-4 py-2 text-lg whitespace-nowrap">
      {hour12Label(hour)}
      <span
        aria-hidden="true"
        className="bg-foreground absolute top-full left-1/2 h-6 w-1 -translate-x-1/2"
      />
    </span>
  )
}

/**
 * Bảng "Hour Range": thanh trượt hai tay cầm chọn giờ đầu/cuối của timeline (0–23, cách nhau ≥ 1 giờ), nhãn "7 AM" trên
 * mỗi tay cầm; kéo bằng tay hoặc phím mũi tên, nút Save mới áp dụng.
 */
export function HourRangeSheet({ open, onOpenChange, value, onSave }: HourRangeSheetProps) {
  const [range, setRange] = useState(value)
  const track = useRef<HTMLDivElement>(null)

  const move = (handle: Handle, hour: number) =>
    setRange((current) =>
      handle === 'first'
        ? { ...current, first: Math.max(0, Math.min(hour, current.last - 1)) }
        : { ...current, last: Math.min(LAST_HOUR, Math.max(hour, current.first + 1)) }
    )

  const drag = (handle: Handle) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const rect = track.current?.getBoundingClientRect()
    if (!rect || event.buttons === 0) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    move(handle, Math.round(ratio * LAST_HOUR))
  }

  const percent = (hour: number) => `${(hour / LAST_HOUR) * 100}%`

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Hour Range"
      subtitle="The default hours in your timeline"
      showDone={false}
    >
      <div className="px-8 pt-24 pb-8">
        <div ref={track} className="relative h-1 touch-none">
          <span aria-hidden="true" className="bg-foreground/30 absolute inset-0 rounded-full" />
          <span
            aria-hidden="true"
            style={{ left: percent(range.first), right: `calc(100% - ${percent(range.last)})` }}
            className="bg-foreground absolute inset-y-0"
          />
          {(['first', 'last'] as const).map((handle) => (
            <button
              key={handle}
              type="button"
              role="slider"
              aria-label={handle === 'first' ? 'First hour' : 'Last hour'}
              aria-valuemin={0}
              aria-valuemax={LAST_HOUR}
              aria-valuenow={range[handle]}
              aria-valuetext={hour12Label(range[handle])}
              onPointerDown={drag(handle)}
              onPointerMove={drag(handle)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
                  move(handle, range[handle] - 1)
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
                  move(handle, range[handle] + 1)
              }}
              style={{ left: percent(range[handle]) }}
              className="bg-foreground focus-visible:ring-ring/50 absolute top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full focus-visible:ring-4 focus-visible:outline-none active:cursor-grabbing"
            >
              <HandleBubble hour={range[handle]} />
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-6">
        <Button
          className="bg-foreground text-background hover:bg-foreground/90 h-14 w-full rounded-lg text-lg"
          onClick={() => {
            onSave(range)
            onOpenChange(false)
          }}
        >
          Save
        </Button>
      </div>
    </SheetFrame>
  )
}
