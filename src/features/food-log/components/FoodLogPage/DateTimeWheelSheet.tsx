'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { WheelPicker, type WheelItem } from '@/components/shared/WheelPicker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addDaysIso } from '@/lib/date'
import { formatWeekdayMonthDay } from '@/lib/week'

/** Số ngày hiện được ở mỗi phía quanh ngày gốc của bánh xe ngày. */
const DAY_SPAN = 60

const pad = (value: number) => String(value).padStart(2, '0')
const HOURS: readonly WheelItem<string>[] = Array.from({ length: 24 }, (_, hour) => ({
  value: `${pad(hour)}:00`,
  label: `${pad(hour)}:00`,
}))
const HOUR_NUMBERS: readonly WheelItem<string>[] = Array.from({ length: 24 }, (_, hour) => ({
  value: pad(hour),
  label: pad(hour),
}))
const MINUTES: readonly WheelItem<string>[] = Array.from({ length: 60 }, (_, minute) => ({
  value: pad(minute),
  label: pad(minute),
}))

interface DateTimeWheelSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** datetime = bánh xe ngày + giờ (To Date & Time); time = bánh xe HH : mm (Modify Timestamp). */
  readonly kind: 'datetime' | 'time'
  /** Ngày hiện tại của bánh xe ngày (yyyy-MM-dd) và giờ gốc (HH:mm). */
  readonly date: string
  readonly time: string
  readonly confirmLabel: string
  readonly isPending: boolean
  readonly onConfirm: (date: string, time: string) => void
}

/**
 * Bảng đáy chọn ngày + giờ hoặc giờ + phút kiểu MacroFactor (hai bánh xe iOS, nút trắng "Paste to Date and Time" / "Done" và
 * "Cancel"). Không có thanh tiêu đề; mở / đóng trượt 300ms. Mount mới mỗi lần mở (parent chỉ render khi mở).
 */
export function DateTimeWheelSheet({
  open,
  onOpenChange,
  kind,
  date,
  time,
  confirmLabel,
  isPending,
  onConfirm,
}: DateTimeWheelSheetProps) {
  const [day, setDay] = useState(date)
  const [hour, setHour] = useState(kind === 'time' ? time.slice(0, 2) : `${time.slice(0, 2)}:00`)
  const [minute, setMinute] = useState(time.slice(3, 5))
  const days: readonly WheelItem<string>[] = Array.from(
    { length: DAY_SPAN * 2 + 1 },
    (_, index) => {
      const iso = addDaysIso(date, index - DAY_SPAN)
      return { value: iso, label: formatWeekdayMonthDay(iso) }
    }
  )
  // To Date & Time chỉ chọn giờ tròn: giữ phút gốc nếu người dùng không đổi giờ
  const chosenTime =
    kind === 'time' ? `${hour}:${minute}` : hour === `${time.slice(0, 2)}:00` ? time : hour

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-0 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{kind === 'time' ? 'Select time' : 'Select date and time'}</DialogTitle>
          <DialogDescription>Scroll the wheels, then confirm</DialogDescription>
        </DialogHeader>
        <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-center gap-4">
            {kind === 'datetime' ? (
              <>
                <WheelPicker
                  items={days}
                  value={day}
                  onChange={setDay}
                  ariaLabel="Date"
                  className="w-48 shrink-0"
                />
                <WheelPicker
                  items={HOURS}
                  value={hour}
                  onChange={setHour}
                  ariaLabel="Hour"
                  className="w-24 shrink-0"
                />
              </>
            ) : (
              <>
                <WheelPicker
                  items={HOUR_NUMBERS}
                  value={hour}
                  onChange={setHour}
                  ariaLabel="Hour"
                  className="w-20 shrink-0"
                />
                <span aria-hidden="true" className="text-xl font-medium">
                  :
                </span>
                <WheelPicker
                  items={MINUTES}
                  value={minute}
                  onChange={setMinute}
                  ariaLabel="Minute"
                  className="w-20 shrink-0"
                />
              </>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <Button
              className="bg-foreground text-background h-14 w-full rounded-lg text-base"
              disabled={isPending}
              aria-busy={isPending}
              onClick={() => onConfirm(day, chosenTime)}
            >
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {confirmLabel}
            </Button>
            <Button
              variant="ghost"
              className="h-12 w-full text-base"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
