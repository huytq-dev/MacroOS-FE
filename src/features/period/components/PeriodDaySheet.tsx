'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatDate } from '@/lib/date'

interface PeriodDaySheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ngày đang xem (yyyy-MM-dd). Trang đặt `key` theo ngày + dữ liệu để công tắc lấy lại trạng thái. */
  readonly date: string
  /** Ngày này đã được đánh dấu hành kinh chưa (trạng thái ban đầu của công tắc). */
  readonly tracked: boolean
  readonly isPending: boolean
  /** Lỗi từ BE khi lưu. */
  readonly error: string | null
  readonly onSave: (isOnPeriod: boolean) => void
  /** Chỉ khi ngày đã được đánh dấu thì thùng rác bấm được (trang hỏi xác nhận); chưa đánh dấu thì thùng rác mờ như MacroFactor. */
  readonly onDelete?: () => void
}

/**
 * Bảng của một ngày trên lịch Period (kiểu MacroFactor): ✕ bên trái, ngày làm tiêu đề + phụ đề "Period", thùng rác bên phải (chỉ khi ngày
 * đã đánh dấu), công tắc "Are you on your period?" và nút Save trắng. Lưu gọi BE đặt cờ của đúng ngày đó.
 */
export function PeriodDaySheet({
  open,
  onOpenChange,
  date,
  tracked,
  isPending,
  error,
  onSave,
  onDelete,
}: PeriodDaySheetProps) {
  const [isOn, setIsOn] = useState(tracked)
  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={formatDate(date)}
      subtitle="Period"
      showDone={false}
      headerAction={
        <button
          type="button"
          aria-label="Delete period day"
          onClick={onDelete}
          disabled={!onDelete}
          className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-current">
            <path d="M9 3h6l1 1.5h4V7H4V4.5h4L9 3Zm-3.5 5h13l-1 12.2A2 2 0 0 1 15.5 22h-7a2 2 0 0 1-2-1.8L5.5 8Zm4 3v8h1.6v-8H9.5Zm3.4 0v8h1.6v-8h-1.6Z" />
          </svg>
        </button>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!isPending) onSave(isOn)
        }}
        className="space-y-5 px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <FormErrorAlert title="Couldn't save" message={error} />
        <label className="flex min-h-12 items-center justify-between gap-4 text-lg">
          Are you on your period?
          <Switch
            checked={isOn}
            onCheckedChange={setIsOn}
            aria-label="Are you on your period?"
            className="h-8! w-14! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-7! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[26px]!"
          />
        </label>
        <Button
          type="submit"
          className="bg-foreground text-background h-12 w-full rounded-lg text-base"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Save
        </Button>
      </form>
    </SheetFrame>
  )
}
