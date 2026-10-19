'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { useFlowStore } from '@/stores/flow.store'
import { useProgramWizardStore } from '@/stores/program-wizard.store'
import { stepHref, stepsFor, type WizardStep } from '../utils/new-program-steps'

/**
 * Điều hướng của wizard New Program: danh sách bước theo kiểu program đã chọn, bước kế / lùi (đặt hướng trượt trước khi đổi route)
 * và đóng. Vào thẳng một bước giữa chừng khi chưa chọn kiểu program (tải lại trang) thì quay về hub.
 */
export function useWizardNav(step: WizardStep) {
  const router = useRouter()
  const programType = useProgramWizardStore((state) => state.programType)
  const reset = useProgramWizardStore((state) => state.reset)
  const setDirection = useFlowStore((state) => state.setDirection)
  const steps = stepsFor(programType)
  const index = Math.max(steps.indexOf(step), 0)

  useEffect(() => {
    if (step !== 'style' && programType === null) router.replace(stepHref('style'))
  }, [step, programType, router])

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
        reset()
        router.push(routePath.program)
      }
    },
    close: () => {
      setDirection('back')
      reset()
      router.push(routePath.program)
    },
  }
}
