'use client'

import { useState } from 'react'
import { Flame } from 'lucide-react'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { targetRatio } from '@/features/nutrition/goal-progress'
import { shownProgress } from '@/features/nutrition/remaining'
import { useUnits } from '@/features/users/hooks/use-units'
import type { MacroTotals } from '../../types/food-log.types'

interface MacroSummaryProps {
  /** Đổi ngày thì số liệu hiện dần (thanh vẫn chạy bằng transition riêng). */
  readonly date: string
  readonly totals: MacroTotals
  readonly target: ProgramWeek | null
  /** Nutrient Reporting: true thì vượt mục tiêu hiện số âm ("-120 left"), false thì dừng ở 0. */
  readonly showOverages: boolean
  /** Nhật ký của ngày chưa về (và chưa có số của tuần để thay): khung xám, không vẽ "0/--" như thể chưa có target. */
  readonly pending?: boolean
}

const MACROS = [
  { key: 'calories', letter: null, bar: 'bg-mf-tile-calories' },
  { key: 'protein', letter: 'P', bar: 'bg-mf-tile-protein' },
  { key: 'fat', letter: 'F', bar: 'bg-mf-tile-fat' },
  { key: 'carbs', letter: 'C', bar: 'bg-mf-tile-carbs' },
] as const

const targetOf = (target: ProgramWeek | null, key: (typeof MACROS)[number]['key']) =>
  target
    ? {
        calories: target.caloriesTarget,
        protein: target.proteinTarget,
        fat: target.fatTarget,
        carbs: target.carbsTarget,
      }[key]
    : null

const PAGES = ['consumed', 'left'] as const

/**
 * Tóm tắt macro của ngày, vuốt ngang giữa hai trang (có chấm trang): "đã ăn / mục tiêu" với thanh tiến độ đang đầy dần,
 * và "còn lại" với thanh màu theo từng macro. Trung tính (BR-18): mặc định vượt mục tiêu không ra số âm (cài đặt Nutrient Reporting), thanh dừng ở đầy.
 */
export function MacroSummary({
  date,
  totals,
  target,
  showOverages,
  pending = false,
}: MacroSummaryProps) {
  const [page, setPage] = useState(0)
  const { energy } = useUnits()
  if (pending) return <Skeleton className="h-14 w-full rounded-lg" aria-busy="true" />
  // Calo đổi sang kcal / kJ của user (BE luôn kcal) TRƯỚC khi làm tròn, khớp mọi ô calo khác; macro là gram. "Left" = mục tiêu − đã ăn ngay ở
  // đơn vị đang hiện nên ba số luôn cộng đúng
  const shown = (key: (typeof MACROS)[number]['key'], value: number) =>
    Math.round(key === 'calories' ? energy.convert(value) : value)
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
              // MỘT quy tắc "còn lại" chung (`shownProgress`): làm tròn đã ăn và mục tiêu ở đơn vị đang hiện TRƯỚC rồi mới trừ; không âm trừ khi bật Show Overages
              const {
                consumed: value,
                goal,
                remaining: left,
              } = shownProgress(
                totals[key],
                targetOf(target, key),
                (amount) => shown(key, amount),
                showOverages
              )
              const filled =
                goal === null
                  ? 0
                  : targetRatio(mode === 'consumed' ? value : goal - value, goal).progress * 100
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
                      ? `${value}/${goal === null ? '--' : goal}`
                      : left === null
                        ? '--'
                        : `${left} left`}
                  </p>
                  <div className="bg-foreground/15 mt-1.5 h-1 overflow-hidden rounded-full">
                    <div
                      style={{ width: `${filled}%` }}
                      className={cn(
                        'motion-safe:animate-bar-grow h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
                        bar
                      )}
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
