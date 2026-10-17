'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthAltAction } from '@/features/auth/components/AuthAltAction'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { applyServerFieldErrors, getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { PickerSelect } from '@/components/shared/PickerSelect'
import { Input } from '@/components/ui/input'
import { GENDER, enumOptions } from '@/config/enums'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

export function RegisterPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    if (isSubmitting) return
    setFormError(null)
    try {
      await authService.register(values)
      setRegisteredEmail(values.email)
    } catch (error) {
      logger.error(error)
      setFormError(
        applyServerFieldErrors(error, { setError, setFocus }, [
          'email',
          'password',
          'confirmPassword',
          'firstName',
          'lastName',
          'gender',
        ])
          ? null
          : getFormErrorMessage(error)
      )
    }
  }

  const footer = (
    <AuthAltAction prompt="Already have an account?" label="Log in" href={routePath.login} />
  )

  if (registeredEmail)
    return (
      <AuthShell title="Check your email" footer={footer}>
        <div
          role="status"
          className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-4 text-sm"
        >
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            We sent a verification email to <strong className="break-all">{registeredEmail}</strong>
            . Open it and tap the link to activate your account, then come back and log in.
          </p>
        </div>
        <Button asChild variant="outline" className="h-12 w-full text-base md:h-10 md:text-sm">
          <Link href={`${routePath.confirmEmail}?email=${encodeURIComponent(registeredEmail)}`}>
            Link not working? Enter the code or resend
          </Link>
        </Button>
      </AuthShell>
    )

  return (
    <AuthShell
      title="Create account"
      description="Takes about a minute. You can add body details later."
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormErrorAlert title="Couldn't create account" message={formError} />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" required error={errors.firstName?.message}>
            {(field) => <Input {...field} autoComplete="given-name" {...register('firstName')} />}
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            {(field) => <Input {...field} autoComplete="family-name" {...register('lastName')} />}
          </FormField>
        </div>

        <FormField label="Gender" required error={errors.gender?.message}>
          {(field) => (
            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange } }) => (
                <PickerSelect
                  {...field}
                  title="Gender"
                  options={enumOptions(GENDER)}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />
          )}
        </FormField>

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

        <FormField
          label="Password"
          hint="At least 8 characters"
          required
          error={errors.password?.message}
        >
          {(field) => (
            <PasswordInput {...field} autoComplete="new-password" {...register('password')} />
          )}
        </FormField>

        <FormField label="Confirm password" required error={errors.confirmPassword?.message}>
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
