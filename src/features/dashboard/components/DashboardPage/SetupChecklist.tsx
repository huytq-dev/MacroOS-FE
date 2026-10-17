import Link from 'next/link'
import { Check } from 'lucide-react'
import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SetupStep {
  readonly key: string
  readonly label: string
  readonly hint: string
  readonly done: boolean
  readonly href: string
}

interface SetupChecklistProps {
  readonly steps: readonly SetupStep[]
}

/**
 * Chưa có program thì chưa có mục tiêu kcal/ngày để so sánh, nên dashboard chỉ hiện các bước thiết lập
 * (luồng MacroFactor: hồ sơ → cân nặng → goal/program → mới theo dõi hằng ngày).
 */
export function SetupChecklist({ steps }: SetupChecklistProps) {
  const next = steps.find((step) => !step.done)
  const doneCount = steps.filter((step) => step.done).length

  return (
    <section aria-labelledby="setup-heading" className="space-y-4">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm tabular-nums">
          Step {Math.min(doneCount + 1, steps.length)}/{steps.length}
        </p>
        <h2 id="setup-heading" className="text-2xl leading-tight font-bold">
          Set your daily targets
        </h2>
        <p className="text-muted-foreground text-base md:text-sm">
          MacroOS needs a few details to work out the calories and macros you should eat each day.
          Once that is done, your weekly tracking board will show up here.
        </p>
      </div>

      <ListSection>
        {steps.map((step, index) => (
          <ListRow
            key={step.key}
            href={step.href}
            label={step.label}
            hint={step.hint}
            value={step.done ? 'Done' : undefined}
            leading={
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  step.done ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                )}
              >
                {step.done ? <Check className="size-4" /> : index + 1}
              </span>
            }
          />
        ))}
      </ListSection>

      {next && (
        <Button asChild className="h-12 w-full rounded-full text-base">
          <Link href={next.href}>Continue: {next.label}</Link>
        </Button>
      )}
    </section>
  )
}
