'use client'

import { cn } from '@/lib/utils'

const STEPS = [
  {
    title: 'Basics',
    description:
      'We start by getting to know you and your metabolism. This is the foundation for your personalised program.',
  },
  {
    title: 'Goal',
    description: 'Whether you want to lose, maintain or gain weight, and how fast.',
  },
  {
    title: 'Program',
    description: 'How MacroOS splits your daily kcal into protein, fat and carbs.',
  },
] as const

/** Màn mở đầu: ba chặng Basics → Goal → Program dạng timeline dọc, các dòng hiện lần lượt. */
export function IntroStep() {
  return (
    <div className="pt-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-wide uppercase">Let&apos;s get started</h1>
        <p className="text-muted-foreground text-lg">Your personalised program is waiting</p>
      </div>
      <ol className="mt-10 space-y-0">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 relative flex gap-4 pb-8 [animation-fill-mode:backwards] last:pb-0"
            style={{ animationDelay: `${150 + index * 140}ms` }}
          >
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="bg-border absolute top-12 bottom-0 left-5 w-0.5"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-base font-semibold',
                index === 0 ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-1.5">
              <h2 className={cn('text-lg font-medium', index > 0 && 'text-muted-foreground')}>
                {step.title}
              </h2>
              {index === 0 && <p className="text-base leading-snug">{step.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
