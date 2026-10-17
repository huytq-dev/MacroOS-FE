'use client'

import { useMemo } from 'react'
import { StepHeading } from './ChoiceStep'
import { BadgeAlert } from './SolidIcons'
import { WheelPicker } from './WheelPicker'
import { ageOn } from '../../onboarding.utils'

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString('en-US', { month: 'long' }),
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
      <StepHeading title="When were you born?" />
      <div className="mt-8 grid grid-cols-[1.4fr_1fr_1.2fr] gap-2">
        <WheelPicker
          items={MONTHS}
          value={month}
          onChange={(next) => update(year, next, day)}
          ariaLabel="Birth month"
        />
        <WheelPicker
          items={days}
          value={day}
          onChange={(next) => update(year, month, next)}
          ariaLabel="Birth day"
        />
        <WheelPicker
          items={years}
          value={year}
          onChange={(next) => update(next, month, day)}
          ariaLabel="Birth year"
        />
      </div>
      {ageOn(value, today) < 18 && (
        <div
          role="alert"
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-200 mt-6 flex items-center gap-3 rounded-2xl bg-red-950 p-4 text-base text-red-50"
        >
          <BadgeAlert className="size-5 shrink-0" />
          You must be at least 18 to continue
        </div>
      )}
    </div>
  )
}
