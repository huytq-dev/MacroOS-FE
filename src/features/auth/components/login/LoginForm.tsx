'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { applyServerFieldErrors, getFormErrorMessage } from '@/features/auth/auth.utils'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { IconInput } from '@/components/shared/IconInput'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  // Sau khi đăng nhập thành công, giữ nút ở trạng thái chờ cho tới khi trang đổi (tránh nháy nút bấm lại được)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const isPending = isSubmitting || isRedirecting

  const onSubmit = async (values: LoginFormValues) => {
    if (isPending) return
    setFormError(null)
    try {
      await login(values)
      setIsRedirecting(true)
      router.replace(searchParams.get('redirect') ?? routePath.dashboard)
    } catch (error) {
      logger.error(error)
      setFormError(
        applyServerFieldErrors(error, { setError, setFocus }, ['email', 'password'])
          ? null
          : getFormErrorMessage(error)
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormErrorAlert title="Không đăng nhập được" message={formError} />

      <FormField label="Email" required error={errors.email?.message}>
        {(control) => (
          <IconInput
            {...control}
            startIcon={Mail}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ten@email.com"
            className="h-12 md:h-10 md:text-sm"
            {...register('email')}
          />
        )}
      </FormField>

      <FormField
        label="Mật khẩu"
        required
        error={errors.password?.message}
        labelAction={
          <Link
            href={routePath.forgotPassword}
            className="text-foreground text-xs font-medium underline underline-offset-4"
          >
            Quên mật khẩu?
          </Link>
        }
      >
        {(control) => (
          <PasswordInput
            {...control}
            startIcon={Lock}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            className="h-12 md:h-10 md:text-sm"
            {...register('password')}
          />
        )}
      </FormField>

      <Button
        type="submit"
        className="h-12 w-full text-base md:h-10 md:text-sm"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </form>
  )
}
