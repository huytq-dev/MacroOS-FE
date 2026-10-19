import { Check } from 'lucide-react'
import { StepHeading } from '@/features/onboarding/components/OnboardingPage'
import { Button } from '@/components/ui/button'
import { formatMonthDay } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { CheckInSession } from '../../types/check-in.types'
import { MODULE_META, visibleModules } from '../../utils/check-in.utils'

interface CheckInHubProps {
  readonly session: CheckInSession
  /** Key module đã xong trong lần check-in này. */
  readonly completed: readonly string[]
  readonly onOpen: (key: string) => void
  readonly onSkip: (key: string) => void
  readonly onExit: () => void
}

/**
 * Nội dung hub check-in (đặt trong `WizardShell`): các module theo thứ tự BE trả, đánh số như phần "How is your program designed?"
 * của wizard thiết lập, module đã xong có dấu ✓, module kế tiếp có nút "Go to …" (Partial Logging bỏ qua được có thêm "Skip Module"),
 * các module sau mờ đi. Chưa tới hạn hoặc đã check-in hôm nay thì chỉ báo trạng thái.
 */
export function CheckInHub({ session, completed, onOpen, onSkip, onExit }: CheckInHubProps) {
  if (!session.isDue || session.alreadyCheckedInToday)
    return (
      <div>
        <StepHeading
          title={
            session.alreadyCheckedInToday ? "You're all caught up" : "It's not check-in time yet"
          }
          subtitle={`Your next check-in is ${formatMonthDay(session.nextCheckInDate)}.`}
        />
        <Button className="mt-2 h-12 rounded-full px-6 text-base" onClick={onExit}>
          Back to Strategy
        </Button>
      </div>
    )

  const modules = visibleModules(session.modules)
  const current = modules.findIndex((module) => !completed.includes(module.key))

  return (
    <div>
      <StepHeading
        title="Check-in"
        subtitle="A few short steps to review your week and update your program."
      />
      <ol>
        {modules.map((module, index) => {
          const meta = MODULE_META[module.key]
          const done = completed.includes(module.key)
          const active = index === current
          return (
            <li
              key={module.key}
              style={{ animationDelay: `${index * 70}ms` }}
              className={cn(
                'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:animation-duration-300 relative flex gap-4 pb-7 transition-opacity duration-300 last:pb-0',
                !active && !done && 'opacity-50'
              )}
            >
              {index < modules.length - 1 && (
                <span
                  aria-hidden="true"
                  className="bg-border absolute top-9 bottom-0 left-4 w-0.5"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
                  done ? 'bg-mf-tile-carbs text-neutral-900' : 'bg-foreground text-background'
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-medium">{meta.title}</h2>
                <p className="text-muted-foreground mt-1 text-base leading-snug">
                  {meta.description}
                </p>
                {active && (
                  <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 mt-4 flex flex-wrap gap-2">
                    <Button
                      className="h-12 rounded-full px-5 text-base"
                      onClick={() => onOpen(module.key)}
                    >
                      {meta.cta}
                    </Button>
                    {module.state === 'skippable' && (
                      <Button
                        variant="secondary"
                        className="h-12 rounded-full px-5 text-base"
                        onClick={() => onSkip(module.key)}
                      >
                        Skip Module
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
