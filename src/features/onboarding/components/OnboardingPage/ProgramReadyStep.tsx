'use client'

import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { KCAL_PER_GRAM } from '@/features/nutrition/atwater'
import type { ReviewCopy, ReviewTone } from '@/features/program/utils/review-copy'
import { dayLetter } from '@/lib/week'
import { cn } from '@/lib/utils'
import { StepHeading } from './ChoiceStep'
import type { ProgramPreviewDay } from '../../types/onboarding.types'

const TONE_CLASS: Record<ReviewTone, string> = {
  calories: 'text-mf-tile-calories-text',
  carbs: 'text-mf-tile-carbs-text',
  protein: 'text-mf-tile-protein-text',
  fat: 'text-mf-tile-fat-text',
}
const BAR_HEIGHT = 190
const MIN_SEGMENT = 24

interface ProgramReadyStepProps {
  readonly days: readonly ProgramPreviewDay[] | undefined
  readonly copy: ReviewCopy | undefined
  /** Báo khi cuối nội dung đã vào khung nhìn (mở khoá nút Done như MacroFactor); gọi lại khi `onReachedEnd` đổi, nên truyền hàm ổn định. */
  readonly onReachedEnd: () => void
}

/** "Your macro program is ready": biểu đồ 7 ngày (kcal, P, F, C) + "How was your program designed?" + "What's Next"; chữ giải thích do `reviewCopyOf` dựng theo kiểu program. */
export function ProgramReadyStep({ days, copy, onReachedEnd }: ProgramReadyStepProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const ready = days !== undefined && copy !== undefined

  useEffect(() => {
    const element = endRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onReachedEnd()
          observer.disconnect()
        }
      },
      { threshold: 1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [onReachedEnd, ready])

  if (!days || !copy) return <Skeleton className="h-96 rounded-2xl" aria-busy="true" />

  return (
    <div className="space-y-8">
      <div>
        <StepHeading title="Your macro program is ready" />
        <div
          className="grid grid-cols-7 gap-x-2.5"
          role="img"
          aria-label="Macro targets for the 7 days of the week"
        >
          {days.map((day, index) => {
            const proteinKcal = day.proteinG * KCAL_PER_GRAM.protein
            const fatKcal = day.fatG * KCAL_PER_GRAM.fat
            const carbsKcal = day.carbsG * KCAL_PER_GRAM.carbs
            const total = proteinKcal + fatKcal + carbsKcal
            const segment = (kcal: number) =>
              Math.max(MIN_SEGMENT, total > 0 ? (kcal / total) * BAR_HEIGHT : 0)
            return (
              <div
                key={day.dayOfWeek}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:animation-duration-500 flex flex-col items-stretch gap-2 text-center text-xs font-medium text-neutral-900 tabular-nums [animation-fill-mode:backwards]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="bg-mf-tile-calories rounded-full py-1">{day.calories}</span>
                <span
                  className="bg-mf-tile-protein flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(proteinKcal) }}
                >
                  {Math.round(day.proteinG)} P
                </span>
                <span
                  className="bg-mf-tile-fat flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(fatKcal) }}
                >
                  {Math.round(day.fatG)} F
                </span>
                <span
                  className="bg-mf-tile-carbs flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(carbsKcal) }}
                >
                  {Math.round(day.carbsG)} C
                </span>
                <span className="text-muted-foreground pt-1 text-sm font-normal">
                  <span aria-hidden="true">{dayLetter(day.dayOfWeek)}</span>
                  <span className="sr-only">{day.dayOfWeek}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <section aria-labelledby="designed-heading" className="space-y-5">
        <h2 id="designed-heading" className="text-lg font-semibold">
          How was your program designed?
        </h2>
        <ol>
          {copy.details.map((detail, index) => (
            <li key={detail.title} className="relative flex gap-4 pb-7 last:pb-0">
              {index < copy.details.length - 1 && (
                <span
                  aria-hidden="true"
                  className="bg-border absolute top-9 bottom-0 left-4 w-0.5"
                />
              )}
              <span
                aria-hidden="true"
                className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-medium">{detail.title}</h3>
                <p className={cn('text-base font-semibold', TONE_CLASS[detail.tone])}>
                  {detail.value}
                </p>
                <p className="text-muted-foreground mt-1 text-base leading-snug">{detail.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="next-heading" className="space-y-2">
        <h2 id="next-heading" className="text-lg font-semibold">
          What&apos;s Next
        </h2>
        <p className="text-muted-foreground text-base leading-snug">{copy.next}</p>
      </section>
      <div ref={endRef} aria-hidden="true" className="h-px" />
    </div>
  )
}
