'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { authService } from '@/features/auth/services/auth.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routePath } from '@/config/route-path'
import { getErrorMessage, isSystemError, logger } from '@/lib/api'

function ConfirmEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token.trim()) {
      toast.error('Vui lòng dán token từ email')
      return
    }
    setIsPending(true)
    try {
      await authService.confirmEmail(token.trim())
      toast.success('Email đã được xác thực')
      router.replace(routePath.dashboard)
    } catch (error) {
      logger.error(error)
      if (!isSystemError(error)) toast.error(getErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-base font-semibold">Xác thực email</h1>
      <Card size="sm" className="max-w-lg">
        <CardHeader>
          <CardTitle>Dán token nhận qua email</CardTitle>
          <CardDescription>Cần xác thực email trước khi dùng các tính năng chính.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="token">Token</Label>
              <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Xác thực
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailInner />
    </Suspense>
  )
}
