'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FieldError } from '@/features/auth/components/FieldError'
import { authService } from '@/features/auth/services/auth.service'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas/password-reset.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routePath } from '@/config/route-path'
import { getErrorMessage, isSystemError, logger } from '@/lib/api'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword(values.email)
      setSent(true)
    } catch (error) {
      logger.error(error)
      if (!isSystemError(error)) toast.error(getErrorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email, chúng tôi gửi token đặt lại mật khẩu (hiệu lực 15 phút)."
      footer={
        <Link href={routePath.login} className="text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <p className="text-xs">
          Nếu email tồn tại, bạn sẽ nhận được hướng dẫn. Có token rồi?{' '}
          <Link href={routePath.resetPassword} className="text-primary hover:underline">
            Đặt lại mật khẩu
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            Gửi hướng dẫn
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
