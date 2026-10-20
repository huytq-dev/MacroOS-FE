'use client'

import { useRef, useState } from 'react'

export interface TutorialStep {
  readonly icon: React.ReactNode
  readonly title: string
  readonly text: string
}

const TONES = {
  brown: { card: 'bg-[#4a2318]', pill: 'bg-[#84361a] active:bg-[#98421f]' },
  purple: { card: 'bg-[#3b2d5c]', pill: 'bg-[#5b32a8] active:bg-[#6a40bd]' },
  green: { card: 'bg-[#294232]', pill: 'bg-[#0e5a3a] active:bg-[#14704a]' },
} as const

interface TutorialCardProps {
  readonly steps: readonly TutorialStep[]
  readonly tone: keyof typeof TONES
  readonly onDismiss: () => void
}

const PILL =
  'focus-visible:ring-ring/50 min-h-11 whitespace-nowrap rounded-full px-4 text-base transition-colors duration-500 focus-visible:ring-1 focus-visible:outline-none'

/**
 * Hướng dẫn nhiều bước (nền nâu đỏ cho Expenditure, tím cho Weight Trend): chỉ phần nội dung trượt ngang (vuốt tay hoặc
 * Previous/Next, scroll-snap), hàng nút đứng yên; "Done" ở bước cuối, "Dismiss Tutorial" ẩn hẳn.
 */
export function TutorialCard({ steps, tone, onDismiss }: TutorialCardProps) {
  const track = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const last = step === steps.length - 1
  const pill = `${PILL} ${TONES[tone].pill}`
  const go = (index: number) =>
    track.current?.scrollTo({ left: index * track.current.clientWidth, behavior: 'smooth' })

  return (
    <section
      aria-label="Tutorial"
      className={`overflow-hidden rounded-xl transition-colors duration-500 [contain:inline-size] ${TONES[tone].card}`}
    >
      <div
        ref={track}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget
          setStep(Math.round(scrollLeft / clientWidth))
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((item, index) => (
          <article
            key={item.title}
            aria-label={`${index + 1} of ${steps.length}: ${item.title}`}
            className="w-full shrink-0 snap-center px-4 pt-4"
          >
            <h2 className="flex items-center gap-3 text-lg font-medium">
              {item.icon}
              {item.title}
            </h2>
            <p className="text-foreground/90 mt-1 min-h-[4.1rem] text-base leading-snug">
              {item.text}
            </p>
          </article>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={onDismiss}
          className="focus-visible:ring-ring/50 min-h-11 shrink-0 text-base whitespace-nowrap focus-visible:ring-1 focus-visible:outline-none"
        >
          Dismiss Tutorial
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className={pill}>
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? onDismiss() : go(step + 1))}
            className={pill}
          >
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </section>
  )
}
