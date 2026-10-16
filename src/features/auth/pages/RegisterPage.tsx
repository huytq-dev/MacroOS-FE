'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { authService } from '@/features/auth/services/auth.service'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirmPassword: '', firstName: '', lastName: '', gender: 'Male' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    if (isSubmitting) return
    setFormError(null)
    try {
      await authService.register(values)
      setRegisteredEmail(values.email)
    } catch (error) {
      logger.error(error)
      setFormError(getFormErrorMessage(error))
    }
  }

  const footer = (
    <>
      Đã có tài khoản?{' '}
      <Link href={routePath.login} className="text-primary font-medium hover:underline">
        Đăng nhập
      </Link>
    </>
  )

  if (registeredEmail)
    return (
      <AuthShell title="Kiểm tra email" footer={footer}>
        <div role="status" className="bg-mf-pastel-green text-mf-pastel-green-text flex items-start gap-3 rounded-xl p-4 text-sm">
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            Đã gửi link xác thực tới <strong className="break-all">{registeredEmail}</strong>. Sau khi đăng nhập, dán token trong email vào trang xác thực.
          </p>
        </div>
      </AuthShell>
    )

  return (
    <AuthShell title="Tạo tài khoản" description="Mất khoảng một phút. Hồ sơ cơ thể bổ sung sau." footer={footer}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormErrorAlert title="Không tạo được tài khoản" message={formError} />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Họ" required error={errors.lastName?.message}>
            {(field) => <Input {...field} autoComplete="family-name" {...register('lastName')} />}
          </FormField>
          <FormField label="Tên" required error={errors.firstName?.message}>
            {(field) => <Input {...field} autoComplete="given-name" {...register('firstName')} />}
          </FormField>
        </div>

        <FormField label="Giới tính" required error={errors.gender?.message}>
          {(field) => (
            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger id={field.id} aria-invalid={field['aria-invalid']} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4} position="popper">
                    {enumOptions(GENDER).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <FormField label="Mật khẩu" hint="Tối thiểu 8 ký tự" required error={errors.password?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" {...register('password')} />}
        </FormField>

        <FormField label="Nhập lại mật khẩu" required error={errors.confirmPassword?.message}>
          {(field) => <PasswordInput {...field} autoComplete="new-password" {...register('confirmPassword')} />}
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </Button>
      </form>
    </AuthShell>
  )
}
