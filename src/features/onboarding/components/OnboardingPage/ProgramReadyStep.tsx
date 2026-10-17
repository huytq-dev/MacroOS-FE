'use client'

import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StepHeading } from './ChoiceStep'
import type { ProgramPreview } from '../../types/onboarding.types'

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}
const BAR_HEIGHT = 190
const MIN_SEGMENT = 24

interface ProgramReadyStepProps {
  readonly preview: ProgramPreview | undefined
  readonly goalType: 'WeightLoss' | 'Maintenance' | 'WeightGain'
  readonly ratePercent: number
  readonly proteinLabel: string
  readonly dietLabel: string
  /** Báo khi người dùng đã cuộn tới cuối (mở khoá nút Xong như MacroFactor). */
  readonly onReachedEnd: () => void
}

/** "Chương trình macro của bạn đã sẵn sàng": biểu đồ 7 ngày (kcal, P, F, C) + 4 bước giải thích cách thiết kế + việc tiếp theo. */
export function ProgramReadyStep({
  preview,
  goalType,
  ratePercent,
  proteinLabel,
  dietLabel,
  onReachedEnd,
}: ProgramReadyStepProps) {
  const endRef = useRef<HTMLDivElement>(null)

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
  }, [onReachedEnd, preview])

  if (!preview) return <Skeleton className="h-96 rounded-2xl" aria-busy="true" />

  const verb = goalType === 'WeightGain' ? 'gain' : goalType === 'WeightLoss' ? 'lose' : 'maintain'
  const steps = [
    {
      title: 'Estimated expenditure',
      value: `${preview.tdeeKcal} kcal`,
      tone: 'text-mf-tile-calories-text',
      text: `As you use MacroOS, your expenditure is continually fine-tuned. Based on your initial info, your daily expenditure is about ${preview.tdeeKcal} kcal.`,
    },
    {
      title: 'Average target',
      value: `${preview.averageCalories} kcal`,
      tone: 'text-mf-tile-carbs-text',
      text:
        goalType === 'Maintenance'
          ? `You want to maintain your weight, so your average kcal target equals your expenditure, about ${preview.averageCalories} kcal.`
          : `You want to ${verb} ${ratePercent.toFixed(2)}% of your body weight per week, so your average daily kcal target is about ${preview.averageCalories} kcal.`,
    },
    {
      title: 'Protein target',
      value: `${preview.proteinGPerKg.toFixed(2)} g/kg`,
      tone: 'text-mf-tile-protein-text',
      text: `With your goal and a ${proteinLabel.toLowerCase()} protein level, eating ${preview.proteinGPerKg.toFixed(2)} g of protein per kg of body weight is a good average for your lifestyle and training.`,
    },
    {
      title: 'Diet style',
      value: dietLabel,
      tone: 'text-mf-tile-fat-text',
      text: `Finally, the remaining kcal are split between carbs and fat following a ${dietLabel.toLowerCase()} diet style.`,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <StepHeading title="Your macro program is ready" />
        <div
          className="grid grid-cols-7 gap-x-2.5"
          role="img"
          aria-label="Macro targets for the 7 days of the week"
        >
          {preview.days.map((day, index) => {
            const total = day.proteinG * 4 + day.fatG * 9 + day.carbsG * 4
            const segment = (kcal: number) => Math.max(MIN_SEGMENT, (kcal / total) * BAR_HEIGHT)
            return (
              <div
                key={day.dayOfWeek}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:animation-duration-500 flex flex-col items-stretch gap-2 text-center text-xs font-medium text-neutral-900 tabular-nums [animation-fill-mode:backwards]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="bg-mf-tile-calories rounded-full py-1">{day.calories}</span>
                <span
                  className="bg-mf-tile-protein flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(day.proteinG * 4) }}
                >
                  {Math.round(day.proteinG)} P
                </span>
                <span
                  className="bg-mf-tile-fat flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(day.fatG * 9) }}
                >
                  {Math.round(day.fatG)} F
                </span>
                <span
                  className="bg-mf-tile-carbs flex items-center justify-center rounded-[5px]"
                  style={{ height: segment(day.carbsG * 4) }}
                >
                  {Math.round(day.carbsG)} C
                </span>
                <span className="text-muted-foreground pt-1 text-sm font-normal">
                  {DAY_SHORT[day.dayOfWeek]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <section aria-labelledby="designed-heading" className="space-y-5">
        <h2 id="designed-heading" className="text-lg font-semibold">
          How is your program designed?
        </h2>
        <ol>
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
              {index < steps.length - 1 && (
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
                <h3 className="text-base font-medium">{step.title}</h3>
                <p className={cn('text-base font-semibold', step.tone)}>{step.value}</p>
                <p className="text-muted-foreground mt-1 text-base leading-snug">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="next-heading" className="space-y-2">
        <h2 id="next-heading" className="text-lg font-semibold">
          What happens next?
        </h2>
        <p className="text-muted-foreground text-base leading-snug">
          MacroOS tracks the calories you eat and your weight changes to fine-tune your estimated
          expenditure, then uses that to adjust your weekly calorie and macro budget to keep you on
          track.
        </p>
      </section>
      <div ref={endRef} aria-hidden="true" className="h-px" />
    </div>
  )
}
