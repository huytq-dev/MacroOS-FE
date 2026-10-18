'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Target } from 'lucide-react'

const SIZE = 300
const CENTER = SIZE / 2
const OUTER = { radius: 140, width: 8 }
const INNER = { radius: 118, width: 8 }

interface CheckInDialProps {
  /** Số ngày tới check-in kế tiếp (từ BE: `checkInDueInDays`); 0 = hôm nay. */
  readonly days: number
  /** 0–100: tiến độ goal (vòng ngoài xanh); null = không có (duy trì cân) → vòng chỉ hiện nền. */
  readonly goalPercent: number | null
}

/** Cung tròn bắt đầu từ 12 giờ, quay theo chiều kim đồng hồ; `fraction` 0–1. */
function Arc({
  radius,
  width,
  fraction,
  ready,
  className,
}: {
  readonly radius: number
  readonly width: number
  readonly fraction: number
  readonly ready: boolean
  readonly className: string
}) {
  const circumference = 2 * Math.PI * radius
  return (
    <circle
      cx={CENTER}
      cy={CENTER}
      r={radius}
      fill="none"
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={ready ? circumference * (1 - fraction) : circumference}
      transform={`rotate(-90 ${CENTER} ${CENTER})`}
      className={`${className} motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out`}
    />
  )
}

/**
 * Vòng đếm ngược check-in của tab Strategy (như MacroFactor): vòng trong trắng đầy dần qua tuần tới ngày check-in, vòng ngoài
 * xanh là tiến độ goal, giữa là "N DAY(S) until check-in"; chú thích Goal / Check-In bên dưới. Cung vẽ dần khi vào trang.
 */
export function CheckInDial({ days, goalPercent }: CheckInDialProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const weekFraction = days === 0 ? 1 : (7 - days) / 7
  const goalFraction = Math.min(Math.max((goalPercent ?? 0) / 100, 0.02), 1)

  return (
    <section aria-label="Check-in countdown" className="flex flex-col items-center gap-5">
      <div className="relative size-[min(78vw,300px)]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="size-full">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER.radius}
            fill="none"
            strokeWidth={OUTER.width}
            className="stroke-foreground/10"
          />
          {goalPercent !== null && (
            <Arc
              {...OUTER}
              fraction={goalFraction}
              ready={ready}
              className="stroke-[var(--mf-green)]"
            />
          )}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER.radius}
            fill="none"
            strokeWidth={INNER.width}
            className="stroke-foreground/10"
          />
          <Arc {...INNER} fraction={weekFraction} ready={ready} className="stroke-foreground" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-[40px] leading-none font-extrabold tracking-wide uppercase [font-stretch:125%]">
            {days === 0 ? 'Today' : `${days} ${days === 1 ? 'day' : 'days'}`}
          </p>
          <p className="text-muted-foreground mt-1 text-base">
            {days === 0 ? 'check-in day' : 'until check-in'}
          </p>
        </div>
      </div>
      <ul className="flex items-center gap-8 text-base">
        <li className="flex items-center gap-2">
          <Target aria-hidden="true" className="size-6 text-[var(--mf-green)]" />
          Goal
        </li>
        <li className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-6" />
          Check-In
        </li>
      </ul>
    </section>
  )
}
