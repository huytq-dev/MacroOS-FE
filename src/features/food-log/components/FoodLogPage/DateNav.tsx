import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/shared/IconButton'
import { addDaysIso, formatDateVi } from '@/lib/date'

interface DateNavProps {
  readonly date: string
  readonly today: string | null
  readonly onChange: (date: string) => void
}

/** Chuyển ngày: nút trước/sau + chạm giữa để mở picker ngày native. */
export function DateNav({ date, today, onChange }: DateNavProps) {
  return (
    <div className="flex items-center gap-1">
      <IconButton
        icon={ChevronLeft}
        label="Ngày trước"
        className="size-11 md:size-8"
        onClick={() => onChange(addDaysIso(date, -1))}
      />
      <label className="bg-secondary focus-within:ring-ring/50 relative flex h-11 flex-1 items-center justify-center rounded-xl focus-within:ring-3 md:h-8">
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
      <IconButton
        icon={ChevronRight}
        label="Ngày sau"
        className="size-11 md:size-8"
        onClick={() => onChange(addDaysIso(date, 1))}
      />
    </div>
  )
}
