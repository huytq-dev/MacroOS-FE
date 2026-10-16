'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { routePath } from '@/config/route-path'
import { logger } from '@/lib/logger'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) return
    setFormError(null)
    try {
      await login(values)
      router.replace(searchParams.get('redirect') ?? routePath.dashboard)
    } catch (error) {
      logger.error(error)
      setFormError(getFormErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormErrorAlert title="Không đăng nhập được" message={formError} />

      <FormField label="Email" required error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
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

      <div className="space-y-1.5">
        <FormField label="Mật khẩu" required error={errors.password?.message}>
          {(control) => <PasswordInput {...control} autoComplete="current-password" placeholder="Nhập mật khẩu" {...register('password')} />}
        </FormField>
        <div className="flex justify-end">
          <Link href={routePath.forgotPassword} className="text-primary text-xs font-medium hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
    </form>
  )
}
