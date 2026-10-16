'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoginForm } from '@/features/auth/components/login/LoginForm'
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

  if (isLoading || isAuthenticated) {
    return (
      <div className="bg-background flex min-h-dvh items-start justify-center px-4 pt-10 sm:items-center" aria-busy="true">
        <div className="w-full max-w-sm space-y-6">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      title="Đăng nhập"
      description="Nhập email và mật khẩu để tiếp tục theo dõi calo."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href={routePath.register} className="text-primary font-medium hover:underline">
            Tạo tài khoản
          </Link>
        </>
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
