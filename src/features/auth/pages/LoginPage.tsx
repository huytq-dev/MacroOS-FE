'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoginForm } from '@/features/auth/components/login/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'
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
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <Logo height={28} />
        <Card className="shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="font-sans text-base font-semibold">Đăng nhập</CardTitle>
            <CardDescription>Nhập email và mật khẩu để tiếp tục</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
