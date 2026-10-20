'use client'

import { CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/date'

interface DateFieldProps {
  /** Ngày dạng yyyy-MM-dd (BE nhận DateOnly), rỗng nếu chưa chọn. */
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly id?: string
  readonly autoComplete?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
}

/**
 * Ô ngày luôn hiện "Oct 20, 2026" (tiếng Anh): `<input type="date">` hiện theo ngôn ngữ máy nên chỉ làm lớp chọn
 * trong suốt phủ lên ô hiển thị, vẫn giữ picker native của iOS.
 */
export function DateField({ value, onValueChange, ...aria }: DateFieldProps) {
  return (
    <div className="relative">
      <Input
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        value={value ? formatDate(value) : ''}
        placeholder="Select date"
        className="pointer-events-none pr-9"
      />
      <CalendarDays
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
      <input
        {...aria}
        type="date"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  )
}
