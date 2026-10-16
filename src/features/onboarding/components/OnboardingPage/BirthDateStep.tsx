'use client'

import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { StepHeading } from './ChoiceStep'
import { WheelPicker } from './WheelPicker'
import { ageOn } from '../../onboarding.utils'

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `Tháng ${index + 1}`,
}))

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
const toIso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

interface BirthDateStepProps {
  readonly value: string
  readonly today: string
  readonly onChange: (iso: string) => void
}

/** Ngày sinh bằng ba bánh xe tháng/ngày/năm; dưới 18 tuổi hiện cảnh báo đỏ và khoá nút tiếp (luật như MacroFactor). */
export function BirthDateStep({ value, today, onChange }: BirthDateStepProps) {
  const [year, month, day] = value.split('-').map(Number)
  const thisYear = Number(today.slice(0, 4))
  const years = useMemo(
    () =>
      Array.from({ length: 101 }, (_, index) => ({
        value: thisYear - 100 + index,
        label: String(thisYear - 100 + index),
      })),
    [thisYear]
  )
  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth(year, month) }, (_, index) => ({
        value: index + 1,
        label: String(index + 1),
      })),
    [year, month]
  )

  const update = (nextYear: number, nextMonth: number, nextDay: number) =>
    onChange(toIso(nextYear, nextMonth, Math.min(nextDay, daysInMonth(nextYear, nextMonth))))

  return (
    <div>
      <StepHeading title="Bạn sinh ngày nào?" />
      <div className="mt-8 grid grid-cols-[1.4fr_1fr_1.2fr] gap-2">
        <WheelPicker
          items={MONTHS}
          value={month}
          onChange={(next) => update(year, next, day)}
          ariaLabel="Tháng sinh"
        />
        <WheelPicker
          items={days}
          value={day}
          onChange={(next) => update(year, month, next)}
          ariaLabel="Ngày sinh"
        />
        <WheelPicker
          items={years}
          value={year}
          onChange={(next) => update(next, month, day)}
          ariaLabel="Năm sinh"
        />
      </div>
      {ageOn(value, today) < 18 && (
        <div
          role="alert"
          className="bg-destructive/15 text-destructive motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-200 mt-6 flex items-center gap-3 rounded-2xl p-4 text-base"
        >
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Bạn cần đủ 18 tuổi để tiếp tục
        </div>
      )}
    </div>
  )
}
