'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FieldError } from '@/features/auth/components/FieldError'
import { authService } from '@/features/auth/services/auth.service'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GENDER, enumOptions } from '@/config/enums'
import { routePath } from '@/config/route-path'
import { getErrorMessage, isSystemError, logger } from '@/lib/api'

export function RegisterPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', firstName: '', lastName: '', gender: 'Male' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await authService.register(values)
      setRegisteredEmail(values.email)
    } catch (error) {
      logger.error(error)
      if (!isSystemError(error)) toast.error(getErrorMessage(error))
    }
  }

  const footer = (
    <>
      Đã có tài khoản?{' '}
      <Link href={routePath.login} className="text-primary hover:underline">
        Đăng nhập
      </Link>
    </>
  )

  if (registeredEmail)
    return (
      <AuthShell title="Kiểm tra email" footer={footer}>
        <div className="flex flex-col items-center gap-2 text-center">
          <MailCheck className="text-mf-green size-8" aria-hidden="true" />
          <p className="text-xs">
            Đã gửi link xác thực tới <strong>{registeredEmail}</strong>. Sau khi đăng nhập, dán token vào trang xác thực email.
          </p>
        </div>
      </AuthShell>
    )

  return (
    <AuthShell title="Đăng ký" description="Tạo tài khoản MacroOS" footer={footer}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Họ</Label>
            <Input id="lastName" autoComplete="family-name" {...register('lastName')} />
            <FieldError message={errors.lastName?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Tên</Label>
            <Input id="firstName" autoComplete="given-name" {...register('firstName')} />
            <FieldError message={errors.firstName?.message} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Giới tính</Label>
          <select
            id="gender"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1"
            {...register('gender')}
          >
            {enumOptions(GENDER).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
          Tạo tài khoản
        </Button>
      </form>
    </AuthShell>
  )
}
