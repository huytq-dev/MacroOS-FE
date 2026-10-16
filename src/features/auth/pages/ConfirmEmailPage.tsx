'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

function ConfirmEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [tokenError, setTokenError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isPending) return
    if (!token.trim()) {
      setTokenError('Dán token nhận qua email')
      return
    }
    setTokenError(undefined)
    setFormError(null)
    setIsPending(true)
    try {
      await authService.confirmEmail(token.trim())
      toast.success('Đã xác thực email')
      router.replace(routePath.dashboard)
    } catch (error) {
      logger.error(error)
      setFormError(getFormErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-base font-semibold">Xác thực email</h1>
      <Card className="max-w-lg rounded-2xl py-5">
        <CardContent className="px-5">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Cần xác thực email trước khi dùng các tính năng chính.
            </p>
            <FormErrorAlert title="Không xác thực được email" message={formError} />
            <FormField
              label="Token"
              hint="Có trong email chúng tôi đã gửi"
              required
              error={tokenError}
            >
              {(field) => (
                <Input
                  {...field}
                  autoCapitalize="none"
                  spellCheck={false}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
              )}
            </FormField>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? 'Đang xác thực...' : 'Xác thực email'}
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
