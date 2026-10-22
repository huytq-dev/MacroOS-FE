'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  useCompleteOnboarding,
  useCreateOnboardingProgram,
  useProgramPreview,
  useSaveBasics,
  useTdeeEstimate,
} from './use-onboarding'
import { applyAnswers, basicsPayload, chooseGoalType, previewRequestOf } from '../onboarding.utils'
import {
  bootOf,
  clearDraft,
  draftOf,
  isDraftStep,
  isResumable,
  pruneDrafts,
  writeDraft,
} from '../onboarding-draft'
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
import { useAuthStore } from '@/stores/auth.store'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import {
  calorieShiftProblemOf,
  calorieShiftProblemOfFeasibility,
  shiftFixesOf,
  type CalorieShiftProblem,
  type ShiftFix,
} from '@/features/program/utils/calorie-shift'
import {
  feasibilityOfError,
  infeasibleOf,
  isShiftInfeasible,
} from '@/features/program/utils/feasibility'
import type { Feasibility } from '@/features/program/types/feasibility.types'
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
  /** Bấm "Use these values": xác nhận cân mục tiêu + tốc độ đang hiện (đang là gợi ý). */
  readonly confirmGoalSuggestions: () => void
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
  /** BE từ chối kiểu chia kcal Custom hiện tại (400 Calorie Shift): ngày nào hỏng và vì sao; null = ổn hoặc chưa biết. */
  readonly shiftProblem: CalorieShiftProblem | null
  /** Target không khả thi KHÔNG do Calorie Shift (sàn, macro vượt kcal, tuần không hợp lệ): BE `feasibility` của preview hoặc 400 khi tạo; chặn Next, không có nút tự sửa. */
  readonly feasibilityIssue: Feasibility | null
  /** Các cách sửa người dùng có thể bấm (chỉ những gì wizard biểu diễn được); không bao giờ tự áp. */
  readonly shiftFixes: readonly ShiftFix[]
  readonly applyShiftFix: (fix: ShiftFix) => void
  readonly estimate: TdeeEstimate | null
  readonly isEstimateLoading: boolean
  /** Lỗi của `GET /onboarding/estimate` (vd. 400 BE báo thiếu câu trả lời); null = không lỗi. */
  readonly estimateError: unknown
  readonly isEstimateRetrying: boolean
  readonly retryEstimate: () => void
  /** Lỗi của bản xem trước program không phải Calorie Shift; null = không lỗi. */
  readonly previewError: unknown
  readonly isPreviewRetrying: boolean
  readonly retryPreview: () => void
  readonly plan: PlanId
  readonly setPlan: (plan: PlanId) => void
  readonly consent: { readonly health: boolean; readonly privacy: boolean }
  readonly setConsent: (consent: { health: boolean; privacy: boolean }) => void
  readonly acceptConsent: () => void
  readonly onReadyReached: () => void
}

const PREVIEW_DEBOUNCE_MS = 600

