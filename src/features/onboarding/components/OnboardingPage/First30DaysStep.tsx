'use client'

import { Apple, ChartLine, Crosshair, Whistle, type LucideIcon } from 'lucide-react'

const TIMELINE: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Apple,
    title: 'Log your meals and weight every day',
    text: 'MacroOS uses that data to analyse your metabolism and personalise your plan.',
  },
  {
    icon: ChartLine,
    title: 'After day 3, MacroOS updates your expenditure',
    text: 'The algorithm starts fine-tuning your estimated expenditure on the Dashboard.',
  },
  {
    icon: Whistle,
    title: 'Next week, you get your first check-in',
    text: 'MacroOS adjusts your calorie target like a nutrition coach. Keep logging every day.',
  },
  {
    icon: Crosshair,
    title: 'After 30 days, your plan matches your metabolism',
    text: 'When you log consistently, MacroOS learns your metabolism and sets a calorie target that fits your body.',
  },
]

/** "30 ngày đầu tiên": timeline dọc bốn mốc, các mốc hiện lần lượt và đường nối vẽ dần. */
export function First30DaysStep() {
  return (
    <div>
      <h1 className="pt-4 pb-8 text-center text-3xl font-extrabold tracking-wide uppercase">
        Your first 30 days
      </h1>
      <ol>
        {TIMELINE.map((item, index) => (
          <li
            key={item.title}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 relative flex gap-4 pb-8 [animation-fill-mode:backwards] last:pb-0"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            {index < TIMELINE.length - 1 && (
              <span
                aria-hidden="true"
                className="bg-foreground absolute top-12 bottom-0 left-5 w-0.5"
              />
            )}
            <span
              aria-hidden="true"
              className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <item.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg leading-snug font-medium">{item.title}</h2>
              <p className="text-muted-foreground text-base leading-snug">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
