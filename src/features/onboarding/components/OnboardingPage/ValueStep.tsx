'use client'

import { ChartLine, RefreshCw, ShieldCheck, type LucideIcon } from 'lucide-react'
import { StepHeading } from './ChoiceStep'

const POINTS: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ChartLine,
    title: 'Built on your own data',
    text: 'Your kcal target starts from an estimate, then is adjusted using your Weight Trend and what you actually eat.',
  },
  {
    icon: RefreshCw,
    title: 'Adjusts itself every week',
    text: 'Weekly check-ins update your target as your metabolism changes, so you never have to recalculate.',
  },
  {
    icon: ShieldCheck,
    title: 'Private and ad-free',
    text: 'Your health data is only used to personalise your program.',
  },
]

/** Màn thay cho trang đánh giá người dùng: ba lợi ích có thật của MacroOS (không dùng lời đánh giá giả). */
export function ValueStep() {
  return (
    <div>
      <StepHeading title="This program adapts to you and is built on the latest science" />
      <ul className="space-y-3">
        {POINTS.map((point, index) => (
          <li
            key={point.title}
            className="border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 flex gap-4 rounded-2xl border-2 p-4 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <point.icon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
            <div>
              <h2 className="text-base font-semibold">{point.title}</h2>
              <p className="text-muted-foreground text-base leading-snug">{point.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
