'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { StepHeading, WizardShell } from '@/features/onboarding/components/OnboardingPage'
import { useUnits } from '@/features/users/hooks/use-units'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FlowDirection } from '@/stores/flow.store'
import type { CheckInPreview } from '../../types/check-in.types'
import type { Feasibility } from '../../types/feasibility.types'
import { reasonSentences } from '../../utils/check-in.utils'
import { infeasibleOf } from '../../utils/feasibility'
import { FeasibilityNotice } from '../FeasibilityNotice'
import { OrbitAnimation } from './OrbitAnimation'

interface ProgramUpdateModuleProps {
  readonly direction: FlowDirection
  readonly preview: CheckInPreview
  readonly isDeciding: boolean
  readonly error: string | null
  /** Accept bị BE từ chối 400 vì đề xuất không khả thi (cùng `FeasibilityResponse` với `preview.feasibility`; nothing persisted). */
  readonly refused?: Feasibility | null
  readonly onExit: () => void
  readonly onAccept: () => void
  readonly onDecline: () => void
}

/** Thời gian tối thiểu hiện "Reviewing metabolic history…" (preview đã có sẵn trong session; chỉ để người dùng kịp thấy). */
const REVIEW_MIN_MS = 1600

function MacroChange({
  label,
  before,
  after,
}: {
  readonly label: string
  readonly before: number
  readonly after: number
}) {
  return (
    <div className="bg-secondary rounded-2xl px-3 py-3 text-center">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-base whitespace-nowrap tabular-nums">
        <span className="text-muted-foreground">{Math.round(before)}</span>
        <ArrowRight aria-hidden="true" className="mx-1 inline size-3.5" />
        <span className="font-medium">{Math.round(after)}</span>
      </p>
    </div>
  )
}

/**
 * Module Program Update trong `WizardShell`: (1) animation quỹ đạo "Reviewing metabolic history…" tối thiểu ~1.6 giây, (2) đề xuất:
 * calo cũ → mới, macro đổi ra sao, các câu lý do (từ mã lý do BE) và hai nút "Accept Program Changes" / "Decline and Silence".
 * Không có đề xuất (Calibrating / Holding) hoặc không có gì đổi thì chỉ còn "Done" (BE giữ nguyên target và vẫn ghi check-in).
 */
export function ProgramUpdateModule({
  preview,
  direction,
  isDeciding,
  error,
  refused = null,
  onExit,
  onAccept,
  onDecline,
}: ProgramUpdateModuleProps) {
  const [reviewing, setReviewing] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setReviewing(false), REVIEW_MIN_MS)
    return () => clearTimeout(timer)
  }, [])
  const { weight, energy } = useUnits()
  // Calo BE trả kcal, hiện theo kcal / kJ của user; macro là gram
  const kcal = (value: number) => Math.round(energy.convert(value)).toLocaleString('en-US')

  const proposal = preview.proposal
  const sentences = reasonSentences(preview, weight)
  const decidable = proposal !== null && preview.changed
  // Đề xuất không khả thi (preview 200 hoặc Accept bị 400): Accept chắc chắn bị từ chối và không ghi gì, nên khoá; Decline vẫn dùng được
  const infeasible = refused ?? infeasibleOf(preview.feasibility)
  const acceptBlocked = decidable && infeasible !== null

  return (
    <WizardShell
      sectionTitle="Program Update"
      progress={null}
      canGoBack={!reviewing}
      onBack={onExit}
      stepKey={reviewing ? 'reviewing' : 'result'}
      direction={direction}
      nextLabel={decidable ? 'Accept Program Changes' : 'Done'}
      nextDisabled={acceptBlocked}
      isPending={isDeciding}
      pendingLabel="Saving…"
      onNext={onAccept}
      error={error}
      footer={
        reviewing ? (
          false
        ) : decidable ? (
          <div className="space-y-2">
            <Button
              className="h-12 w-full rounded-full text-base"
              disabled={isDeciding || acceptBlocked}
              aria-busy={isDeciding}
              onClick={onAccept}
            >
              Accept Program Changes
            </Button>
            <Button
              variant="secondary"
              className="h-12 w-full rounded-full text-base"
              disabled={isDeciding}
              onClick={onDecline}
            >
              Decline and Silence
            </Button>
          </div>
        ) : undefined
      }
    >
      {reviewing ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <OrbitAnimation />
          <p className="text-xl font-medium" aria-live="polite">
            Reviewing metabolic history…
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <StepHeading
            title={decidable ? 'Your program update' : 'No changes this week'}
            subtitle={
              decidable
                ? "Here's what we'd change for the coming week."
                : 'Your Calorie and macro targets stay the same.'
            }
          />
          {proposal && decidable && (
            <section
              aria-label="New targets"
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 space-y-3"
            >
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-muted-foreground text-base">Daily Calories</p>
                <p className="mt-1 flex items-center justify-center gap-3 text-3xl tabular-nums">
                  <span className="text-muted-foreground">{kcal(proposal.previousCalories)}</span>
                  <ArrowRight aria-hidden="true" className="size-6" />
                  <span className="font-bold">{kcal(proposal.newCalories)}</span>
                </p>
                <p
                  className={cn(
                    'mt-1 text-base tabular-nums',
                    proposal.delta >= 0 ? 'text-mf-tile-carbs-text' : 'text-mf-tile-calories-text'
                  )}
                >
                  {proposal.delta >= 0 ? '+' : '−'}
                  {kcal(Math.abs(proposal.delta))} {energy.unit}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MacroChange
                  label="Protein (g)"
                  before={preview.reasonParams.oldProteinG}
                  after={proposal.proteinG}
                />
                <MacroChange
                  label="Carbs (g)"
                  before={preview.reasonParams.oldCarbsG}
                  after={proposal.carbsG}
                />
                <MacroChange
                  label="Fat (g)"
                  before={preview.reasonParams.oldFatG}
                  after={proposal.fatG}
                />
              </div>
            </section>
          )}
          {infeasible && <FeasibilityNotice feasibility={infeasible} />}
          <section aria-labelledby="why">
            <h2 id="why" className="text-lg font-semibold">
              Why
            </h2>
            <ul className="mt-3 space-y-3">
              {sentences.map((sentence, index) => (
                <li
                  key={sentence}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:animation-duration-300 text-base leading-snug"
                >
                  {sentence}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </WizardShell>
  )
}
