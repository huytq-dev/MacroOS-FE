'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { WheelPicker, type WheelItem } from '@/components/shared/WheelPicker'
import { Button } from '@/components/ui/button'
import { addDaysIso } from '@/lib/date'
import { relativeDayLabel } from '@/lib/week'

/** Số ngày hiện được ở mỗi phía quanh ngày đang chọn. */
const DAY_SPAN = 45

const HOURS: readonly WheelItem<string>[] = Array.from({ length: 24 }, (_, hour) => {
  const label = `${String(hour).padStart(2, '0')}:00`
  return { value: label, label }
})

interface DateTimeSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Hôm nay (yyyy-MM-dd): để gọi Yesterday / Today / Tomorrow. */
  readonly today: string
  /** Ngày và giờ (HH:mm) đang chọn lúc mở bảng. */
  readonly date: string
  readonly time: string
  /** Có món trong plate thì "Log to Date and Time" mới dùng được. */
  readonly canLog: boolean
  readonly isLogging: boolean
  /** Chọn ngày giờ cho lần ghi (chưa ghi). */
  readonly onSelect: (date: string, time: string) => void
  /** Chọn ngày giờ rồi ghi luôn plate vào đó. */
  readonly onLog: (date: string, time: string) => void
  /** Chỉ chọn giờ (sửa món đã log: không đổi được ngày): ẩn bánh xe ngày và nút "Log to Date and Time". */
  readonly timeOnly?: boolean
}

/**
 * Bảng "Select Date and Time" (kiểu MacroFactor): hai bánh xe ngày + giờ, nút Select (chỉ đổi giờ ghi), Log (đổi rồi ghi plate)
 * và Cancel. Phút của giờ đang chọn được giữ nếu người dùng không đổi giờ (12:47 vẫn là 12:47).
 */
export function DateTimeSheet({
  open,
  onOpenChange,
  today,
  date,
  time,
  canLog,
  isLogging,
  onSelect,
  onLog,
  timeOnly = false,
}: DateTimeSheetProps) {
  const [day, setDay] = useState(date)
  const [hour, setHour] = useState(`${time.slice(0, 2)}:00`)
  const days: readonly WheelItem<string>[] = Array.from(
    { length: DAY_SPAN * 2 + 1 },
    (_, index) => {
      const iso = addDaysIso(date, index - DAY_SPAN)
      return { value: iso, label: relativeDayLabel(iso, today) }
    }
  )
  // Giữ phút gốc khi giờ không đổi, đổi giờ thì về đầu giờ
  const chosenTime = hour === `${time.slice(0, 2)}:00` ? time : hour

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={timeOnly ? 'Select Time' : 'Select Date and Time'}
      showDone={false}
    >
      <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-center gap-6">
          {!timeOnly && (
            <WheelPicker
              items={days}
              value={day}
              onChange={setDay}
              ariaLabel="Date"
              className="w-44 shrink-0"
            />
          )}
          <WheelPicker
            items={HOURS}
            value={hour}
            onChange={setHour}
            ariaLabel="Hour"
            className="w-24 shrink-0"
          />
        </div>
        <div className="mt-4 space-y-3">
          <Button
            variant="secondary"
            className="h-14 w-full rounded-lg text-base"
            disabled={isLogging}
            onClick={() => {
              onSelect(day, chosenTime)
              onOpenChange(false)
            }}
          >
            {timeOnly ? 'Select Time' : 'Select Date and Time'}
          </Button>
          {!timeOnly && (
            <Button
              className="bg-foreground text-background h-14 w-full rounded-lg text-base"
              disabled={!canLog || isLogging}
              aria-busy={isLogging}
              onClick={() => onLog(day, chosenTime)}
            >
              {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              Log to Date and Time
            </Button>
          )}
          <Button
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={isLogging}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </SheetFrame>
  )
}
