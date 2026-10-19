'use client'

import { useState } from 'react'
import { StepHeading, WizardShell } from '@/features/onboarding/components/OnboardingPage'
import type { FlowDirection } from '@/stores/flow.store'
import type { CheckInDay } from '../../types/check-in.types'
import { IncompleteDaysChart } from './IncompleteDaysChart'

const STEPS = ['explain', 'select', 'confirm', 'complete'] as const
type Step = (typeof STEPS)[number]

interface PartialLoggingModuleProps {
  readonly direction: FlowDirection
  /** Báo hướng chuyển bước để khung trượt đúng chiều (trạng thái chung ở trang). */
  readonly onDirectionChange: (direction: FlowDirection) => void
  readonly days: readonly CheckInDay[]
  readonly isSaving: boolean
  readonly error: string | null
  readonly onExit: () => void
  /** Lưu tập ngày chưa đủ (BE dựng lại expenditure); `onDone` chạy khi lưu xong. */
  readonly onSaveDays: (dates: string[], onDone: () => void) => void
  /** Xong module; `hide` = user chọn "Don't show this module again". */
  readonly onFinish: (hide: boolean) => void
}

/** Từ bao nhiêu ngày chưa đủ (kể cả ngày chưa log) thì BE giữ nguyên expenditure tuần này. */
const HOLD_THRESHOLD = 4

/**
 * Module Partial Logging trong `WizardShell`: (1) giải thích log có thể thiếu ngày, (2) "Which days look incomplete?" chọn ngày trên
 * biểu đồ cột (ngày BE nghi được chọn sẵn), (3) "Got it!" nói rõ ảnh hưởng — từ 4 ngày chưa đủ trở lên thì targets giữ nguyên, (4)
 * hoàn tất + "Don't show this module again". Lưu ngày chọn khi sang bước 3.
 */
export function PartialLoggingModule({
  direction,
  onDirectionChange,
  days,
  isSaving,
  error,
  onExit,
  onSaveDays,
  onFinish,
}: PartialLoggingModuleProps) {
  const [step, setStep] = useState<Step>('explain')
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        days.filter((day) => day.markedIncomplete || day.suspectedIncomplete).map((day) => day.date)
      )
  )
  const [hide, setHide] = useState(false)

  const index = STEPS.indexOf(step)
  const go = (next: Step, nextDirection: FlowDirection) => {
    onDirectionChange(nextDirection)
    setStep(next)
  }
  const toggle = (date: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })

  const incompleteCount = days.filter((day) => selected.has(day.date) || day.kcal === null).length
  const holding = incompleteCount >= HOLD_THRESHOLD

  const next = () => {
    if (step === 'select') return onSaveDays([...selected], () => go('confirm', 'forward'))
    if (step === 'complete') return onFinish(hide)
    go(STEPS[index + 1], 'forward')
  }

  return (
    <WizardShell
      sectionTitle="Partial Logging"
      progress={(index + 1) / STEPS.length}
      canGoBack
      onBack={() => (index === 0 ? onExit() : go(STEPS[index - 1], 'back'))}
      stepKey={step}
      direction={direction}
      nextLabel={step === 'complete' ? 'Next Module' : 'Next'}
      nextDisabled={false}
      isPending={isSaving}
      pendingLabel="Saving…"
      onNext={next}
      error={error}
    >
      {step === 'explain' && (
        <div>
          <StepHeading
            title="Your log may be incomplete"
            subtitle="Some days may be missing food, like a meal you forgot to log. Days like that can make your expenditure estimate wrong."
          />
          <p className="text-muted-foreground text-base">
            You can mark those days as incomplete, and we&apos;ll leave them out when we update your
            program.
          </p>
        </div>
      )}

      {step === 'select' && (
        <div>
          <StepHeading
            title="Which days look incomplete?"
            subtitle="Tap the days where you didn't log everything. We selected the ones that look low."
          />
          <IncompleteDaysChart days={days} selected={selected} onToggle={toggle} />
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <StepHeading
            title="Got it!"
            subtitle={
              selected.size === 0
                ? 'No days are marked as incomplete.'
                : `Selected days will be marked as incomplete (${selected.size}).`
            }
          />
          <section className="bg-secondary rounded-2xl p-4" aria-labelledby="impact">
            <h2 id="impact" className="text-lg font-semibold">
              Impact on your program
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              {holding
                ? "With 4 or more incomplete days we don't have enough data to change your targets, so they stay the same this week."
                : selected.size === 0
                  ? "We'll use all your logged days to update your expenditure."
                  : "We'll ignore these days when we estimate your expenditure, so a missing meal won't pull your targets down."}
            </p>
          </section>
        </div>
      )}

      {step === 'complete' && (
        <div>
          <StepHeading title="Module is complete!" />
          <label className="bg-secondary flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 text-base">
            <input
              type="checkbox"
              checked={hide}
              onChange={(event) => setHide(event.target.checked)}
              className="accent-foreground size-5"
            />
            Don&apos;t show this module again
          </label>
          <p className="text-muted-foreground mt-3 text-sm">
            You can turn it back on any time from More.
          </p>
        </div>
      )}
    </WizardShell>
  )
}
