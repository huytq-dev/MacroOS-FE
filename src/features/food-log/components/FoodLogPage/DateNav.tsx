import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDaysIso, formatDateVi } from '@/lib/date'

interface DateNavProps {
  readonly date: string
  readonly today: string | null
  readonly onChange: (date: string) => void
}

/** Chuyển ngày: nút trước/sau (chạm 40px) + chạm giữa để mở picker ngày native. */
export function DateNav({ date, today, onChange }: DateNavProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="Ngày trước" onClick={() => onChange(addDaysIso(date, -1))}>
        <ChevronLeft />
      </Button>
      <label className="relative flex h-10 flex-1 items-center justify-center rounded-md border">
        <span className="text-sm font-semibold">
          {date === today ? 'Hôm nay · ' : ''}
          {formatDateVi(date)}
        </span>
        <input
          type="date"
          value={date}
          aria-label="Chọn ngày"
          onChange={(event) => event.target.value && onChange(event.target.value)}
          className="absolute inset-0 h-full w-full opacity-0"
        />
      </label>
      <Button variant="ghost" size="icon" aria-label="Ngày sau" onClick={() => onChange(addDaysIso(date, 1))}>
        <ChevronRight />
      </Button>
    </div>
  )
}
