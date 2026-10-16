'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas/password-reset.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (isSubmitting) return
    setFormError(null)
    try {
      await authService.forgotPassword(values.email)
      setSent(true)
    } catch (error) {
      logger.error(error)
      setFormError(getFormErrorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email của bạn, chúng tôi gửi token đặt lại mật khẩu (hiệu lực 15 phút)."
      footer={
        <Link href={routePath.login} className="text-primary font-medium hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3">
          <div role="status" className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-4 text-sm">
            <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>Nếu email tồn tại, bạn sẽ nhận được hướng dẫn trong ít phút.</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={routePath.resetPassword}>Tôi đã có token</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormErrorAlert title="Không gửi được hướng dẫn" message={formError} />
          <FormField label="Email" required error={errors.email?.message}>
            {(field) => (
              <Input
                {...field}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="ten@email.com"
                {...register('email')}
              />
            )}
          </FormField>
          <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isSubmitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
