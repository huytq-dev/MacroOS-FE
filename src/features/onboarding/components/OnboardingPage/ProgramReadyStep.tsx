'use client'

import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StepHeading } from './ChoiceStep'
import type { ProgramPreview } from '../../types/onboarding.types'

const DAY_SHORT: Record<string, string> = {
  Monday: 'T2',
  Tuesday: 'T3',
  Wednesday: 'T4',
  Thursday: 'T5',
  Friday: 'T6',
  Saturday: 'T7',
  Sunday: 'CN',
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

  const verb = goalType === 'WeightGain' ? 'tăng' : goalType === 'WeightLoss' ? 'giảm' : 'giữ'
  const steps = [
    {
      title: 'Mức tiêu hao ước tính',
      value: `${preview.tdeeKcal} kcal`,
      tone: 'text-mf-protein',
      text: `Khi bạn dùng MacroOS, mức tiêu hao sẽ liên tục được tinh chỉnh. Từ thông tin ban đầu, mức tiêu hao hằng ngày của bạn khoảng ${preview.tdeeKcal} kcal.`,
    },
    {
      title: 'Mục tiêu trung bình',
      value: `${preview.averageCalories} kcal`,
      tone: 'text-mf-carbs',
      text:
        goalType === 'Maintenance'
          ? `Bạn muốn giữ cân nên mục tiêu kcal trung bình bằng mức tiêu hao, khoảng ${preview.averageCalories} kcal.`
          : `Bạn muốn ${verb} ${ratePercent.toFixed(2)}% cân nặng mỗi tuần, nên mục tiêu kcal trung bình mỗi ngày khoảng ${preview.averageCalories} kcal.`,
    },
    {
      title: 'Protein mục tiêu',
      value: `${preview.proteinGPerKg.toFixed(2)} g/kg`,
      tone: 'text-mf-calories',
      text: `Với mục tiêu của bạn và mức protein ${proteinLabel.toLowerCase()}, ăn ${preview.proteinGPerKg.toFixed(2)} g protein mỗi kg cân nặng là mức trung bình phù hợp với lối sống và việc tập luyện.`,
    },
    {
      title: 'Kiểu ăn',
      value: dietLabel,
      tone: 'text-mf-fat',
      text: `Cuối cùng, phần kcal còn lại được chia giữa carb và chất béo theo kiểu ăn ${dietLabel.toLowerCase()}.`,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <StepHeading title="Chương trình macro của bạn đã sẵn sàng" />
        <div
          className="grid grid-cols-7 gap-1.5"
          role="img"
          aria-label="Mục tiêu macro 7 ngày trong tuần"
        >
          {preview.days.map((day, index) => {
            const total = day.proteinG * 4 + day.fatG * 9 + day.carbsG * 4
            const segment = (kcal: number) => Math.max(MIN_SEGMENT, (kcal / total) * BAR_HEIGHT)
            return (
              <div
                key={day.dayOfWeek}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:animation-duration-500 flex flex-col items-stretch gap-1 text-center text-xs font-medium text-white tabular-nums [animation-fill-mode:backwards]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="bg-mf-calories rounded-full py-1">{day.calories}</span>
                <span
                  className="bg-mf-protein flex items-center justify-center rounded-md"
                  style={{ height: segment(day.proteinG * 4) }}
                >
                  {Math.round(day.proteinG)} P
                </span>
                <span
                  className="bg-mf-fat flex items-center justify-center rounded-md"
                  style={{ height: segment(day.fatG * 9) }}
                >
                  {Math.round(day.fatG)} F
                </span>
                <span
                  className="bg-mf-carbs flex items-center justify-center rounded-md"
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
          Chương trình được thiết kế thế nào?
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
          Tiếp theo là gì?
        </h2>
        <p className="text-muted-foreground text-base leading-snug">
          MacroOS theo dõi lượng calo bạn ăn và thay đổi cân nặng để tinh chỉnh mức tiêu hao ước
          tính, rồi dùng thông tin đó chỉnh ngân sách calo và macro hằng tuần để bạn đi đúng hướng.
        </p>
      </section>
      <div ref={endRef} aria-hidden="true" className="h-px" />
    </div>
  )
}