/** Máy trạng thái của wizard thiết lập: bước hiện tại, đáp án, lưu BE từng bước Basics, xem trước, tạo program, đồng ý điều khoản. */
export function useOnboardingWizard(initial: OnboardingState): OnboardingWizard {
  const router = useRouter()
  const [today] = useState(todayIso)
  // Bản nháp Goal / Program (sessionStorage, theo tài khoản) được đặt lên lúc khởi tạo; Basics luôn từ BE (xem `bootOf`)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const [boot] = useState(() => bootOf(initial, userId))
  const [answers, setAnswers] = useState<WizardAnswers>(boot.answers)
  const [stepId, setStepId] = useState<StepId>(boot.stepId)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [readyReached, setReadyReached] = useState(false)
  const [plan, setPlan] = useState<PlanId>('monthly')
  const [consent, setConsent] = useState({ health: false, privacy: false })
  const [error, setError] = useState<string | null>(null)
  // Tạo program bị BE từ chối vì Calorie Shift (preview lệch với lúc tạo); xoá khi người dùng đổi đáp án
  const [createProblem, setCreateProblem] = useState<CalorieShiftProblem | null>(null)
  // Tạo program bị BE từ chối 400 vì target không khả thi không phải do shift (cùng `FeasibilityResponse` với preview); xoá cùng `createProblem`
  const [createFeasibility, setCreateFeasibility] = useState<Feasibility | null>(null)
  const saveBasics = useSaveBasics()
  const createProgram = useCreateOnboardingProgram()
  const complete = useCompleteOnboarding()
  const estimateQuery = useTdeeEstimate(stepId === 'estimate')

  const previewRequest = useMemo(
    () => (PREVIEW_STEPS.includes(stepId) ? previewRequestOf(answers) : null),
    [stepId, answers]
  )
  // Kéo thước/thanh trượt đổi đáp án liên tục: chỉ gọi BE khi người dùng dừng tay PREVIEW_DEBOUNCE_MS.
  // Lần vào bước đầu tiên (chưa có giá trị đã debounce) gọi ngay để màn không phải chờ.
  const settledRequest = useDebounce(previewRequest, PREVIEW_DEBOUNCE_MS)
  const request = previewRequest === null ? null : (settledRequest ?? previewRequest)
  const previewQuery = useProgramPreview(request)
  const preview = previewQuery.data ?? undefined
  // Lỗi là của lần tính đã chốt; đang chờ debounce (đáp án vừa đổi) thì chưa biết kết quả, không hiện vấn đề cũ
  const previewSettled = JSON.stringify(request) === JSON.stringify(previewRequest)
  // Preview HTTP 200 mang `feasibility` (không ném lỗi); 400 của Create mang cùng `FeasibilityResponse` trong `data`
  const shiftProblem =
    createProblem ??
    (previewSettled
      ? (calorieShiftProblemOf(previewQuery.error) ??
        calorieShiftProblemOfFeasibility(preview?.feasibility))
      : null)
  const infeasible =
    createFeasibility ?? (previewSettled ? infeasibleOf(preview?.feasibility) : null)
  const feasibilityIssue = infeasible && !isShiftInfeasible(infeasible) ? infeasible : null
  const shiftFixes = shiftProblem ? shiftFixesOf(shiftProblem) : []

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
    setAnswers((current) => applyAnswers(current, partial))
    setCreateProblem(null)
    setCreateFeasibility(null)
  }, [])

  const onReadyReached = useCallback(() => setReadyReached(true), [])

  // Dọn bản nháp (tài khoản khác, hỏng, hoặc BE không còn báo đang dở) rồi lưu nháp mỗi khi đáp án / bước đổi. Bản nháp đã được khôi phục lúc khởi tạo state (`bootOf`)
  // nên lần lưu đầu không ghi đè nó bằng giá trị mặc định.
  const resumable = isResumable(initial)
  useEffect(() => {
    if (userId !== null) pruneDrafts(userId, resumable)
  }, [userId, resumable])
  useEffect(() => {
    if (userId === null || !isDraftStep(stepId)) return
    writeDraft(draftOf(answers, stepId, userId))
  }, [userId, answers, stepId])

  // Đặt đúng giá trị BE đề xuất, chỉ khi người dùng bấm nút; chạm tới % / kiểu chia chứ không bao giờ tới macro
  const applyShiftFix = (fix: ShiftFix) => {
    const { shiftPercent, shiftMode } = fix.change
    patch({
      ...(shiftPercent !== undefined && { shiftPercent }),
      ...(shiftMode && { shiftMode }),
    })
    toast.success(fix.result)
  }

  // Loại mới: cân mục tiêu + tốc độ về GỢI Ý và chưa xác nhận (cùng loại thì giữ nguyên)
  const setGoalType = (goal: 'WeightLoss' | 'Maintenance' | 'WeightGain') => {
    setAnswers((current) => chooseGoalType(current, goal))
    setCreateProblem(null)
    setCreateFeasibility(null)
  }

  // Chỉ xác nhận đúng những giá trị đang hiện; người dùng đã kéo / gõ thì phần đó đã xác nhận từ trước
  const confirmGoalSuggestions = () =>
    patch({
      targetWeightKg: answers.targetWeightKg ?? answers.weightKg,
      weeklyRatePercent: answers.weeklyRatePercent,
    })

  const canNext = canProceed({
    stepId,
    answers,
    today,
    preview,
    readyReached,
    shiftBlocked: shiftProblem !== null || feasibilityIssue !== null,
  })

  const go = (target: StepId, how: 'forward' | 'back') => {
    setDirection(how)
    setStepId(target)
    // Mỗi lần vào lại màn Review phải cuộn tới cuối lần nữa (đáp án phía trước có thể đã đổi nên chữ giải thích cũng đổi)
    setReadyReached(false)
  }

  const next = async () => {
    setError(null)
    setCreateProblem(null)
    setCreateFeasibility(null)
    try {
      if (stepId === 'ready') {
        await createProgram.mutateAsync(programRequestOf(answers, preview))
        // Chỉ xoá nháp khi tạo THÀNH CÔNG (mutateAsync không ném lỗi); lỗi thì nhảy xuống catch và giữ nháp để thử lại
        if (userId !== null) clearDraft(userId)
      } else {
        const payload = basicsPayload(stepId, answers)
        if (payload) await saveBasics.mutateAsync(payload)
      }
      const target = visibleSteps[index + 1]
      if (target) go(target, 'forward')
    } catch (failure) {
      logger.error(failure)
      // Calorie Shift 400 khi tạo program: nêu ngày hỏng + cách sửa thay vì câu lỗi chung
      const problem = stepId === 'ready' ? calorieShiftProblemOf(failure) : null
      // Target không khả thi nhưng không do shift (400 `FeasibilityResponse`, nothing persisted): nêu vi phạm + cách chỉnh của BE
      const refused = stepId === 'ready' && !problem ? feasibilityOfError(failure) : null
      if (problem) setCreateProblem(problem)
      else if (refused) setCreateFeasibility(refused)
      else setError(getFormErrorMessage(failure))
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
      if (userId !== null) clearDraft(userId)
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
    confirmGoalSuggestions,
    today,
    sectionTitle: SECTION_TITLE[section],
    progress,
    // Sau khi đã tạo program thì không lùi về các bước tạo program nữa (tạo lại sẽ thay thế program vừa tạo)
    canGoBack: index > 1 && SECTION_OF[stepId] !== 'finish',
    canNext,
    // Chưa chọn tỉ lệ mỡ thì nút thành "Bỏ qua" (BE rơi về công thức Mifflin-St Jeor)
    nextLabel:
      stepId === 'bodyFat' && answers.bodyFat === null
        ? 'Skip, I am not sure'
        : (NEXT_LABEL[stepId] ?? 'Next'),
    pendingLabel: stepId === 'ready' ? 'Creating program...' : 'Saving...',
    isPending: saveBasics.isPending || createProgram.isPending || complete.isPending,
    error,
    next: () => void next(),
    back,
    preview,
    shiftProblem,
    feasibilityIssue,
    shiftFixes,
    applyShiftFix,
    estimate: estimateQuery.data ?? null,
    isEstimateLoading: estimateQuery.isLoading,
    estimateError: estimateQuery.isError ? estimateQuery.error : null,
    isEstimateRetrying: estimateQuery.isFetching,
    retryEstimate: () => void estimateQuery.refetch(),
    // Lỗi preview KHÔNG phải Calorie Shift (vd. 400 thiếu câu trả lời Basics): hiện lỗi + thử lại, không tự bịa số
    previewError:
      previewSettled && previewQuery.isError && !shiftProblem ? previewQuery.error : null,
    isPreviewRetrying: previewQuery.isFetching,
    retryPreview: () => void previewQuery.refetch(),
    plan,
    setPlan,
    consent,
    setConsent,
    acceptConsent: () => void acceptConsent(),
    onReadyReached,
  }
}
