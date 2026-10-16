'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { applyServerFieldErrors, getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/password-reset.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { token: searchParams.get('token') ?? '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (isSubmitting) return
    setFormError(null)
    try {
      await authService.resetPassword({ ...values, token: values.token.trim() })
      toast.success('Đã đặt lại mật khẩu')
      router.replace(routePath.login)
    } catch (error) {
      logger.error(error)
      setFormError(
        applyServerFieldErrors(error, { setError, setFocus }, [
          'token',
          'newPassword',
          'confirmPassword',
        ])
          ? null
          : getFormErrorMessage(error)
      )
    }
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Dán token nhận qua email rồi nhập mật khẩu mới."
      footer={
        <Link
          href={routePath.login}
          className="text-foreground font-medium underline underline-offset-4"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormErrorAlert title="Không đặt lại được mật khẩu" message={formError} />

        <FormField
          label="Token"
          hint="Có trong email chúng tôi đã gửi"
          required
          error={errors.token?.message}
        >
          {(field) => (
            <Input
              {...field}
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              {...register('token')}
            />
          )}
        </FormField>

        <FormField
          label="Mật khẩu mới"
          hint="Tối thiểu 8 ký tự"
          required
          error={errors.newPassword?.message}
        >
          {(field) => (
            <PasswordInput {...field} autoComplete="new-password" {...register('newPassword')} />
          )}
        </FormField>

        <FormField label="Nhập lại mật khẩu" required error={errors.confirmPassword?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          )}
        </FormField>

        <Button
          type="submit"
          className="h-12 w-full text-base md:h-10 md:text-sm"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  )
}
