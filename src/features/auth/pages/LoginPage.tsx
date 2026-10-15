'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoginForm } from '@/features/auth/components/login/LoginForm'
import { AuthShell } from '@/features/auth/components/AuthShell'
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
      <div className="bg-background flex min-h-screen items-center justify-center" aria-busy="true">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthShell
      title="Đăng nhập"
      description="Nhập email và mật khẩu để tiếp tục"
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href={routePath.register} className="text-primary hover:underline">
            Đăng ký
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
