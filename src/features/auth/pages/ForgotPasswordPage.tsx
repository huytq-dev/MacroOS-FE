'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { applyServerFieldErrors, getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/password-reset.schema'
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
    setError,
    setFocus,
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
      setFormError(
        applyServerFieldErrors(error, { setError, setFocus }, ['email'])
          ? null
          : getFormErrorMessage(error)
      )
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email and we'll send you a password reset token (valid for 15 minutes)."
      footer={
        <Link
          href={routePath.login}
          className="text-foreground font-medium underline underline-offset-4"
        >
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3">
          <div
            role="status"
            className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-4 text-sm"
          >
            <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>
              If an account exists for that email, you&apos;ll get instructions within a few
              minutes.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={routePath.resetPassword}>I already have a token</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormErrorAlert title="Couldn't send instructions" message={formError} />
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
          <Button
            type="submit"
            className="h-12 w-full text-base md:h-10 md:text-sm"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isSubmitting ? 'Sending...' : 'Send instructions'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
