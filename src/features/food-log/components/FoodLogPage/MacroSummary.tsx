'use client'

import { useState } from 'react'
import { Flame } from 'lucide-react'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { cn } from '@/lib/utils'
import type { MacroTotals } from '../../types/food-log.types'

interface MacroSummaryProps {
  /** Đổi ngày thì số liệu hiện dần (thanh vẫn chạy bằng transition riêng). */
  readonly date: string
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
  /** Nutrient Reporting: true thì vượt mục tiêu hiện số âm ("-120 left"), false thì dừng ở 0. */
  readonly showOverages: boolean
}

const MACROS = [
  { key: 'calories', letter: null, bar: 'bg-mf-tile-calories' },
  { key: 'protein', letter: 'P', bar: 'bg-mf-tile-protein' },
  { key: 'fat', letter: 'F', bar: 'bg-mf-tile-fat' },
  { key: 'carbs', letter: 'C', bar: 'bg-mf-tile-carbs' },
] as const

const targetOf = (target: ProgramWeek | null, key: (typeof MACROS)[number]['key']) =>
  target
    ? Math.round(
        {
          calories: target.caloriesTarget,
          protein: target.proteinTarget,
          fat: target.fatTarget,
          carbs: target.carbsTarget,
        }[key]
      )
    : null

const PAGES = ['consumed', 'left'] as const

/**
 * Tóm tắt macro của ngày, vuốt ngang giữa hai trang (có chấm trang): "đã ăn / mục tiêu" với thanh tiến độ đang đầy dần,
 * và "còn lại" với thanh màu theo từng macro. Trung tính (BR-18): mặc định vượt mục tiêu không ra số âm (cài đặt Nutrient Reporting), thanh dừng ở đầy.
 */
export function MacroSummary({ date, totals, target, showOverages }: MacroSummaryProps) {
  const [page, setPage] = useState(0)
  return (
    <div>
      <div
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget
          setPage(Math.round(scrollLeft / clientWidth))
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
      >
        {PAGES.map((mode) => (
          <ul
            key={mode}
            aria-label={mode === 'consumed' ? 'Consumed of target' : 'Remaining'}
            className="grid w-full shrink-0 snap-center grid-cols-4 gap-2"
          >
            {MACROS.map(({ key, letter, bar }) => {
              const value = Math.round(totals[key])
              const goal = targetOf(target, key)
              const left = goal === null ? null : Math.round(goal - value)
              const filled =
                goal === null || goal <= 0
                  ? 0
                  : mode === 'consumed'
                    ? Math.min(100, (value / goal) * 100)
                    : Math.max(0, Math.min(100, ((goal - value) / goal) * 100))
              // Cỡ chữ theo bề rộng cột (15cqi, tối đa 16px) để "2861/2880" + icon luôn vừa một cột kể cả ở 320px
              return (
                <li key={key} className="@container min-w-0">
                  <p
                    key={date}
                    className="motion-safe:animate-in motion-safe:fade-in-0 flex items-center gap-[0.2em] text-[min(1rem,15cqi)] whitespace-nowrap tabular-nums motion-safe:duration-300"
                  >
                    {letter ? (
                      <b className="font-bold">{letter}</b>
                    ) : (
                      <Flame
                        aria-hidden="true"
                        fill="currentColor"
                        className="size-[1em] shrink-0"
                      />
                    )}
                    {mode === 'consumed'
                      ? `${value}/${goal ?? '--'}`
                      : left === null
                        ? '--'
                        : `${showOverages ? left : Math.max(0, left)} left`}
                  </p>
                  <div className="bg-foreground/15 mt-1.5 h-1 overflow-hidden rounded-full">
                    <div
                      style={{ width: `${filled}%` }}
                      className={cn('h-full rounded-full transition-[width] duration-300', bar)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        ))}
      </div>
      <div aria-hidden="true" className="mt-3 flex justify-center gap-2">
        {PAGES.map((mode, index) => (
          <span
            key={mode}
            className={cn(
              'size-1.5 rounded-full transition-colors duration-200',
              index === page ? 'bg-foreground' : 'bg-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  )
}
