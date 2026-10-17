'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingState } from '../hooks/use-onboarding'
import { routePath } from '@/config/route-path'

/**
 * Chưa có program hoặc chưa đồng ý điều khoản thì chuyển thẳng vào wizard thiết lập (như MacroFactor).
 * Lỗi tải trạng thái thì cho vào app bình thường để không khoá người dùng khi API chập chờn.
 */
export function OnboardingGuard({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter()
  const state = useOnboardingState()
  const required = state.data?.isRequired === true

  useEffect(() => {
    if (required) router.replace(routePath.onboarding)
  }, [required, router])

  if (state.isLoading || required)
    return <div className="bg-background min-h-dvh" aria-busy="true" />
  return <>{children}</>
}
