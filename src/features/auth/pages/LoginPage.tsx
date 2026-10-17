'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoginForm } from '@/features/auth/components/login/LoginForm'
import { AuthAltAction } from '@/features/auth/components/AuthAltAction'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'

function LoginPageInner() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(searchParams.get('redirect') ?? routePath.dashboard)
    }
  }, [isAuthenticated, isLoading, router, searchParams])

  // Chỉ thay form bằng skeleton khi đang khôi phục phiên; không gỡ form lúc submit (UI.md mục 23)
  if (isLoading) {
    return (
      <div
        className="bg-background flex min-h-dvh items-start justify-center px-4 pt-10 sm:items-center"
        aria-busy="true"
      >
        <div className="w-full max-w-sm space-y-6">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to see today's log."
      footer={
        <AuthAltAction
          prompt="Don't have an account?"
          label="Create account"
          href={routePath.register}
        />
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}

export function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
