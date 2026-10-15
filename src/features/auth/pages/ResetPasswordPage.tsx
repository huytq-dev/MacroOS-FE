'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FieldError } from '@/features/auth/components/FieldError'
import { authService } from '@/features/auth/services/auth.service'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas/password-reset.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routePath } from '@/config/route-path'
import { getErrorMessage, isSystemError, logger } from '@/lib/api'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token.trim()) {
      toast.error('Thiếu token đặt lại mật khẩu')
      return
    }
    try {
      await authService.resetPassword({ token: token.trim(), ...values })
      toast.success('Đã đặt lại mật khẩu, đăng nhập lại nhé')
      router.replace(routePath.login)
    } catch (error) {
      logger.error(error)
      if (!isSystemError(error)) toast.error(getErrorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      footer={
        <Link href={routePath.login} className="text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="token">Token (từ email)</Label>
          <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
          <FieldError message={errors.newPassword?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
          Đặt lại mật khẩu
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
