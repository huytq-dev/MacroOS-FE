'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { useFlowStore } from '@/stores/flow.store'
import { useGoalEditStore } from '@/stores/goal-edit.store'
import { useProgramWizardStore } from '@/stores/program-wizard.store'
import {
  firstUnansweredBefore,
  stepHref,
  stepsFor,
  type WizardStep,
} from '../utils/new-program-steps'

/**
 * Điều hướng của wizard New Program: danh sách bước theo kiểu program đã chọn, bước kế / lùi (đặt hướng trượt trước khi đổi route)
 * và đóng. Vào thẳng một bước giữa chừng khi chưa chọn kiểu program (tải lại trang) thì quay về hub.
 */
export function useWizardNav(step: WizardStep) {
  const router = useRouter()
  const programType = useProgramWizardStore((state) => state.programType)
  const dietStyle = useProgramWizardStore((state) => state.dietStyle)
  const floor = useProgramWizardStore((state) => state.floor)
  const trainingType = useProgramWizardStore((state) => state.trainingType)
  const distribution = useProgramWizardStore((state) => state.distribution)
  const proteinLevel = useProgramWizardStore((state) => state.proteinLevel)
  const manualMode = useProgramWizardStore((state) => state.manualMode)
  const days = useProgramWizardStore((state) => state.days)
  const manualDays = useProgramWizardStore((state) => state.manualDays)
  const reset = useProgramWizardStore((state) => state.reset)
  // Bỏ dở wizard (về hub / đóng) thì goal đã chốt ở Edit Goal cũng bị bỏ, để New Program lần sau không dùng lại goal cũ
  const clearPendingGoal = () => useGoalEditStore.getState().setPendingGoal(null)
  const setDirection = useFlowStore((state) => state.setDirection)
  const steps = stepsFor(programType)
  const index = Math.max(steps.indexOf(step), 0)
  // Đang rời wizard (đóng / xong): `reset()` làm mọi câu hỏi thành chưa trả lời, effect bên dưới sẽ đẩy về bước 'style' và đè lên điều hướng ra Strategy
  const leaving = useRef(false)

  // Vào thẳng một bước sau (hoặc Review) khi bước trước chưa trả lời: về bước chưa trả lời ĐẦU TIÊN để mặc định của `buildProgramRequest` (Even, Balanced…)
  // không bao giờ được gửi khi user chưa xác nhận. Chưa chọn kiểu program thì đó là bước 'style'.
  useEffect(() => {
    const unanswered = firstUnansweredBefore(step, {
      programType,
      dietStyle,
      floor,
      trainingType,
      distribution,
      proteinLevel,
      manualMode,
      days,
      manualDays,
    })
    if (unanswered && !leaving.current) router.replace(stepHref(unanswered))
  }, [
    step,
    programType,
    dietStyle,
    floor,
    trainingType,
    distribution,
    proteinLevel,
    manualMode,
    days,
    manualDays,
    router,
  ])

  return {
    steps,
    index,
    progress: (index + 1) / steps.length,
    next: () => {
      setDirection('forward')
      router.push(stepHref(steps[Math.min(index + 1, steps.length - 1)]))
    },
    back: () => {
      setDirection('back')
      if (index > 0) router.push(stepHref(steps[index - 1]))
      else {
        leaving.current = true
        reset()
        clearPendingGoal()
        router.push(routePath.program)
      }
    },
    close: () => {
      leaving.current = true
      setDirection('back')
      reset()
      clearPendingGoal()
      router.push(routePath.program)
    },
  }
}
