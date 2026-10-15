import type { Metadata } from 'next'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

export const metadata: Metadata = { title: 'Quên mật khẩu' }

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />
}
