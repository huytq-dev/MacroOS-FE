'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

type Status = 'idle' | 'verifying' | 'success' | 'error'

const RESEND_COOLDOWN_SECONDS = 60
const emailSchema = z.string().email()

/** Gửi lại email xác thực: BE giới hạn 1 email/60 giây nên nút khóa đếm ngược cùng nhịp. */
function ResendSection({ initialEmail }: { readonly initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const onResend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isPending || cooldown > 0) return
    if (!emailSchema.safeParse(email.trim()).success) {
      setEmailError('Email không đúng định dạng')
      return
    }
    setEmailError(undefined)
    setError(null)
    setIsPending(true)
    try {
      await authService.resendVerification(email.trim())
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (caught) {
      logger.error(caught)
      setError(getFormErrorMessage(caught))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={onResend} noValidate className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        <span>Chưa nhận được email?</span>
        <span className="bg-border h-px flex-1" />
      </div>
      <FormErrorAlert title="Không gửi lại được" message={error} />
      {cooldown > 0 && (
        <div
          role="status"
          className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-3 text-sm"
        >
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>Đã gửi email mới. Kiểm tra hộp thư, kể cả thư rác.</p>
        </div>
      )}
      <FormField label="Email đã đăng ký" required error={emailError}>
        {(field) => (
          <Input
            {...field}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ten@email.com"
            className="h-12 md:h-10 md:text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </FormField>
      <Button
        type="submit"
        variant="outline"
        className="h-12 w-full text-base md:h-10 md:text-sm"
        disabled={isPending || cooldown > 0}
        aria-busy={isPending}
      >
        {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isPending
          ? 'Đang gửi...'
          : cooldown > 0
            ? `Gửi lại sau ${cooldown}s`
            : 'Gửi lại email xác thực'}
      </Button>
    </form>
  )
}

function ConfirmEmailInner() {
  const searchParams = useSearchParams()
  const linkToken = searchParams.get('token') ?? ''
  const initialEmail = searchParams.get('email') ?? ''

  // Có token trên link thì tự xác thực ngay khi mở trang, không bắt người dùng bấm thêm
  const [status, setStatus] = useState<Status>(linkToken ? 'verifying' : 'idle')
  const [token, setToken] = useState(linkToken)
  const [tokenError, setTokenError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const autoStarted = useRef(false)

  const verify = async (value: string) => {
    try {
      await authService.confirmEmail(value)
      setStatus('success')
    } catch (caught) {
      logger.error(caught)
      setError(getFormErrorMessage(caught))
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!linkToken || autoStarted.current) return
    autoStarted.current = true
    void verify(linkToken)
  }, [linkToken])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (status === 'verifying') return
    if (!token.trim()) {
      setTokenError('Dán mã nhận qua email')
      return
    }
    setTokenError(undefined)
    setError(null)
    setStatus('verifying')
    void verify(token.trim())
  }

  if (status === 'success')
    return (
      <AuthShell
        title="Email đã xác thực"
        description="Giờ bạn đăng nhập và bắt đầu dùng được rồi."
      >
        <div
          role="status"
          className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-4 text-sm"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>Tài khoản của bạn đã được kích hoạt.</p>
        </div>
        <Button asChild className="h-12 w-full text-base md:h-10 md:text-sm">
          <Link href={routePath.login}>Đăng nhập</Link>
        </Button>
      </AuthShell>
    )

  if (status === 'verifying')
    return (
      <AuthShell title="Đang xác thực email">
        <div
          role="status"
          aria-busy="true"
          className="text-muted-foreground flex items-center gap-3 py-4 text-sm"
        >
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          Đang xác thực...
        </div>
      </AuthShell>
    )

  return (
    <AuthShell
      title="Xác thực email"
      description="Mở link trong email chúng tôi đã gửi. Link không mở được thì dán mã vào đây."
      footer={
        <Link
          href={routePath.login}
          className="text-foreground font-medium underline underline-offset-4"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormErrorAlert title="Không xác thực được email" message={error} />
        <FormField
          label="Mã xác thực"
          hint="Có trong email, ngay dưới nút Xác thực email"
          required
          error={tokenError}
        >
          {(field) => (
            <Input
              {...field}
              autoCapitalize="none"
              autoComplete="one-time-code"
              spellCheck={false}
              className="h-12 md:h-10 md:text-sm"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          )}
        </FormField>
        <Button type="submit" className="h-12 w-full text-base md:h-10 md:text-sm">
          Xác thực email
        </Button>
      </form>
      <ResendSection initialEmail={initialEmail} />
    </AuthShell>
  )
}

export function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailInner />
    </Suspense>
  )
}
