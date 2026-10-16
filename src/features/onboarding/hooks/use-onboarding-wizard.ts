'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useCompleteOnboarding,
  useCreateOnboardingProgram,
  useProgramPreview,
  useSaveBasics,
  useTdeeEstimate,
} from './use-onboarding'
import { basicsPayload, initialAnswers, initialStepOf, previewRequestOf } from '../onboarding.utils'
import { canProceed, NEXT_LABEL, PREVIEW_STEPS, programRequestOf } from '../onboarding-steps.utils'
import {
  SECTION_OF,
  SECTION_TITLE,
  STEP_ORDER,
  type OnboardingState,
  type ProgramPreview,
  type StepId,
  type TdeeEstimate,
  type WizardAnswers,
} from '../types/onboarding.types'
import type { PlanId } from '../components/OnboardingPage/PlanStep'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { routePath } from '@/config/route-path'
import { useDebounce } from '@/hooks/use-debounce'
import { todayIso } from '@/lib/date'
import { logger } from '@/lib/logger'

export interface OnboardingWizard {
  readonly stepId: StepId
  readonly direction: 'forward' | 'back'
  readonly answers: WizardAnswers
  readonly patch: (partial: Partial<WizardAnswers>) => void
  readonly setGoalType: (goal: 'WeightLoss' | 'Maintenance' | 'WeightGain') => void
  readonly today: string
  readonly sectionTitle: string
  readonly progress: number | null
  readonly canGoBack: boolean
  readonly canNext: boolean
  readonly nextLabel: string
  readonly pendingLabel: string
  readonly isPending: boolean
  readonly error: string | null
  readonly next: () => void
  readonly back: () => void
  readonly preview: ProgramPreview | undefined
  readonly estimate: TdeeEstimate | null
  readonly isEstimateLoading: boolean
  readonly plan: PlanId
  readonly setPlan: (plan: PlanId) => void
  readonly consent: { readonly health: boolean; readonly privacy: boolean }
  readonly setConsent: (consent: { health: boolean; privacy: boolean }) => void
  readonly acceptConsent: () => void
  readonly onReadyReached: () => void
}

/** Máy trạng thái của wizard thiết lập: bước hiện tại, đáp án, lưu BE từng bước Basics, xem trước, tạo program, đồng ý điều khoản. */
export function useOnboardingWizard(initial: OnboardingState): OnboardingWizard {
  const router = useRouter()
  const [today] = useState(todayIso)
  const [answers, setAnswers] = useState<WizardAnswers>(() => initialAnswers(initial))
  const [stepId, setStepId] = useState<StepId>(() => initialStepOf(initial))
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [readyReached, setReadyReached] = useState(false)
  const [plan, setPlan] = useState<PlanId>('monthly')
  const [consent, setConsent] = useState({ health: false, privacy: false })
  const [error, setError] = useState<string | null>(null)

  const saveBasics = useSaveBasics()
  const createProgram = useCreateOnboardingProgram()
  const complete = useCompleteOnboarding()
  const estimateQuery = useTdeeEstimate(stepId === 'estimate')

  const previewRequest = useMemo(
    () => (PREVIEW_STEPS.includes(stepId) ? previewRequestOf(answers) : null),
    [stepId, answers]
  )
  const preview = useProgramPreview(useDebounce(previewRequest, 250)).data ?? undefined

  const visibleSteps = useMemo(
    () => STEP_ORDER.filter((id) => !(id === 'goalTarget' && answers.goalType === 'Maintenance')),
    [answers.goalType]
  )
  const index = visibleSteps.indexOf(stepId)
  const section = SECTION_OF[stepId]
  const inSection = visibleSteps.filter((id) => SECTION_OF[id] === section)
  const progress =
    section === 'intro' || section === 'finish'
      ? null
      : (inSection.indexOf(stepId) + 1) / inSection.length

  const patch = useCallback((partial: Partial<WizardAnswers>) => {
    setAnswers((current) => ({ ...current, ...partial }))
  }, [])

  const setGoalType = (goal: 'WeightLoss' | 'Maintenance' | 'WeightGain') => {
    const target =
      goal === 'Maintenance'
        ? null
        : Math.round(answers.weightKg * (goal === 'WeightLoss' ? 0.9 : 1.1) * 10) / 10
    patch({ goalType: goal, targetWeightKg: target })
  }

  const canNext = canProceed({ stepId, answers, today, preview, readyReached })

  const go = (target: StepId, how: 'forward' | 'back') => {
    setDirection(how)
    setStepId(target)
  }

  const next = async () => {
    setError(null)
    try {
      if (stepId === 'ready') await createProgram.mutateAsync(programRequestOf(answers, preview))
      else {
        const payload = basicsPayload(stepId, answers)
        if (payload) await saveBasics.mutateAsync(payload)
      }
      const target = visibleSteps[index + 1]
      if (target) go(target, 'forward')
    } catch (failure) {
      logger.error(failure)
      setError(getFormErrorMessage(failure))
    }
  }

  const back = () => {
    const target = visibleSteps[index - 1]
    if (target) go(target, 'back')
    setError(null)
  }

  const acceptConsent = async () => {
    setError(null)
    try {
      await complete.mutateAsync({ acceptHealthDisclaimer: true, acceptPrivacyNotice: true })
      router.replace(routePath.dashboard)
    } catch (failure) {
      logger.error(failure)
      setError(getFormErrorMessage(failure))
    }
  }

  return {
    stepId,
    direction,
    answers,
    patch,
    setGoalType,
    today,
    sectionTitle: SECTION_TITLE[section],
    progress,
    // Sau khi đã tạo program thì không lùi về các bước tạo program nữa (tạo lại sẽ thay thế program vừa tạo)
    canGoBack: index > 1 && SECTION_OF[stepId] !== 'finish',
    canNext,
    nextLabel: NEXT_LABEL[stepId] ?? 'Tiếp theo',
    pendingLabel: stepId === 'ready' ? 'Đang tạo chương trình...' : 'Đang lưu...',
    isPending: saveBasics.isPending || createProgram.isPending || complete.isPending,
    error,
    next: () => void next(),
    back,
    preview,
    estimate: estimateQuery.data ?? null,
    isEstimateLoading: estimateQuery.isLoading,
    plan,
    setPlan,
    consent,
    setConsent,
    acceptConsent: () => void acceptConsent(),
    onReadyReached: () => setReadyReached(true),
  }
}
